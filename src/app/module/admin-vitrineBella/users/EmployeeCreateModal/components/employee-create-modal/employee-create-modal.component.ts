import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { CreateUserService } from '../../../service/create-user.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { createUsersAdmin } from '../../../interface/createUsersAdmin';
import { ALL_PERMISSIONS, getDefaultPermissionsByRole, PERMISSION_LABELS } from '../../../../shared/constants/permissions.constants';


@Component({
  selector: 'app-employee-create-modal',
  templateUrl: './employee-create-modal.component.html',
  styleUrls: ['./employee-create-modal.component.scss']
})
export class EmployeeCreateModalComponent {
  createUserForm: FormGroup;
  errorMessage: string = '';
  selectedPermissions: string[] = ['/dashboard']; // Permissão padrão selecionada

  // Permissões disponíveis para managementType
  availablePermissions = ALL_PERMISSIONS.map((permission: string) => ({
    value: permission,
    label: PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS]
  }));

  isLoading = false;

  constructor(
    private createUserService: CreateUserService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EmployeeCreateModalComponent>
  ) {
    this.createUserForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      cpf: ['', [Validators.required, this.cpfValidator]],
      birthDate: ['', [Validators.required]],
      role: ['/admin', Validators.required], // Página de destino após login
      userRole: ['store_employee', Validators.required], // Função do usuário
      managementType: [['/dashboard'], Validators.required], // Permissões de navegação - Dashboard selecionado por padrão
      isActive: [true],
    });
  }

  onUserRoleChange(): void {
    const userRole = this.createUserForm.get('userRole')?.value;
    this.setDefaultPermissionsForRole(userRole);
  }

  private setDefaultPermissionsForRole(userRole: string): void {
    const defaultPermissions = getDefaultPermissionsByRole(userRole);
    this.selectedPermissions = [...defaultPermissions];
    this.createUserForm.get('managementType')?.setValue([...defaultPermissions]);
  }

  onPermissionChange(event: MatCheckboxChange): void {
    const permission = event.source.value;

    if (event.checked) {
      if (!this.selectedPermissions.includes(permission)) {
        this.selectedPermissions.push(permission);
      }
    } else {
      const index = this.selectedPermissions.indexOf(permission);
      if (index > -1) {
        this.selectedPermissions.splice(index, 1);
      }
    }

    // Atualiza o form control
    this.createUserForm.get('managementType')?.setValue([...this.selectedPermissions]);
  }

  async onSubmit(): Promise<void> {
    this.isLoading = true;

    if (this.createUserForm.invalid) {
      this.snackBar.open('Por favor, preencha todos os campos corretamente.', 'Fechar', { duration: 3000 });
      this.isLoading = false;
      return;
    }

    try {
      const { email, password, fullName, cpf, birthDate, managementType, isActive, role, userRole } = this.createUserForm.value;
      const authResponse = await this.authService.createUser(email, password);

      if (!authResponse.user) {
        this.snackBar.open('Falha ao criar usuário no Firebase.', 'Fechar', { duration: 5000 });
        this.isLoading = false;
        return;
      }

      const userId = authResponse.user.uid;
      const userData: createUsersAdmin = {
        uid: userId,
        fullName,
        email,
        cpf,
        birthDate,
        managementType,
        accessCode: userId.substring(0, 10),
        isActive,
        role: userRole, // Função do usuário (store_employee, store_owner, admin)
        redirectRoute: role // Página de destino após login (/admin ou /home)
      };

      await this.createUserService.createUser(userData);
      this.snackBar.open('Usuário criado com sucesso!', 'Fechar', { duration: 5000 });
      this.dialogRef.close(true); // Close modal and signal success
    } catch (error: any) {
      this.handleError(error.message || 'Erro ao criar conta.');
    } finally {
      this.isLoading = false;
    }
  }

  private handleError(message: string): void {
    console.error(message);
    this.snackBar.open(message, 'Fechar', { duration: 5000 });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  // Validador de CPF
  cpfValidator(control: any) {
    if (!control.value) {
      return null;
    }

    // Remove pontos, traços e espaços
    const cpf = control.value.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) {
      return { invalidCpf: true };
    }

    // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpf)) {
      return { invalidCpf: true };
    }

    // Validação do algoritmo do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) {
      return { invalidCpf: true };
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) {
      return { invalidCpf: true };
    }

    return null; // CPF válido
  }
}
