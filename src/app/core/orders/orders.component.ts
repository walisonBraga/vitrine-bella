import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../auth/auth.service';
import { PreRegistrationService } from '../../module/admin-vitrineBella/shared/services/pre-registration.service';
import { LojaUsersService } from '../../module/admin-vitrineBella/users/service/loja-users.service';
import { Subject, takeUntil } from 'rxjs';
import { NavbarHomeComponent } from '../navbar-home/components/navbar-home/navbar-home.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    NavbarHomeComponent
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  user: any = null;
  purchaseHistory: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private preRegistrationService: PreRegistrationService,
    private lojaUsersService: LojaUsersService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        if (user) {
          this.loadPurchaseHistory();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPurchaseHistory(): void {
    if (!this.user) return;

    this.isLoading = true;
    this.errorMessage = '';

    console.log('Buscando histórico para usuário:', this.user.uid);

    // Buscar diretamente o usuário atual pelo UID
    this.getUserById(this.user.uid);
  }

  private getUserById(userId: string): void {
    // Buscar todos os usuários (incluindo clientes)
    this.lojaUsersService.getAllUsers().subscribe({
      next: (users) => {
        console.log('Todos os usuários encontrados:', users);
        const currentUser = users.find(u => u.uid === userId);
        console.log('Usuário atual encontrado:', currentUser);
        
        if (currentUser && currentUser.salesHistory && currentUser.salesHistory.length > 0) {
          // Usuário tem histórico de vendas
          console.log('Histórico encontrado no usuário:', currentUser.salesHistory);
          this.purchaseHistory = currentUser.salesHistory;
          this.isLoading = false;
        } else {
          // Tentar buscar em pré-cadastros se o usuário tem CPF
          if (this.user.cpf) {
            console.log('Buscando em pré-cadastros para CPF:', this.user.cpf);
            this.loadFromPreRegistration();
          } else {
            console.log('Nenhum histórico encontrado');
            this.purchaseHistory = [];
            this.isLoading = false;
          }
        }
      },
      error: (error) => {
        console.error('Erro ao carregar usuário:', error);
        this.errorMessage = 'Erro ao carregar dados do usuário';
        this.isLoading = false;
      }
    });
  }

  private loadFromPreRegistration(): void {
    if (!this.user.cpf) {
      this.isLoading = false;
      return;
    }

    this.preRegistrationService.getSalesHistory(this.user.cpf)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sales) => {
          console.log('Vendas encontradas em pré-cadastros:', sales);
          this.purchaseHistory = sales;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar histórico de pré-cadastro:', error);
          this.purchaseHistory = [];
          this.isLoading = false;
        }
      });
  }

  formatDate(date: any): string {
    if (!date) return 'Data não informada';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  getTotalItems(sale: any): number {
    if (!sale.items || !Array.isArray(sale.items)) return 0;
    return sale.items.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
  }

  getTotalSpent(): number {
    return this.purchaseHistory.reduce((total: number, purchase: any) => {
      return total + (purchase.amount || 0);
    }, 0);
  }

  trackByPurchaseId(index: number, purchase: any): string {
    return purchase.saleId || purchase.id || index.toString();
  }

  getPurchaseStatus(purchase: any): string {
    // Para compras da loja física, assumir que são todas concluídas
    return 'Concluída';
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'concluída':
      case 'concluido':
      case 'completed':
        return 'success';
      case 'pendente':
      case 'pending':
        return 'warn';
      case 'cancelada':
      case 'cancelled':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getTotalItemsCount(): number {
    return this.purchaseHistory.reduce((total: number, purchase: any) => {
      return total + this.getTotalItems(purchase);
    }, 0);
  }
}
