import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { CreateUserService } from '../../../service/create-user.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { createUsersAdmin } from '../../../interface/createUsersAdmin';

@Component({
  selector: 'app-employee-create-modal',
  templateUrl: './employee-create-modal.component.html',
  styleUrls: ['./employee-create-modal.component.scss']
})
export class EmployeeCreateModalComponent {
  createUserForm: FormGroup;
  errorMessage: string = '';
  toppingList: string[] = ['/users', '/sales-management', '/product-management'];
  roles: string[] = ['store_employee', 'store_owner'];
  isLoading = false;

  constructor(
    private createUserService: CreateUserService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EmployeeCreateModalComponent>
  ) {
    this.createUserForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      managementType: [[], Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      isActive: [true],
      role: ['', Validators.required],
    });
  }

  onCheckboxChange(event: MatCheckboxChange): void {
    const managementTypeControl = this.createUserForm.get('managementType');
    let managementTypeArray = managementTypeControl?.value || [];

    if (event.checked) {
      managementTypeArray.push(event.source.value);
    } else {
      const index = managementTypeArray.indexOf(event.source.value);
      if (index > -1) {
        managementTypeArray.splice(index, 1);
      }
    }
    managementTypeControl?.setValue(managementTypeArray);
  }

  async onSubmit(): Promise<void> {
    this.isLoading = true;

    if (this.createUserForm.invalid) {
      this.snackBar.open('Por favor, preencha todos os campos corretamente.', 'Fechar', { duration: 3000 });
      this.isLoading = false;
      return;
    }

    try {
      const { email, password, firstName, lastName, managementType, isActive, role } = this.createUserForm.value;
      const authResponse = await this.authService.createUser(email, password);

      if (!authResponse.user) {
        this.snackBar.open('Falha ao criar usuário no Firebase.', 'Fechar', { duration: 5000 });
        this.isLoading = false;
        return;
      }

      const userId = authResponse.user.uid;
      const userData: createUsersAdmin = {
        uid: userId,
        firstName,
        lastName,
        email,
        managementType,
        accessCode: userId.substring(0, 10),
        isActive,
        role
      };

      await this.createUserService.createUser(userData);
      this.snackBar.open('Funcionário ou proprietário criado com sucesso!', 'Fechar', { duration: 5000 });
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
}
