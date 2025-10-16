import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import { CreateUserService } from '../../../users/service/create-user.service';
import { createUsersAdmin } from '../../../users/interface/createUsersAdmin';
import { ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from '../../../shared/constants/permissions.constants';


@Component({
  selector: 'app-permissions-management',
  templateUrl: './permissions-management.component.html',
  styleUrls: ['./permissions-management.component.scss']
})
export class PermissionsManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users: createUsersAdmin[] = [];
  isLoading = true;
  errorMessage = '';
  authenticatedUser: any | null = null;

  // Permissões disponíveis
  availablePermissions = ALL_PERMISSIONS.map((permission: string) => ({
    value: permission,
    label: PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS],
    description: PERMISSION_DESCRIPTIONS[permission as keyof typeof PERMISSION_DESCRIPTIONS]
  }));

  // Permission Map para referência
  permissionMap = PERMISSION_LABELS;

  constructor(
    private authService: AuthService,
    private createUserService: CreateUserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthentication(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (!user) {
          this.router.navigate(['/signin']);
          return;
        }
        this.authenticatedUser = user;
        this.loadUsers();
      });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.createUserService.getUsersByRole(['store_employee', 'store_owner', 'admin'])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar usuários:', error);
          this.errorMessage = 'Erro ao carregar usuários';
          this.snackBar.open('Erro ao carregar usuários.', 'Fechar', { duration: 5000 });
          this.isLoading = false;
        }
      });
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

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'store_employee':
        return 'badge-primary';
      case 'store_owner':
        return 'badge-success';
      case 'admin':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getPermissionDisplayName(permission: string): string {
    return this.permissionMap[permission as keyof typeof this.permissionMap] || permission;
  }

  hasPermission(user: createUsersAdmin, permission: string): boolean {
    return user.managementType?.includes(permission) || false;
  }

  togglePermission(user: createUsersAdmin, permission: string): void {
    if (!user.managementType) {
      user.managementType = [];
    }

    const hasPermission = user.managementType!.includes(permission);

    if (hasPermission) {
      // Remove permissão
      user.managementType = user.managementType!.filter(p => p !== permission);
    } else {
      // Adiciona permissão
      user.managementType!.push(permission);
    }

    // Salva no Firestore
    this.createUserService.updateUser(user.uid, { managementType: user.managementType })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const action = hasPermission ? 'removida' : 'adicionada';
          this.snackBar.open(`Permissão ${action} com sucesso!`, 'Fechar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Erro ao atualizar permissões:', error);
          this.snackBar.open('Erro ao atualizar permissões.', 'Fechar', { duration: 5000 });
          // Reverte a mudança
          if (hasPermission) {
            user.managementType!.push(permission);
          } else {
            user.managementType = user.managementType!.filter(p => p !== permission);
          }
        }
      });
  }

  canEditUser(user: createUsersAdmin): boolean {
    return this.authenticatedUser?.uid !== user.uid;
  }

  exportPermissions(): void {
    const data = this.users.map(user => ({
      nome: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: this.getRoleDisplayName(user.role),
      permissoes: user.managementType?.map(p => this.getPermissionDisplayName(p)).join(', ') || 'Nenhuma'
    }));

    const csvContent = this.convertToCSV(data);
    this.downloadCSV(csvContent, 'permissoes-usuarios.csv');
  }

  private convertToCSV(data: any[]): string {
    const headers = ['Nome', 'Email', 'Função', 'Permissões'];
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = [
        `"${row.nome}"`,
        `"${row.email}"`,
        `"${row.role}"`,
        `"${row.permissoes}"`
      ];
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
