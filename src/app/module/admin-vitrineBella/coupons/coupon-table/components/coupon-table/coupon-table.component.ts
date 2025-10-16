import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Coupon } from '../../../interface/coupon';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { CouponModalComponent } from '../../../../products/CouponModal/components/coupon-modal/coupon-modal.component';
import { CouponService } from '../../../service/coupon.service';

@Component({
  selector: 'app-coupon-table',
  templateUrl: './coupon-table.component.html',
  styleUrls: ['./coupon-table.component.scss']
})
export class CouponTableComponent implements OnInit {
  displayedColumns: string[] = ['code', 'name', 'discountPercentage', 'validPeriod', 'usage', 'status', 'actions'];
  dataSource = new MatTableDataSource<Coupon>([]);
  loading = false;
  searchTerm = '';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService,
    private couponService: CouponService
  ) { }

  ngOnInit(): void {
    this.loadCoupons();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadCoupons(): void {
    this.loading = true;

    this.subscription.add(
      this.couponService.getCoupons().subscribe({
        next: (coupons) => {
          this.dataSource.data = coupons;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar cupons:', error);
          this.snackBar.open('Erro ao carregar cupons: ' + error.message, 'Fechar', { duration: 3000 });
          this.loading = false;
        }
      })
    );
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  clearFilter(): void {
    this.searchTerm = '';
    this.dataSource.filter = '';
  }

  getStatusText(coupon: Coupon): string {
    if (!coupon.isActive) return 'Inativo';

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom) return 'Aguardando';
    if (now > validUntil) return 'Expirado';
    return 'Ativo';
  }

  getStatusClass(coupon: Coupon): string {
    if (!coupon.isActive) return 'status-inactive';

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom) return 'status-pending';
    if (now > validUntil) return 'status-expired';
    return 'status-active';
  }

  getUsagePercentage(coupon: Coupon): number {
    if (!coupon.usageLimit) return 0;
    return Math.round((coupon.usedCount / coupon.usageLimit) * 100);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  formatDateRange(coupon: Coupon): string {
    const startDate = this.formatDate(coupon.validFrom);
    const endDate = this.formatDate(coupon.validUntil);
    return `${startDate} - ${endDate}`;
  }

  // ===== AÇÕES DOS CUPONS =====

  createCoupon(): void {
    const dialogRef = this.dialog.open(CouponModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { mode: 'create' },
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCoupons();
        this.snackBar.open('Cupom criado com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  editCoupon(coupon: Coupon): void {
    const dialogRef = this.dialog.open(CouponModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { mode: 'edit', coupon },
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCoupons();
        this.snackBar.open('Cupom atualizado com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  async toggleCouponStatus(coupon: Coupon): Promise<void> {
    const newStatus = !coupon.isActive;
    const action = newStatus ? 'ativar' : 'desativar';

    try {
      if (coupon.id) {
        await this.couponService.updateCouponStatus(coupon.id, newStatus);
        this.snackBar.open(`Cupom ${action}do com sucesso!`, 'Fechar', { duration: 3000 });
      }
    } catch (error: any) {
      console.error('Erro ao alterar status do cupom:', error);
      this.snackBar.open('Erro ao alterar status do cupom: ' + error.message, 'Fechar', { duration: 3000 });
    }
  }

  copyCouponCode(code: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.snackBar.open('Código copiado para a área de transferência!', 'Fechar', { duration: 2000 });
      });
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.snackBar.open('Código copiado para a área de transferência!', 'Fechar', { duration: 2000 });
    }
  }

  deleteCoupon(coupon: Coupon): void {
    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o cupom "${coupon.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    });

    confirmDialog.afterClosed().subscribe(async (confirmed) => {
      if (confirmed && coupon.id) {
        try {
          await this.couponService.deleteCoupon(coupon.id);
          this.snackBar.open('Cupom excluído com sucesso!', 'Fechar', { duration: 3000 });
        } catch (error: any) {
          console.error('Erro ao excluir cupom:', error);
          this.snackBar.open('Erro ao excluir cupom: ' + error.message, 'Fechar', { duration: 3000 });
        }
      }
    });
  }
}

// Componente de confirmação simples
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-dialog">
      <h4>{{ data.title }}</h4>
      <p>{{ data.message }}</p>
      <div class="actions">
        <button mat-stroked-button (click)="onCancel()">{{ data.cancelText }}</button>
        <button mat-raised-button color="warn" (click)="onConfirm()">{{ data.confirmText }}</button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 24px;
      text-align: center;
    }
    .actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
