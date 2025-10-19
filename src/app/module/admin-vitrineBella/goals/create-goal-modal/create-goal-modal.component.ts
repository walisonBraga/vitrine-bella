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
    this.createUserService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          // Filtrar apenas usuários ativos
          this.users = users.filter(user => user.isActive);
          this.isLoadingUsers = false;
          
          // Habilitar o campo de usuário se não estiver editando
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

    this.goalForm = this.fb.group({
      userId: [{ value: goal?.userId || '', disabled: this.isEdit || this.isLoadingUsers }, Validators.required],
      userName: [goal?.userName || '', Validators.required],
      userEmail: [goal?.userEmail || '', Validators.required],
      month: [{ value: goal?.month || this.data?.month || currentMonth, disabled: this.isEdit }, Validators.required],
      year: [{ value: goal?.year || this.data?.year || currentYear, disabled: this.isEdit }, Validators.required],
      targetAmount: [goal?.targetAmount || 0, [Validators.required, Validators.min(1)]],
      currentAmount: [goal?.currentAmount || 0, [Validators.min(0)]],
      commissionPercentage: [goal?.commissionPercentage || 5, [Validators.required, Validators.min(0), Validators.max(100)]],
      status: [goal?.status || 'active', Validators.required]
    });
  }

    onUserChange(userId: string): void {
        const user = this.users.find(u => u.uid === userId);
        if (user) {
            this.goalForm.patchValue({
                userName: user.fullName,
                userEmail: user.email
            });
        }
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
      }
      
      this.loading = true;
      const currentUser = this.authService.getCurrentUser();
      
      // Usar o usuário selecionado, não o usuário logado
      const selectedUser = this.users.find(u => u.uid === formValue.userId);
      
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
        targetAmount: formValue.targetAmount,
        currentAmount: formValue.currentAmount,
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
    } else {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios', 'Fechar', { duration: 3000 });
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
}
