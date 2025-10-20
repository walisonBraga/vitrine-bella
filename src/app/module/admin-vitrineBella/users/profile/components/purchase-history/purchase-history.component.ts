import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { PreRegistrationService } from '../../../../shared/services/pre-registration.service';
import { LojaUsersService } from '../../../service/loja-users.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-purchase-history',
  templateUrl: './purchase-history.component.html',
  styleUrls: ['./purchase-history.component.scss']
})
export class PurchaseHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  user: any = null;
  purchaseHistory: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private preRegistrationService: PreRegistrationService,
    private lojaUsersService: LojaUsersService
  ) { }

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

    // Primeiro, tentar buscar o histórico do usuário atual
    this.lojaUsersService.getLojaUsers().subscribe({
      next: (users) => {
        const currentUser = users.find(u => u.uid === this.user.uid);

        if (currentUser && currentUser.salesHistory && currentUser.salesHistory.length > 0) {
          // Usuário tem histórico de vendas
          this.purchaseHistory = currentUser.salesHistory;
          this.isLoading = false;
        } else if (this.user.cpf) {
          // Tentar buscar em pré-cadastros
          this.loadFromPreRegistration();
        } else {
          this.purchaseHistory = [];
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Erro ao carregar histórico:', error);
        this.errorMessage = 'Erro ao carregar histórico de compras';
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
      year: 'numeric'
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
}
