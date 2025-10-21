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
import { SalesService } from '../../module/admin-vitrineBella/sales/service/sales.service';
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
    private lojaUsersService: LojaUsersService,
    private salesService: SalesService
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
    // Buscar diretamente o usuário atual pelo UID
    this.getUserById(this.user.uid);
  }

  private getUserById(userId: string): void {
    // Buscar todos os usuários (incluindo clientes)
    this.lojaUsersService.getAllUsers().subscribe({
      next: (users) => {
        const currentUser = users.find(u => u.uid === userId);
        if (currentUser && currentUser.salesHistory && currentUser.salesHistory.length > 0) {
          // Usuário tem histórico de vendas na conta
          this.purchaseHistory = currentUser.salesHistory;
          this.isLoading = false;
        } else {
          // Buscar vendas pelo accessCPF se o usuário tem CPF
          if (this.user.cpf) {
            this.loadFromSalesByAccessCPF();
          } else {
            // Se não tem CPF, tentar buscar por email
            if (this.user.email) {
              this.loadFromSalesByEmail();
            } else {
              this.purchaseHistory = [];
              this.isLoading = false;
            }
          }
        }
      },
      error: (error) => {
        this.errorMessage = 'Erro ao carregar dados do usuário';
        this.isLoading = false;
      }
    });
  }

  private loadFromSalesByAccessCPF(): void {
    if (!this.user.cpf) {
      this.isLoading = false;
      return;
    }

    // Formatar CPF para busca (60995610053 -> 609.956.100-53)
    const formattedCpf = this.formatCpfForSearch(this.user.cpf);

    // Buscar vendas pelo accessCPF formatado
    this.salesService.getSalesByAccessCPF(formattedCpf)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sales) => {
          if (sales && sales.length > 0) {
            // Mapear as vendas para o formato esperado
            this.purchaseHistory = sales.map(sale => ({
              saleId: sale.id,
              date: sale.createdAt,
              amount: sale.finalAmount,
              items: sale.items.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.productPrice
              })),
              paymentMethod: sale.paymentMethod,
              status: sale.status
            }));
          } else {
            this.purchaseHistory = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.purchaseHistory = [];
          this.isLoading = false;
        }
      });
  }

  private loadFromSalesByEmail(): void {
    if (!this.user.email) {
      this.isLoading = false;
      return;
    }

    // Buscar vendas por email do cliente
    this.salesService.getSalesByCustomerEmail(this.user.email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sales) => {
          if (sales && sales.length > 0) {
            // Mapear as vendas para o formato esperado
            this.purchaseHistory = sales.map(sale => ({
              saleId: sale.id,
              date: sale.createdAt,
              amount: sale.finalAmount,
              items: sale.items.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.productPrice
              })),
              paymentMethod: sale.paymentMethod,
              status: sale.status
            }));
          } else {
            this.purchaseHistory = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
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

  private formatCpfForSearch(cpf: string): string {
    if (!cpf) return '';

    // Remover formatação existente
    const cleanCpf = cpf.replace(/[.\-\s]/g, '');

    // Verificar se tem 11 dígitos
    if (cleanCpf.length !== 11) return cpf;

    // Formatar para 000.000.000-00
    return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
