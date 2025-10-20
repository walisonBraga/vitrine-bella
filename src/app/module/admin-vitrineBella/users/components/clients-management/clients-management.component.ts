import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LojaUsersService } from '../../service/loja-users.service';
import { LojaUser, LojaUserTableConfig } from '../../interface/loja-user.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-clients-management',
  templateUrl: './clients-management.component.html',
  styleUrls: ['./clients-management.component.scss']
})
export class ClientsManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users: LojaUser[] = [];
  selectedUsers: LojaUser[] = [];
  loading = false;
  errorMessage = '';
  currentUser: any = null;

  // Configuração da tabela
  tableConfig: LojaUserTableConfig = {
    columns: [
      { key: 'fullName', label: 'Nome', type: 'text', sortable: true, filterable: true },
      { key: 'email', label: 'Email', type: 'email', sortable: true, filterable: true },
      { key: 'cpf', label: 'CPF', type: 'text', sortable: true, filterable: true },
      { key: 'isActive', label: 'Status', type: 'boolean', sortable: true },
      { key: 'createdAt', label: 'Criado em', type: 'date', sortable: true }
    ],
    actions: [
      { key: 'edit', label: 'Editar', icon: 'edit', color: 'primary', condition: (user: LojaUser) => this.canEditUser(user) },
      { key: 'toggle-status', label: 'Ativar/Desativar', icon: 'toggle_on', color: 'accent', condition: (user: LojaUser) => this.canToggleUserStatus(user) },
      { key: 'delete', label: 'Excluir', icon: 'delete', color: 'warn', condition: (user: LojaUser) => this.canDeleteUser(user) && user.isActive }
    ],
    pagination: true,
    searchable: true,
    filterable: true,
    selectable: true
  };

  constructor(
    private lojaUsersService: LojaUsersService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClients(): void {
    this.loading = true;
    this.errorMessage = '';

    // Buscar todos os usuários e filtrar apenas clientes
    this.lojaUsersService.getLojaUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          console.log('Todos os usuários carregados:', users.length);
          console.log('Usuários com userRole:', users.map(u => ({ name: u.fullName, role: u.userRole })));

          // Filtrar apenas clientes
          const clients = users.filter(user =>
            user.userRole &&
              Array.isArray(user.userRole) ?
              user.userRole.includes('cliente') :
              user.userRole === 'cliente'
          );

          this.users = clients;
          console.log('Clientes filtrados:', this.users.length);
          this.loading = false;
        },
        error: (error: any) => {
          this.errorMessage = 'Erro ao carregar clientes';
          this.snackBar.open('Erro ao carregar clientes.', 'Fechar', { duration: 5000 });
          this.loading = false;
        }
      });
  }

  onUserSelected(user: LojaUser): void {
    console.log('Cliente selecionado:', user);
  }

  onActionClicked(event: { action: string, user: LojaUser }): void {
    const { action, user } = event;

    switch (action) {
      case 'edit':
        if (this.canEditUser(user)) {
          console.log('Editar cliente:', user);
          // Implementar edição
        } else {
          this.snackBar.open('Você não tem permissão para editar este usuário', 'Fechar', { duration: 3000 });
        }
        break;

      case 'toggle-status':
        if (this.canToggleUserStatus(user)) {
          this.toggleUserStatus(user);
        } else {
          this.snackBar.open('Você não tem permissão para alterar o status deste usuário', 'Fechar', { duration: 3000 });
        }
        break;

      case 'delete':
        if (this.canDeleteUser(user)) {
          console.log('Excluir cliente:', user);
          // Implementar exclusão
        } else {
          this.snackBar.open('Você não tem permissão para excluir usuários', 'Fechar', { duration: 3000 });
        }
        break;
    }
  }

  toggleUserStatus(user: LojaUser): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'ativar' : 'desativar';

    // Aqui você implementaria a chamada para o serviço
    console.log(`${action} usuário:`, user);

    // Simular mudança de status
    user.isActive = newStatus;

    this.snackBar.open(`Usuário ${action}do com sucesso`, 'Fechar', { duration: 3000 });
  }

  onUsersSelected(users: LojaUser[]): void {
    this.selectedUsers = users;
    console.log('Clientes selecionados:', users);
  }

  bulkAction(action: string): void {
    if (this.selectedUsers.length === 0) {
      this.snackBar.open('Selecione pelo menos um usuário', 'Fechar', { duration: 3000 });
      return;
    }

    const allowedUsers = this.selectedUsers.filter(user => {
      switch (action) {
        case 'activate':
        case 'deactivate':
          return this.canToggleUserStatus(user);
        case 'delete':
          return this.canDeleteUser(user);
        default:
          return false;
      }
    });

    if (allowedUsers.length === 0) {
      this.snackBar.open('Você não tem permissão para realizar esta ação nos usuários selecionados', 'Fechar', { duration: 3000 });
      return;
    }

    if (allowedUsers.length < this.selectedUsers.length) {
      this.snackBar.open(`Ação aplicada apenas a ${allowedUsers.length} de ${this.selectedUsers.length} usuários selecionados`, 'Fechar', { duration: 3000 });
    }

    // Implementar ações em lote
    allowedUsers.forEach(user => {
      switch (action) {
        case 'activate':
          user.isActive = true;
          break;
        case 'deactivate':
          user.isActive = false;
          break;
        case 'delete':
          // Implementar exclusão
          console.log('Excluir usuário:', user);
          break;
      }
    });

    this.snackBar.open(`Ação "${action}" aplicada com sucesso`, 'Fechar', { duration: 3000 });
  }

  // Verificar se o usuário atual pode editar outro usuário
  canEditUser(user: LojaUser): boolean {
    if (!this.currentUser) return false;

    // Admin pode editar qualquer um
    if (this.currentUser.role === 'admin') return true;

    // Proprietário pode editar funcionários e clientes, mas não admin
    if (this.currentUser.role === 'store_owner') {
      return user.userRole !== 'admin';
    }

    // Gerente pode editar funcionários e clientes, mas não admin nem proprietário
    if (this.currentUser.role === 'store_manager') {
      return user.userRole !== 'admin' && user.userRole !== 'store_owner';
    }

    // Funcionário não pode editar ninguém
    return false;
  }

  // Verificar se o usuário atual pode ativar/desativar outro usuário
  canToggleUserStatus(user: LojaUser): boolean {
    return this.canEditUser(user);
  }

  // Verificar se o usuário atual pode excluir outro usuário
  canDeleteUser(user: LojaUser): boolean {
    if (!this.currentUser) return false;

    // Não permitir exclusão de admin
    const isAdmin = user.userRole === 'admin' || user.role === 'admin';
    if (isAdmin) {
      return false;
    }

    // Apenas admin pode excluir usuários
    return this.currentUser.role === 'admin';
  }

  getClientCount(): number {
    return this.users.length;
  }

  getActiveClientCount(): number {
    return this.users.filter(user => user.isActive).length;
  }

  getInactiveClientCount(): number {
    return this.users.filter(user => !user.isActive).length;
  }
}
