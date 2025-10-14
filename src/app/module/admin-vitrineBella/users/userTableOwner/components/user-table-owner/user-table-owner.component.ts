import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { createUsersAdmin } from '../../../interface/createUsersAdmin';
import { CreateUserService } from '../../../service/create-user.service';
import { EmployeeCreateModalComponent } from '../../../EmployeeCreateModal/components/employee-create-modal/employee-create-modal.component';
import { UserPermissionModalComponent } from '../../../UserPermissionModal/components/user-permission-modal/user-permission-modal.component';

@Component({
  selector: 'app-user-table-owner',
  templateUrl: './user-table-owner.component.html',
  styleUrls: ['./user-table-owner.component.scss']
})
export class UserTableOwnerComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['firstName', 'lastName', 'email', 'role', 'isActive', 'actions'];
  dataSource = new MatTableDataSource<createUsersAdmin>();
  isLoading = true;
  authenticatedUser: any | null = null;

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
    // this.authService.currentUser$.subscribe(user => {
    //   this.authenticatedUser = user;
    //   if (!user) {
    //     this.snackBar.open('Você precisa estar autenticado.', 'Fechar', { duration: 5000 });
    //     this.router.navigate(['/signin']);
    //     this.isLoading = false;
    //     return;
    //   }
    //   this.authService.getUserManagementRoutes(user.uid).then(routes => {
    //     if (!routes.includes('/users') && !routes.includes('/admin-management')) {
    //       this.snackBar.open('Acesso não autorizado.', 'Fechar', { duration: 5000 });
    //       this.router.navigate(['/admin/admin-dashboard']);
    //       this.isLoading = false;
    //       return;
    //     }
    //     this.loadUsers();
    //   }).catch(error => {
    //     console.error('Erro ao verificar permissões:', error);
    //     this.snackBar.open('Erro ao verificar permissões.', 'Fechar', { duration: 5000 });
    //     this.isLoading = false;
    //   });
    // });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.createUserService.getUsersByRole(['store_employee', 'store_owner']).subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
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
    this.createUserService.updateUserStatus(user.uid, true).subscribe({
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
    this.createUserService.updateUserStatus(user.uid, false).subscribe({
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

  editUser(user: createUsersAdmin): void {
    this.router.navigate(['/admin/createUser', user.uid]);
  }

  deleteUser(user: createUsersAdmin): void {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      this.createUserService.deleteUser(user.uid).subscribe({
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
  }

  openPermissionModal(user: createUsersAdmin): void {
    const dialogRef = this.dialog.open(UserPermissionModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
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
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }
}
