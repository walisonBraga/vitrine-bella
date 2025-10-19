import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoalService } from '../service/goal.service';
import { LogService } from '../../logs/service/log.service';
import { UserContextService } from '../../logs/service/user-context.service';

@Component({
  selector: 'app-reopen-month-modal',
  templateUrl: './reopen-month-modal.component.html',
  styleUrls: ['./reopen-month-modal.component.scss']
})
export class ReopenMonthModalComponent {
  reopenForm!: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReopenMonthModalComponent>,
    private snackBar: MatSnackBar,
    private goalService: GoalService,
    private logService: LogService,
    private userContextService: UserContextService,
    @Inject(MAT_DIALOG_DATA) public data: { month: number; year: number }
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.reopenForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    
    return null;
  }

  confirmReopen(): void {
    if (this.reopenForm.valid) {
      const password = this.reopenForm.get('password')?.value;
      
      // Verificar senha (em produção, isso seria validado no backend)
      if (password === 'admin123' || password === 'proprietario123') {
        this.loading = true;
        
        // Reabrir o mês
        this.goalService.reopenMonth(this.data.month, this.data.year).subscribe({
          next: () => {
            // Log da ação
            const userInfo = this.userContextService.getCurrentUserInfo();
            this.logService.addLog({
              userId: userInfo.userId,
              userName: userInfo.userName,
              action: 'reopen',
              entity: 'goal',
              entityName: `${this.getMonthName(this.data.month)} ${this.data.year}`,
              details: `Mês reaberto com sucesso`,
              status: 'success'
            });
            
            this.loading = false;
            this.dialogRef.close({ reopened: true });
            this.snackBar.open('Mês reaberto com sucesso!', 'Fechar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Erro ao reabrir mês:', error);
            this.loading = false;
            this.snackBar.open('Erro ao reabrir mês', 'Fechar', { duration: 3000 });
          }
        });
      } else {
        this.snackBar.open('Senha incorreta!', 'Fechar', { duration: 3000 });
      }
    } else {
      this.snackBar.open('Por favor, preencha todos os campos corretamente', 'Fechar', { duration: 3000 });
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

  getPasswordError(): string {
    const password = this.reopenForm.get('password');
    if (password?.hasError('required')) {
      return 'Senha é obrigatória';
    }
    if (password?.hasError('minlength')) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    return '';
  }

  getConfirmPasswordError(): string {
    const confirmPassword = this.reopenForm.get('confirmPassword');
    if (confirmPassword?.hasError('required')) {
      return 'Confirmação de senha é obrigatória';
    }
    if (confirmPassword?.hasError('passwordMismatch')) {
      return 'As senhas não coincidem';
    }
    return '';
  }
}
