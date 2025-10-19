import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';


import { Goal, GoalFilter, GoalStats, SalesRanking } from '../../interface/goal.interface';
import { GoalService } from '../../service/goal.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { CreateGoalModalComponent } from '../../create-goal-modal/create-goal-modal.component';
import { UpdateSalesModalComponent } from '../../update-sales-modal/update-sales-modal.component';
import { MonthClosingModalComponent } from '../../month-closing-modal/month-closing-modal.component';
import { LogService } from '../../../logs/service/log.service';
import { UserContextService } from '../../../logs/service/user-context.service';

@Component({
  selector: 'app-goals-management',
  templateUrl: './goals-management.component.html',
  styleUrls: ['./goals-management.component.scss']
})
export class GoalsManagementComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['userName', 'month', 'targetAmount', 'currentAmount', 'progress', 'commission', 'status', 'actions'];
  dataSource = new MatTableDataSource<Goal>([]);

  goals: Goal[] = [];
  rankings: SalesRanking[] = [];
  stats: GoalStats | null = null;
  monthlyEarnings = 0;

  isLoading = true;
  currentUser: any = null;
  userRole: string = '';

  // Filtros
  filter: GoalFilter = {};
  searchTerm = '';

  // Período atual
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  selectedMonth = this.currentMonth;
  selectedYear = this.currentYear;

  constructor(
    public goalService: GoalService,
    private authService: AuthService,
    private logService: LogService,
    private userContextService: UserContextService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadGoals();
    // Rankings e stats serão carregados após as metas serem carregadas
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.userRole = this.currentUser?.role || '';
  }

  private loadGoals(): void {
    this.isLoading = true;
    this.goalService.getGoals()
      .pipe(takeUntil(this.destroy$))
      .subscribe((goals: Goal[]) => {
        this.goals = goals;
        this.applyFilters();
        this.loadRankings();
        this.loadStats();
        this.isLoading = false;
      });
  }

  private loadRankings(): void {
    this.rankings = this.goalService.getSalesRanking(this.selectedMonth, this.selectedYear);
  }

  private loadStats(): void {
    this.stats = this.goalService.getGoalStats(this.selectedMonth, this.selectedYear);
    this.monthlyEarnings = this.goalService.getMonthlyEarnings(this.selectedMonth, this.selectedYear);
  }

  applyFilters(): void {
    let filteredGoals = this.goals;

    // Filtrar por período
    filteredGoals = filteredGoals.filter(goal =>
      goal.month === this.selectedMonth && goal.year === this.selectedYear
    );

    // Se for funcionário, mostrar apenas suas metas usando accessCode
    if (this.currentUser && this.currentUser.role === 'store_employee') {
      const userAccessCode = this.currentUser.uid.substring(0, 10);
      filteredGoals = filteredGoals.filter(goal =>
        goal.accessCode === userAccessCode || goal.userId.startsWith(userAccessCode)
      );
    }

    // Aplicar filtros adicionais
    if (this.filter.status) {
      filteredGoals = filteredGoals.filter(goal => goal.status === this.filter.status);
    }

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filteredGoals = filteredGoals.filter(goal =>
        goal.userName.toLowerCase().includes(searchLower) ||
        goal.userEmail.toLowerCase().includes(searchLower)
      );
    }

    // Se for funcionário, mostrar apenas suas metas
    if (this.userRole === 'store_employee') {
      filteredGoals = filteredGoals.filter(goal => goal.userId === this.currentUser?.uid);
    }

    this.dataSource.data = filteredGoals;
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onPeriodChange(): void {
    this.loadRankings();
    this.applyFilters();
  }

  createGoal(): void {
    const dialogRef = this.dialog.open(CreateGoalModalComponent, {
      width: '600px',
      data: {
        month: this.selectedMonth,
        year: this.selectedYear
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.goalService.addGoal(result).subscribe({
          next: () => {
            this.loadGoals();
            this.loadRankings();
            this.loadStats();

            // Log da criação da meta
            const userInfo = this.userContextService.getCurrentUserInfo();
            this.logService.addLog({
              userId: userInfo.userId,
              userName: userInfo.userName,
              action: 'create',
              entity: 'goal',
              entityId: result.id,
              entityName: `${result.userName} - ${this.getMonthName(result.month)} ${result.year}`,
              details: `Meta criada: ${this.formatCurrency(result.targetAmount)} com ${result.commissionPercentage}% de comissão`,
              status: 'success'
            });

            this.snackBar.open('Meta criada com sucesso!', 'Fechar', { duration: 3000 });
          },
          error: (error) => {
            if (error.message && error.message.includes('Já existe uma meta')) {
              this.snackBar.open('Já existe uma meta para este usuário neste período!', 'Fechar', { duration: 5000 });
            } else {
              this.snackBar.open('Erro ao criar meta', 'Fechar', { duration: 3000 });
            }
          }
        });
      }
    });
  }

  editGoal(goal: Goal): void {
    const dialogRef = this.dialog.open(CreateGoalModalComponent, {
      width: '600px',
      data: { goal, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadGoals();
        this.loadRankings();
        this.loadStats();

        // Log da edição da meta
        const userInfo = this.userContextService.getCurrentUserInfo();
        this.logService.addLog({
          userId: userInfo.userId,
          userName: userInfo.userName,
          action: 'update',
          entity: 'goal',
          entityId: goal.id!,
          entityName: `${goal.userName} - ${this.getMonthName(goal.month)} ${goal.year}`,
          details: `Meta editada: ${this.formatCurrency(result.targetAmount)} com ${result.commissionPercentage}% de comissão`,
          status: 'success'
        });

        this.snackBar.open('Meta atualizada com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  updateSales(goal: Goal): void {
    const dialogRef = this.dialog.open(UpdateSalesModalComponent, {
      width: '400px',
      data: { goal }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.goalService.updateSales(goal.id!, result.salesAmount).subscribe({
          next: () => {
            this.loadGoals(); // Isso vai recarregar rankings e stats automaticamente

            // Log da atualização de vendas
            const userInfo = this.userContextService.getCurrentUserInfo();
            this.logService.addLog({
              userId: userInfo.userId,
              userName: userInfo.userName,
              action: 'update',
              entity: 'goal',
              entityId: goal.id!,
              entityName: `${goal.userName} - ${this.getMonthName(goal.month)} ${goal.year}`,
              details: `Vendas atualizadas: +${this.formatCurrency(result.salesAmount)} (Total: ${this.formatCurrency(goal.currentAmount + result.salesAmount)})`,
              status: 'success'
            });

            this.snackBar.open('Vendas atualizadas com sucesso!', 'Fechar', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open('Erro ao atualizar vendas', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteGoal(goal: Goal): void {
    if (confirm(`Tem certeza que deseja excluir a meta de ${goal.userName}?`)) {
      this.goalService.deleteGoal(goal.id!).subscribe({
        next: () => {
          // Log da exclusão da meta
          const userInfo = this.userContextService.getCurrentUserInfo();
          this.logService.addLog({
            userId: userInfo.userId,
            userName: userInfo.userName,
            action: 'delete',
            entity: 'goal',
            entityId: goal.id!,
            entityName: `${goal.userName} - ${this.getMonthName(goal.month)} ${goal.year}`,
            details: `Meta excluída: ${this.formatCurrency(goal.targetAmount)}`,
            status: 'success'
          });

          this.loadGoals(); // Isso vai recarregar rankings e stats automaticamente
          this.snackBar.open('Meta excluída com sucesso!', 'Fechar', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Erro ao excluir meta', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  // Métodos auxiliares
  getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || '';
  }

  getProgressColor(progress: number): string {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'primary';
    if (progress >= 50) return 'accent';
    return 'warn';
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  // Verificar permissões
  canCreateGoal(): boolean {
    return this.userRole === 'admin' || this.userRole === 'store_owner';
  }

  canEditGoal(goal: Goal): boolean {
    if (this.userRole === 'admin' || this.userRole === 'store_owner') {
      return true;
    }
    if (this.userRole === 'store_employee') {
      return goal.userId === this.currentUser?.uid;
    }
    return false;
  }

  canViewAllGoals(): boolean {
    return this.userRole === 'admin' || this.userRole === 'store_owner';
  }

  // Obter dados para ranking
  getRankingData(): SalesRanking[] {
    if (this.userRole === 'store_employee') {
      return this.rankings.filter(ranking => ranking.userId === this.currentUser?.uid);
    }
    return this.rankings;
  }

  // Obter dias restantes
  getDaysRemaining(): number {
    return this.goalService.getDaysRemaining();
  }

  // Obter dias passados
  getDaysPassed(): number {
    return this.goalService.getDaysPassed();
  }

  // Fechamento do mês
  openMonthClosing(): void {
    const dialogRef = this.dialog.open(MonthClosingModalComponent, {
      width: '800px',
      data: {
        month: this.selectedMonth,
        year: this.selectedYear
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.closed) {
        this.loadGoals();
        this.loadRankings();
        this.loadStats();
        this.snackBar.open('Mês fechado com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  // Verificar se pode fechar o mês
  canCloseMonth(): boolean {
    return this.goalService.canCloseMonth(this.selectedMonth, this.selectedYear);
  }

  // Obter dias até fechamento automático
  getDaysUntilAutoClose(): number {
    return this.goalService.getDaysUntilAutoClose(this.selectedMonth, this.selectedYear);
  }
}
