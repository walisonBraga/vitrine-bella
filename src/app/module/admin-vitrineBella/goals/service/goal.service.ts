import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { collection, doc, Firestore, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Goal, SalesRanking, GoalStats, GoalFilter } from '../interface/goal.interface';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private goalsSubject = new BehaviorSubject<Goal[]>([]);
  public goals$ = this.goalsSubject.asObservable();

  private goals: Goal[] = [];
  private goalsCollection = collection(this.firestore, 'goals');

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private firestore: Firestore
  ) {
    this.loadGoalsFromFirebase();
    this.startAutoCloseCheck();
  }

  // Verificação automática de fechamento do mês
  private startAutoCloseCheck(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Verificar a cada minuto se precisa fechar o mês
    setInterval(() => {
      this.checkAndCloseMonth();
    }, 60000); // 60 segundos

    // Verificar imediatamente ao carregar
    this.checkAndCloseMonth();
  }

  private checkAndCloseMonth(): void {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Verificar se estamos nos últimos minutos do mês
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    const isLastDay = now.getDate() === lastDayOfMonth;
    const isLastHour = now.getHours() === 23;
    const isLastMinutes = now.getMinutes() >= 55; // Últimos 5 minutos

    if (isLastDay && isLastHour && isLastMinutes) {
      // Verificar se o mês ainda não foi fechado
      if (!this.isMonthClosed(currentMonth, currentYear)) {
        this.closeMonth(currentMonth, currentYear).subscribe({
          next: () => {
          },
          error: (error) => {
          }
        });
      }
    }
  }

  // Adicionar nova meta
  addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Observable<void> {
    // Verificar se já existe uma meta para o mesmo usuário, mês e ano
    const existingGoal = this.goals.find(g =>
      g.userId === goal.userId &&
      g.month === goal.month &&
      g.year === goal.year
    );

    if (existingGoal) {
      return from(Promise.reject(new Error('Já existe uma meta para este usuário neste período')));
    }

    const newGoal: Goal = {
      ...goal,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const goalDoc = doc(this.goalsCollection, newGoal.id);
    return from(setDoc(goalDoc, {
      ...newGoal,
      createdAt: newGoal.createdAt.toISOString(),
      updatedAt: newGoal.updatedAt.toISOString()
    })).pipe(
      switchMap(() => {
        this.goals.unshift(newGoal);
        this.goalsSubject.next([...this.goals]);
        return from(Promise.resolve());
      })
    );
  }

  // Atualizar meta
  updateGoal(id: string, updates: Partial<Goal>): Observable<void> {
    const goalDoc = doc(this.goalsCollection, id);
    
    // Filtrar campos undefined para evitar erro do Firebase
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const updateData = {
      ...filteredUpdates,
      updatedAt: new Date().toISOString()
    };

    return from(updateDoc(goalDoc, updateData)).pipe(
      switchMap(() => {
        const index = this.goals.findIndex(goal => goal.id === id);
        if (index !== -1) {
          this.goals[index] = {
            ...this.goals[index],
            ...filteredUpdates,
            updatedAt: new Date()
          };
          this.goalsSubject.next([...this.goals]);
        }
        return from(Promise.resolve());
      })
    );
  }

  // Obter todas as metas
  getGoals(): Observable<Goal[]> {
    return this.goals$;
  }

  // Obter metas filtradas
  getFilteredGoals(filter: GoalFilter): Goal[] {
    return this.goals.filter(goal => {
      if (filter.userId && goal.userId !== filter.userId) return false;
      if (filter.month && goal.month !== filter.month) return false;
      if (filter.year && goal.year !== filter.year) return false;
      if (filter.status && goal.status !== filter.status) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        if (!goal.userName.toLowerCase().includes(searchLower) &&
          !goal.userEmail.toLowerCase().includes(searchLower)) return false;
      }
      return true;
    });
  }

  // Obter ranking de vendas
  getSalesRanking(month?: number, year?: number): SalesRanking[] {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const monthlyGoals = this.goals.filter(goal =>
      goal.month === targetMonth && goal.year === targetYear
    );

    const rankings: SalesRanking[] = monthlyGoals.map(goal => {
      const goalAchievement = goal.targetAmount > 0 ?
        (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const commission = goal.currentAmount * (goal.commissionPercentage / 100);

      return {
        userId: goal.userId,
        userName: goal.userName,
        userEmail: goal.userEmail,
        totalSales: goal.currentAmount,
        goalAchievement: Math.round(goalAchievement * 100) / 100,
        commission: Math.round(commission * 100) / 100,
        rank: 0, // Será calculado depois
        month: targetMonth,
        year: targetYear
      };
    });

    // Ordenar por vendas e atribuir ranking
    rankings.sort((a, b) => b.totalSales - a.totalSales);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  // Obter estatísticas das metas
  getGoalStats(month?: number, year?: number): GoalStats {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const currentGoals = this.goals.filter(goal =>
      goal.month === targetMonth && goal.year === targetYear
    );

    const totalGoals = currentGoals.length;
    const activeGoals = currentGoals.filter(goal => goal.status === 'active').length;
    const completedGoals = currentGoals.filter(goal => goal.status === 'completed').length;
    const expiredGoals = currentGoals.filter(goal => goal.status === 'expired').length;

    const totalTargetAmount = currentGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = currentGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const averageAchievement = totalTargetAmount > 0 ?
      (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    const rankings = this.getSalesRanking(targetMonth, targetYear);
    const topPerformer = rankings.length > 0 ? rankings[0] : null;

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      expiredGoals,
      totalTargetAmount,
      totalCurrentAmount,
      averageAchievement: Math.round(averageAchievement * 100) / 100,
      topPerformer
    };
  }

  // Calcular dias restantes para o fim do mês
  getDaysRemaining(): number {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffTime = lastDay.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calcular dias desde o início do mês
  getDaysPassed(): number {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const diffTime = now.getTime() - firstDay.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Verificar se meta foi atingida
  isGoalAchieved(goal: Goal): boolean {
    return goal.currentAmount >= goal.targetAmount;
  }

  // Calcular progresso da meta
  getGoalProgress(goal: Goal): number {
    return goal.targetAmount > 0 ?
      Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  }

  // Atualizar vendas de uma meta
  updateSales(goalId: string, salesAmount: number): Observable<void> {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal) {
      goal.currentAmount += salesAmount;

      // Verificar se meta foi atingida
      if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
        goal.status = 'completed';
      }

      return this.updateGoal(goalId, goal);
    }
    return from(Promise.resolve());
  }

  // Calcular ganhos totais do mês
  private calculateMonthlyEarnings(month: number, year: number): number {
    const monthlyGoals = this.goals.filter(goal =>
      goal.month === month && goal.year === year
    );

    return monthlyGoals.reduce((total, goal) => {
      const commission = goal.currentAmount * (goal.commissionPercentage / 100);
      return total + commission;
    }, 0);
  }

  // Fechamento automático do mês
  closeMonth(month: number, year: number): Observable<void> {
    const monthlyGoals = this.goals.filter(goal =>
      goal.month === month && goal.year === year && goal.status === 'active'
    );

    const totalEarnings = this.calculateMonthlyEarnings(month, year);

    const updatePromises = monthlyGoals.map(goal => {
      goal.status = 'completed';
      goal.updatedAt = new Date();

      const goalDoc = doc(this.goalsCollection, goal.id!);
      return updateDoc(goalDoc, {
        status: 'completed',
        updatedAt: goal.updatedAt.toISOString()
      });
    });

    return from(Promise.all(updatePromises)).pipe(
      switchMap(() => {
        this.goalsSubject.next([...this.goals]);
        return from(Promise.resolve());
      })
    );
  }

  // Obter ganhos totais do mês (método público)
  getMonthlyEarnings(month: number, year: number): number {
    return this.calculateMonthlyEarnings(month, year);
  }

  // Calcular comissão total de um usuário no mês
  getUserMonthlyCommission(userId: string, month: number, year: number): number {
    const userGoals = this.goals.filter(goal =>
      goal.userId === userId && goal.month === month && goal.year === year
    );

    return userGoals.reduce((total, goal) => {
      return total + (goal.currentAmount * (goal.commissionPercentage / 100));
    }, 0);
  }

  // Obter relatório de fechamento do mês
  getMonthlyClosingReport(month: number, year: number): any[] {
    const monthlyGoals = this.goals.filter(goal =>
      goal.month === month && goal.year === year
    );

    return monthlyGoals.map(goal => {
      const commission = goal.currentAmount * (goal.commissionPercentage / 100);
      const goalAchievement = goal.targetAmount > 0 ?
        (goal.currentAmount / goal.targetAmount) * 100 : 0;

      return {
        userId: goal.userId,
        userName: goal.userName,
        userEmail: goal.userEmail,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        commissionPercentage: goal.commissionPercentage,
        commission: commission,
        goalAchievement: Math.round(goalAchievement * 100) / 100,
        status: goal.status,
        isGoalAchieved: goalAchievement >= 100
      };
    });
  }

  // Verificar se o mês pode ser fechado
  canCloseMonth(month: number, year: number): boolean {
    const now = new Date();
    const targetDate = new Date(year, month - 1, 1); // month - 1 porque Date usa 0-11

    // Só pode fechar se já passou do mês
    return now > targetDate;
  }

  // Obter dias restantes para fechamento automático
  getDaysUntilAutoClose(month: number, year: number): number {
    const now = new Date();
    const lastDay = new Date(year, month, 0); // Último dia do mês
    const diffTime = lastDay.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Reabrir mês fechado
  reopenMonth(month: number, year: number): Observable<void> {
    const monthlyGoals = this.goals.filter(goal =>
      goal.month === month && goal.year === year && goal.status === 'completed'
    );

    const updatePromises = monthlyGoals.map(goal => {
      goal.status = 'active';
      goal.updatedAt = new Date();

      const goalDoc = doc(this.goalsCollection, goal.id!);
      return updateDoc(goalDoc, {
        status: 'active',
        updatedAt: goal.updatedAt.toISOString()
      });
    });

    return from(Promise.all(updatePromises)).pipe(
      switchMap(() => {
        this.goalsSubject.next([...this.goals]);
        return from(Promise.resolve());
      })
    );
  }

  // Verificar se o mês está fechado
  isMonthClosed(month: number, year: number): boolean {
    const monthlyGoals = this.goals.filter(goal =>
      goal.month === month && goal.year === year
    );

    if (monthlyGoals.length === 0) return false;

    // Se todas as metas estão concluídas, o mês está fechado
    return monthlyGoals.every(goal => goal.status === 'completed');
  }

  // Deletar meta
  deleteGoal(id: string): Observable<void> {
    const goalDoc = doc(this.goalsCollection, id);

    return from(deleteDoc(goalDoc)).pipe(
      switchMap(() => {
        const index = this.goals.findIndex(goal => goal.id === id);
        if (index !== -1) {
          this.goals.splice(index, 1);
          this.goalsSubject.next([...this.goals]);
        }
        return from(Promise.resolve());
      })
    );
  }

  // Obter metas de um usuário específico por accessCode
  getUserGoalsByAccessCode(accessCode: string, month?: number, year?: number): Goal[] {
    let userGoals = this.goals.filter(goal =>
      goal.accessCode === accessCode || goal.userId.startsWith(accessCode)
    );

    if (month && year) {
      userGoals = userGoals.filter(goal =>
        goal.month === month && goal.year === year
      );
    }

    return userGoals;
  }

  private generateId(): string {
    return uuidv4();
  }

  private loadGoalsFromFirebase(): void {
    from(getDocs(this.goalsCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
        } as Goal;
      }))
    ).subscribe({
      next: (goals) => {
        this.goals = goals;
        this.goalsSubject.next([...this.goals]);
      },
      error: (error) => {
        console.error('Erro ao carregar metas do Firebase:', error);
      }
    });
  }
}
