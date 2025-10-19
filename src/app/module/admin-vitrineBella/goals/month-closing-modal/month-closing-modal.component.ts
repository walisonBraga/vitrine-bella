import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoalService } from '../service/goal.service';
import { LogService } from '../../logs/service/log.service';
import { UserContextService } from '../../logs/service/user-context.service';

@Component({
  selector: 'app-month-closing-modal',
  templateUrl: './month-closing-modal.component.html',
  styleUrls: ['./month-closing-modal.component.scss']
})
export class MonthClosingModalComponent {
  loading = false;
  closingReport: any[] = [];
  totalCommissions = 0;

  constructor(
    private dialogRef: MatDialogRef<MonthClosingModalComponent>,
    private snackBar: MatSnackBar,
    private goalService: GoalService,
    private logService: LogService,
    private userContextService: UserContextService,
    @Inject(MAT_DIALOG_DATA) public data: { month: number; year: number }
  ) {
    this.loadClosingReport();
  }

  private loadClosingReport(): void {
    this.closingReport = this.goalService.getMonthlyClosingReport(this.data.month, this.data.year);
    this.totalCommissions = this.closingReport.reduce((total, item) => total + item.commission, 0);
  }

  confirmClosing(): void {
    if (confirm(`Tem certeza que deseja fechar o mês de ${this.getMonthName(this.data.month)} ${this.data.year}?\n\nIsso irá calcular as comissões finais e marcar as metas como concluídas.`)) {
      this.loading = true;
      
      // Fechar o mês
      this.goalService.closeMonth(this.data.month, this.data.year).subscribe({
        next: () => {
          // Log da ação
          const userInfo = this.userContextService.getCurrentUserInfo();
          this.logService.addLog({
            userId: userInfo.userId,
            userName: userInfo.userName,
            action: 'close',
            entity: 'goal',
            entityName: `${this.getMonthName(this.data.month)} ${this.data.year}`,
            details: `Fechamento do mês realizado. Total de comissões: ${this.formatCurrency(this.totalCommissions)}`,
            status: 'success'
          });
          
          this.loading = false;
          this.dialogRef.close({ closed: true });
          this.snackBar.open('Mês fechado com sucesso!', 'Fechar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Erro ao fechar mês:', error);
          this.loading = false;
          this.snackBar.open('Erro ao fechar mês', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'expired': return 'warn';
      default: return 'basic';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Ativa';
      case 'completed': return 'Concluída';
      case 'expired': return 'Expirada';
      default: return 'Desconhecido';
    }
  }
}
