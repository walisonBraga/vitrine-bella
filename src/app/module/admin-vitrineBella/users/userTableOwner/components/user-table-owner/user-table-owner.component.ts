import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { createUsersAdmin } from '../../../interface/createUsersAdmin';
import { CreateUserService } from '../../../service/create-user.service';
import { EmployeeCreateModalComponent } from '../../../EmployeeCreateModal/components/employee-create-modal/employee-create-modal.component';
import { UserPermissionModalComponent } from '../../../UserPermissionModal/components/user-permission-modal/user-permission-modal.component';
import { EditUserModalComponent } from '../../../EditUserModal/components/edit-user-modal/edit-user-modal.component';
import { AvatarComponent } from '../../../../../../shared/avatar/avatar.component';

@Component({
  selector: 'app-user-table-owner',
  templateUrl: './user-table-owner.component.html',
  styleUrls: ['./user-table-owner.component.scss']
})
export class UserTableOwnerComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['fullName', 'email', 'role', 'isActive', 'actions'];
  dataSource = new MatTableDataSource<createUsersAdmin>();
  users: createUsersAdmin[] = [];
  isLoading = true;
  authenticatedUser: any | null = null;
  errorMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
          this.dataSource.data = users;
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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
    const permissionMap: { [key: string]: string } = {
      '/admin-management': 'Gerenciamento de Administração',
      '/users': 'Gerenciamento de Usuários',
      '/sales-management': 'Gerenciamento de Vendas',
      '/product-management': 'Gerenciamento de Produtos',
      '/dashboard': 'Dashboard'
    };
    return permissionMap[permission] || permission;
  }

  activateUser(user: createUsersAdmin): void {
    this.createUserService.updateUserStatus(user.uid, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Usuário ativado com sucesso!', 'Fechar', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          console.error('Erro ao ativar usuário:', error);
          this.snackBar.open('Erro ao ativar usuário.', 'Fechar', { duration: 5000 });
        }
      });
  }

  deactivateUser(user: createUsersAdmin): void {
    this.createUserService.updateUserStatus(user.uid, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Usuário desativado com sucesso!', 'Fechar', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          console.error('Erro ao desativar usuário:', error);
          this.snackBar.open('Erro ao desativar usuário.', 'Fechar', { duration: 5000 });
        }
      });
  }


  deleteUser(user: createUsersAdmin): void {
    const confirmed = confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.');

    if (!confirmed) {
      return;
    }

    this.createUserService.deleteUser(user.uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Usuário excluído com sucesso!', 'Fechar', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          console.error('Erro ao excluir usuário:', error);
          this.snackBar.open('Erro ao excluir usuário.', 'Fechar', { duration: 5000 });
        }
      });
  }

  editUser(user: createUsersAdmin): void {
    const dialogRef = this.dialog.open(EditUserModalComponent, {
      width: '600px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openPermissionModal(user: createUsersAdmin): void {
    const dialogRef = this.dialog.open(UserPermissionModalComponent, {
      width: '600px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openCreateUserModal(): void {
    const dialogRef = this.dialog.open(EmployeeCreateModalComponent, {
      width: '600px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }
}
