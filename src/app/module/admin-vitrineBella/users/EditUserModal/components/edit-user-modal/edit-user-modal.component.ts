import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { CreateUserService } from '../../../service/create-user.service';
import { createUsersAdmin } from '../../../interface/createUsersAdmin';
import { AuthService } from '../../../../../../core/auth/auth.service';


@Component({
  selector: 'app-edit-user-modal',
  templateUrl: './edit-user-modal.component.html',
  styleUrls: ['./edit-user-modal.component.scss']
})
export class EditUserModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  editUserForm: FormGroup | undefined;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private dialogRef: MatDialogRef<EditUserModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: createUsersAdmin },
    private formBuilder: FormBuilder,
    private createUserService: CreateUserService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.populateForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.editUserForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: [''],
      role: ['', Validators.required],
      isActive: [true]
    }, { validators: this.passwordMatchValidator });
  }

  private populateForm(): void {
    const user = this.data.user;
    this.editUserForm?.patchValue({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form?.get('password');
    const confirmPassword = form?.get('confirmPassword');

    if (password && confirmPassword && password.value && confirmPassword.value) {
      return password.value === confirmPassword.value ? null : { passwordMismatch: true };
    }
    return null;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.editUserForm?.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }

    if (field?.hasError('email')) {
      return 'Email inválido';
    }

    if (field?.hasError('minlength')) {
      const requiredLength = field.errors?.['minlength']?.requiredLength;
      return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${requiredLength} caracteres`;
    }

    if (field?.hasError('maxlength')) {
      const requiredLength = field.errors?.['maxlength']?.requiredLength;
      return `${this.getFieldLabel(fieldName)} deve ter no máximo ${requiredLength} caracteres`;
    }

    if (this.editUserForm?.hasError('passwordMismatch')) {
      return 'As senhas não coincidem';
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Nome Completo',
      email: 'Email',
      password: 'Senha',
      confirmPassword: 'Confirmar Senha',
      role: 'Função'
    };
    return labels[fieldName] || fieldName;
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'store_employee':
        return 'Funcionário da Loja';
      case 'store_owner':
        return 'Proprietário da Loja';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  }

  onSubmit(): void {
    if (this.editUserForm?.valid) {
      this.isLoading = true;

      const formData = this.editUserForm.value;
      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      };

      // Se há nova senha, atualiza no Firebase Auth primeiro
      if (formData.password) {
        this.authService.updateUserPassword(this.data.user.uid, formData.password)
          .then(() => {
            // Senha atualizada no Auth, agora atualiza no Firestore
            this.updateUserInFirestore(updateData);
          })
          .catch((error: any) => {
            this.snackBar.open('Erro ao atualizar senha.', 'Fechar', { duration: 5000 });
            this.isLoading = false;
          });
      } else {
        // Sem nova senha, atualiza apenas no Firestore
        this.updateUserInFirestore(updateData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private updateUserInFirestore(updateData: any): void {
    this.createUserService.updateUser(this.data.user.uid, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Usuário atualizado com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.snackBar.open('Erro ao atualizar usuário.', 'Fechar', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editUserForm?.controls || {}).forEach(key => {
      const control = this.editUserForm?.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
