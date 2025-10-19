export interface Goal {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  month: number; // 1-12
  year: number;
  targetAmount: number; // Meta em valor
  currentAmount: number; // Valor atual vendido
  commissionPercentage: number; // Porcentagem de comissão
  status: 'active' | 'completed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Quem criou a meta
  accessCode: string; // Código de acesso do usuário
}

export interface SalesRanking {
  userId: string;
  userName: string;
  userEmail: string;
  totalSales: number;
  goalAchievement: number; // Porcentagem da meta atingida
  commission: number; // Comissão calculada
  rank: number;
  month: number;
  year: number;
}

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  expiredGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  averageAchievement: number;
  topPerformer: SalesRanking | null;
}

export interface GoalFilter {
  userId?: string;
  month?: number;
  year?: number;
  status?: string;
  search?: string;
}
