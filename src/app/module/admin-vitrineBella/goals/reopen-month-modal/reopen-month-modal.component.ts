import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoalService } from '../service/goal.service';
import { LogService } from '../../logs/service/log.service';
import { UserContextService } from '../../logs/service/user-context.service';
import { Auth, reauthenticateWithCredential, EmailAuthProvider } from '@angular/fire/auth';
import { AuthService } from '../../../../core/auth/auth.service';

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
    private authService: AuthService,
    private auth: Auth,
    @Inject(MAT_DIALOG_DATA) public data: { month: number; year: number }
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.reopenForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async confirmReopen(): Promise<void> {
    if (this.reopenForm.valid) {
      const password = this.reopenForm.get('password')?.value;
      const currentUser = this.auth.currentUser;
      
      if (!currentUser || !currentUser.email) {
        this.snackBar.open('Usuário não autenticado', 'Fechar', { duration: 3000 });
        return;
      }

      try {
        this.loading = true;
        
        // Reautenticar o usuário com a senha fornecida
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        
        // Se chegou até aqui, a senha está correta
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
        
      } catch (error: any) {
        this.loading = false;
        
        // Verificar tipo de erro
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          this.snackBar.open('Senha incorreta', 'Fechar', { duration: 3000 });
        } else if (error.code === 'auth/too-many-requests') {
          this.snackBar.open('Muitas tentativas. Tente novamente mais tarde', 'Fechar', { duration: 3000 });
        } else {
          this.snackBar.open('Erro de autenticação', 'Fechar', { duration: 3000 });
        }
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
}
