import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateUserService } from '../../../service/create-user.service';
import { createUsersAdmin } from '../../../interface/createUsersAdmin';
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '../../../../shared/constants/permissions.constants';

@Component({
  selector: 'app-user-permission-modal',
  templateUrl: './user-permission-modal.component.html',
  styleUrls: ['./user-permission-modal.component.scss']
})
export class UserPermissionModalComponent implements OnInit {
  permissionForm: FormGroup;
  loading = false;
  availablePermissions = ALL_PERMISSIONS;

  constructor(
    private fb: FormBuilder,
    private createUserService: CreateUserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserPermissionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: createUsersAdmin }
  ) {
    this.permissionForm = this.fb.group({
      userPermission: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.user) {
      this.permissionForm.patchValue({
        userPermission: this.data.user.userPermission || []
      });
    }
  }

  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      store_owner: 'Proprietário da Loja',
      store_employee: 'Funcionário da Loja',
      admin: 'Administrador'
    };
    return roleMap[role] || role;
  }

  getPermissionDisplayName(permission: string): string {
    return PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS] || permission;
  }

  async onSubmit(): Promise<void> {
    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { userPermission } = this.permissionForm.value;

    try {
      const updatedUser = { ...this.data.user, userPermission };
      await this.createUserService.createUser(updatedUser);
      this.snackBar.open('Permissões atualizadas com sucesso!', 'Fechar', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Erro ao atualizar permissões:', error);
      this.snackBar.open('Erro ao atualizar permissões.', 'Fechar', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
