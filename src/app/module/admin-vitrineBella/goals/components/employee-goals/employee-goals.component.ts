import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { Goal, SalesRanking } from '../../interface/goal.interface';
import { GoalService } from '../../service/goal.service';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-employee-goals',
  templateUrl: './employee-goals.component.html',
  styleUrls: ['./employee-goals.component.scss']
})
export class EmployeeGoalsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['userName', 'targetAmount', 'currentAmount', 'progress', 'commission', 'status'];
  goals: Goal[] = [];
  rankings: SalesRanking[] = [];
  isLoading = true;
  accessCode = '';
  employeeName = '';
  employeeEmail = '';
  hasAccess = false;

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  selectedMonth = this.currentMonth;
  selectedYear = this.currentYear;

  // Opções de meses e anos
  months = [
    { value: 1, name: 'Janeiro' },
    { value: 2, name: 'Fevereiro' },
    { value: 3, name: 'Março' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Maio' },
    { value: 6, name: 'Junho' },
    { value: 7, name: 'Julho' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Setembro' },
    { value: 10, name: 'Outubro' },
    { value: 11, name: 'Novembro' },
    { value: 12, name: 'Dezembro' }
  ];

  years = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1
  ];

  constructor(
    private goalService: GoalService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Tentar obter o código de acesso da URL ou localStorage
    this.getAccessCodeFromUrl();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getAccessCodeFromUrl(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      this.accessCode = code;
      this.hasAccess = true;
      this.loadEmployeeGoals();
    } else {
      // Se não houver código na URL, verificar se usuário está logado
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.uid) {
        // Usar os primeiros 10 caracteres do UID do usuário logado
        this.accessCode = currentUser.uid.substring(0, 10);
        this.hasAccess = true;
        this.loadEmployeeGoals();
      } else {
        // Se não estiver logado, mostrar formulário de entrada
        this.isLoading = false;
      }
    }
  }

  onAccessCodeSubmit(): void {
    if (!this.accessCode || this.accessCode.length < 10) {
      this.snackBar.open('Código de acesso deve ter pelo menos 10 caracteres', 'Fechar', { duration: 3000 });
      return;
    }
    this.hasAccess = true;
    this.loadEmployeeGoals();
  }

  private loadEmployeeGoals(): void {
    this.isLoading = true;

    this.goalService.getGoals()
      .pipe(takeUntil(this.destroy$))
      .subscribe((allGoals: Goal[]) => {
        // Filtrar metas do funcionário usando accessCode
        this.goals = this.goalService.getUserGoalsByAccessCode(this.accessCode);

        if (this.goals.length > 0) {
          // Obter informações do funcionário da primeira meta
          const firstGoal = this.goals[0];
          this.employeeName = firstGoal.userName;
          this.employeeEmail = firstGoal.userEmail;

          this.loadRankings();
          this.snackBar.open(`Bem-vindo, ${this.employeeName}!`, 'Fechar', { duration: 3000 });
        } else {
          this.snackBar.open('Nenhuma meta encontrada para este código de acesso', 'Fechar', { duration: 3000 });
        }

        this.isLoading = false;
      });
  }

  private loadRankings(): void {
    // Carregar ranking apenas do funcionário atual
    const allRankings = this.goalService.getSalesRanking(this.selectedMonth, this.selectedYear);
    this.rankings = allRankings.filter(ranking =>
      ranking.userId.startsWith(this.accessCode) ||
      this.goals.some(goal => goal.userId === ranking.userId)
    );
  }

  onPeriodChange(): void {
    this.loadRankings();
    this.applyFilters();
  }

  private applyFilters(): void {
    // Filtrar metas por período selecionado
    this.goals = this.goalService.getUserGoalsByAccessCode(this.accessCode, this.selectedMonth, this.selectedYear);
  }

  // Métodos auxiliares
  getMonthName(month: number): string {
    const monthObj = this.months.find(m => m.value === month);
    return monthObj ? monthObj.name : '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value / 100);
  }

  getProgressColor(progress: number): string {
    if (progress >= 100) {
      return 'primary'; // Verde
    } else if (progress >= 75) {
      return 'accent'; // Amarelo
    } else {
      return 'warn'; // Vermelho
    }
  }

  getGoalProgress(goal: Goal): number {
    return this.goalService.getGoalProgress(goal);
  }

  // Obter dias restantes
  getDaysRemaining(): number {
    const now = new Date();
    const lastDay = new Date(this.selectedYear, this.selectedMonth, 0);
    const diffTime = lastDay.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Verificar se pode ver dados do mês anterior
  canViewPreviousMonth(): boolean {
    const now = new Date();
    const selectedDate = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return selectedDate < currentMonth;
  }

  // Obter comissão total do funcionário no mês
  getEmployeeCommission(): number {
    const monthlyGoals = this.goals.filter(goal =>
      goal.month === this.selectedMonth && goal.year === this.selectedYear
    );

    return monthlyGoals.reduce((total, goal) => {
      return total + (goal.currentAmount * (goal.commissionPercentage / 100));
    }, 0);
  }

  // Obter posição no ranking
  getEmployeeRank(): number {
    const employeeRanking = this.rankings.find(ranking =>
      ranking.userId.startsWith(this.accessCode) ||
      this.goals.some(goal => goal.userId === ranking.userId)
    );

    return employeeRanking ? employeeRanking.rank || 0 : 0;
  }

  // Obter total de vendas do funcionário
  getEmployeeTotalSales(): number {
    const monthlyGoals = this.goals.filter(goal =>
      goal.month === this.selectedMonth && goal.year === this.selectedYear
    );

    return monthlyGoals.reduce((total, goal) => total + goal.currentAmount, 0);
  }

  // Obter percentual de atingimento da meta
  getEmployeeGoalAchievement(): number {
    const monthlyGoals = this.goals.filter(goal =>
      goal.month === this.selectedMonth && goal.year === this.selectedYear
    );

    if (monthlyGoals.length === 0) return 0;

    const totalTarget = monthlyGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = monthlyGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

    return totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  }
}
