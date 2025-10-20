import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { GoalService } from '../service/goal.service';
import { Goal } from '../interface/goal.interface';
import { CreateUserService } from '../../users/service/create-user.service';
import { createUsersAdmin } from '../../users/interface/createUsersAdmin';

@Component({
  selector: 'app-create-goal-modal',
  templateUrl: './create-goal-modal.component.html',
  styleUrls: ['./create-goal-modal.component.scss']
})
export class CreateGoalModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  goalForm!: FormGroup;
  isEdit = false;
  loading = false;
  users: createUsersAdmin[] = [];
  isLoadingUsers = true;
  previousGoalInfo: { target: string; month: number; year: number } | null = null;
  previousSalesInfo: { sales: string; month: number; year: number } | null = null;

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
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateGoalModalComponent>,
    private snackBar: MatSnackBar,
    private goalService: GoalService,
    private authService: AuthService,
    private createUserService: CreateUserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = !!data?.goal;
  }

  ngOnInit(): void {
    this.loadUsers();
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {
    // Buscar somente usuários com roles válidas para metas (admin, store_owner, store_manager, store_employee)
    this.createUserService.getUsersByRole(['admin', 'store_owner', 'store_manager', 'store_employee'])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          // Filtrar apenas usuários ativos
          this.users = users.filter(user => user.isActive);
          this.isLoadingUsers = false;

          // Habilitar o campo de usuários se não estiver editando
          if (!this.isEdit) {
            this.goalForm.get('userId')?.enable();
          }
        },
        error: (error) => {
          this.snackBar.open('Erro ao carregar usuários', 'Fechar', { duration: 3000 });
          this.isLoadingUsers = false;
        }
      });
  }

  private initForm(): void {
    const goal = this.data?.goal;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Determinar status inicial baseado no mês/ano
    let initialStatus: 'active' | 'pending' | 'completed' | 'expired' = 'active';
    if (!this.isEdit) {
      const selectedMonth = this.data?.month || currentMonth;
      const selectedYear = this.data?.year || currentYear;

      // Se for mês futuro, começar como "pending"
      if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
        initialStatus = 'pending';
      }
    }


    this.goalForm = this.fb.group({
      userId: [{ value: goal?.userId || '', disabled: this.isEdit || this.isLoadingUsers }, Validators.required],
      userName: [goal?.userName || '', Validators.required],
      userEmail: [goal?.userEmail || '', Validators.required],
      month: [{ value: goal?.month || this.data?.month || currentMonth, disabled: this.isEdit }, Validators.required],
      year: [{ value: goal?.year || this.data?.year || currentYear, disabled: this.isEdit }, Validators.required],
      targetAmount: [goal?.targetAmount || 0, [Validators.required, Validators.min(1)]],
      currentAmount: [goal?.currentAmount || 0, [Validators.min(0)]],
      commissionPercentage: [goal?.commissionPercentage || "", [Validators.required, Validators.min(0), Validators.max(100)]],
      status: [goal?.status || initialStatus] // Sem validação obrigatória, definido automaticamente
    });
  }

  // Verificar se a meta pode ser ativada (mês atual ou passado)
  canActivateGoal(): boolean {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const goalMonth = this.goalForm.get('month')?.value;
    const goalYear = this.goalForm.get('year')?.value;
    const goalStatus = this.goalForm.get('status')?.value;

    // Só pode ativar se estiver pendente e for mês atual ou passado
    return goalStatus === 'pending' &&
      (goalYear < currentYear || (goalYear === currentYear && goalMonth <= currentMonth));
  }

  // Ativar meta pendente
  activateGoal(): void {
    this.goalForm.patchValue({ status: 'active' });
  }

  // Atualizar status quando mês/ano mudarem
  onPeriodChange(): void {
    if (!this.isEdit) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const selectedMonth = this.goalForm.get('month')?.value;
      const selectedYear = this.goalForm.get('year')?.value;

      // Determinar status baseado no mês/ano selecionado
      let newStatus: 'active' | 'pending' | 'completed' | 'expired' = 'active';
      if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
        newStatus = 'pending';
      }

      this.goalForm.patchValue({ status: newStatus });
    }
  }

  onUserChange(userId: string): void {
    const user = this.users.find(u => u.uid === userId);
    if (user) {
      this.goalForm.patchValue({
        userName: user.fullName,
        userEmail: user.email
      });

      // Buscar meta anterior do usuário
      this.loadPreviousGoal(userId);
    }
  }

  private loadPreviousGoal(userId: string): void {
    const currentMonth = this.goalForm.get('month')?.value;
    const currentYear = this.goalForm.get('year')?.value;

    // Calcular mês anterior
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;

    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = currentYear - 1;
    }

    // Buscar meta anterior e vendas do mês passado
    this.goalService.getGoals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (goals) => {
          const previousGoal = goals.find(goal =>
            goal.userId === userId &&
            goal.month === previousMonth &&
            goal.year === previousYear
          );

          if (previousGoal) {
            this.previousGoalInfo = {
              target: this.formatCurrencyValue(previousGoal.targetAmount),
              month: previousMonth,
              year: previousYear
            };

            // Vendas do mês passado (valor atual vendido)
            this.previousSalesInfo = {
              sales: this.formatCurrencyValue(previousGoal.currentAmount),
              month: previousMonth,
              year: previousYear
            };

            // Sugerir meta de vendas baseada na meta anterior (editável)
            if (!this.isEdit) {
              this.goalForm.patchValue({
                targetAmount: previousGoal.targetAmount
              });
            }
          } else {
            this.previousGoalInfo = null;
            this.previousSalesInfo = null;
          }
        },
        error: () => {
          this.previousGoalInfo = null;
          this.previousSalesInfo = null;
        }
      });
  }

  onSubmit(): void {
    if (this.goalForm.valid) {
      const formValue = this.goalForm.value;

      // Verificar se não está criando meta para mês passado
      if (!this.isEdit) {
        const selectedDate = new Date(formValue.year, formValue.month - 1, 1);
        const currentDate = new Date();
        const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        if (selectedDate < currentMonth) {
          this.snackBar.open('Não é possível criar metas para meses passados!', 'Fechar', { duration: 5000 });
          return;
        }

        // Verificar se já existe meta para este usuário no mesmo mês/ano
        this.goalService.getGoals().subscribe(goals => {
          const existingGoal = goals.find(goal =>
            goal.userId === formValue.userId &&
            goal.month === formValue.month &&
            goal.year === formValue.year
          );

          if (existingGoal) {
            this.snackBar.open('Já existe uma meta para este usuário neste período!', 'Fechar', { duration: 5000 });
            return;
          }

          // Se não existe meta duplicada, prosseguir com a criação
          this.createGoal();
        });
      } else {
        // Para edição, prosseguir normalmente
        this.createGoal();
      }
    } else {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios', 'Fechar', { duration: 3000 });
    }
  }

  private createGoal(): void {
    const formValue = this.goalForm.value;
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();

    // Para edição, usar os dados existentes da meta
    const userId = this.isEdit ? this.data.goal.userId : formValue.userId;
    const userName = this.isEdit ? this.data.goal.userName : formValue.userName;
    const userEmail = this.isEdit ? this.data.goal.userEmail : formValue.userEmail;

    const goalData = {
      userId: userId, // Usar o usuário selecionado ou existente
      userName: userName, // Nome do usuário selecionado ou existente
      userEmail: userEmail, // Email do usuário selecionado ou existente
      month: formValue.month,
      year: formValue.year,
      targetAmount: this.parseCurrencyValue(formValue.targetAmount),
      currentAmount: 0, // Nova meta sempre começa com 0
      commissionPercentage: formValue.commissionPercentage,
      status: formValue.status,
      createdBy: currentUser?.uid || 'unknown', // Quem criou (admin)
      accessCode: userId ? userId.substring(0, 10) : '' // Primeiros 10 caracteres do UID
    };

    if (this.isEdit) {
      this.goalService.updateGoal(this.data.goal.id, goalData).subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(goalData);
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Erro ao atualizar meta', 'Fechar', { duration: 3000 });
        }
      });
    } else {
      this.goalService.addGoal(goalData).subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(goalData);
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Erro ao criar meta', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Obter meses disponíveis (apenas mês atual e futuros)
  getAvailableMonths(): any[] {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    return this.months.filter(month => {
      const monthDate = new Date(currentYear, month.value - 1, 1);
      const currentMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return monthDate >= currentMonthDate;
    });
  }

  // Obter anos disponíveis (apenas ano atual e futuros)
  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    return this.years.filter(year => year >= currentYear);
  }

  // Converter valor formatado (ex: "10.000,00") para número
  private parseCurrencyValue(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
    const cleanValue = value.toString()
      .replace(/\./g, '')  // Remove pontos
      .replace(',', '.');  // Substitui vírgula por ponto

    return parseFloat(cleanValue) || 0;
  }

  // Converter número para valor formatado (ex: 10000 -> "10.000,00")
  private formatCurrencyValue(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
