import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { LojaUser, LojaUserTableConfig } from '../../interface/loja-user.interface';
import { CreateUserService } from '../../service/create-user.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { LojaUsersService } from '../../service/loja-users.service';
import { CreateLojaUserModalComponent } from '../create-loja-user-modal/create-loja-user-modal.component';
import { LojaUserTableComponent } from '../loja-user-table/loja-user-table.component';

// Log System Imports
import { LogService } from '../../../logs/service/log.service';
import { UserContextService } from '../../../logs/service/user-context.service';

@Component({
    selector: 'app-loja-users-management',
    templateUrl: './loja-users-management.component.html',
    styleUrl: './loja-users-management.component.scss'
})
export class LojaUsersManagementComponent implements OnInit, OnDestroy {
    users: LojaUser[] = [];
    selectedUsers: LojaUser[] = [];
    loading = false;

    tableConfig: LojaUserTableConfig = {
        columns: [
            { key: 'fullName', label: 'Nome', type: 'text', sortable: true, filterable: true },
            { key: 'email', label: 'Email', type: 'email', sortable: true, filterable: true },
            { key: 'cpf', label: 'CPF', type: 'text', sortable: true, filterable: true },
            { key: 'userRole', label: 'Função', type: 'badge', sortable: true },
            { key: 'isActive', label: 'Status', type: 'boolean', sortable: true },
            { key: 'createdAt', label: 'Criado em', type: 'date', sortable: true }
        ],
        actions: [
            { key: 'edit', label: 'Editar', icon: 'edit', color: 'primary' },
            { key: 'toggle-status', label: 'Ativar/Desativar', icon: 'toggle_on', color: 'accent' },
            { key: 'delete', label: 'Excluir', icon: 'delete', color: 'warn' }
        ],
        pagination: true,
        searchable: true,
        filterable: true,
        selectable: true
    };

    private destroy$ = new Subject<void>();

    constructor(
        private createUserService: CreateUserService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private lojaUsersService: LojaUsersService,
        private logService: LogService,
        private userContextService: UserContextService
    ) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadUsers(): void {
        this.loading = true;
        this.lojaUsersService.getLojaUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    this.users = users;
                    console.log('Usuários da loja carregados:', this.users.length);
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Erro ao carregar usuários:', error);
                    this.snackBar.open('Erro ao carregar usuários', 'Fechar', { duration: 3000 });
                    this.loading = false;
                }
            });
    }

    onUserSelected(user: LojaUser): void {
        console.log('Usuário selecionado:', user);
        // Aqui você pode abrir um modal de detalhes ou edição
    }

    onActionClicked(event: { action: string; user: LojaUser }): void {
        const { action, user } = event;

        switch (action) {
            case 'edit':
                this.editUser(user);
                break;
            case 'toggle-status':
                this.toggleUserStatus(user);
                break;
            case 'delete':
                this.deleteUser(user);
                break;
        }
    }

    onUsersSelected(users: LojaUser[]): void {
        this.selectedUsers = users;
        console.log('Usuários selecionados:', users);
    }

    async createNewUser(): Promise<void> {
        const dialogRef = this.dialog.open(CreateLojaUserModalComponent, {
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            data: { isEdit: false }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Registrar criação de usuário
                const userInfo = this.userContextService.getCurrentUserInfo();
                this.logService.addLog({
                    userId: userInfo.userId,
                    userName: userInfo.userName,
                    action: 'create',
                    entity: 'user',
                    entityName: result.fullName || 'Novo Usuário',
                    details: `Usuário criado: ${result.fullName || 'Nome não informado'} - Email: ${result.email || 'Email não informado'}`,
                    status: 'success',
                    ...this.userContextService.getClientInfo()
                });
                
                this.loadUsers(); // Recarrega a lista
            }
        });
    }

    async editUser(user: LojaUser): Promise<void> {
        const dialogRef = this.dialog.open(CreateLojaUserModalComponent, {
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            data: { user: user, isEdit: true }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Registrar edição de usuário
                const userInfo = this.userContextService.getCurrentUserInfo();
                this.logService.addLog({
                    userId: userInfo.userId,
                    userName: userInfo.userName,
                    action: 'update',
                    entity: 'user',
                    entityId: user.uid,
                    entityName: user.fullName || 'Usuário Editado',
                    details: `Usuário editado: ${user.fullName || 'Nome não informado'} - Email: ${user.email || 'Email não informado'}`,
                    status: 'success',
                    ...this.userContextService.getClientInfo()
                });
                
                this.loadUsers(); // Recarrega a lista
            }
        });
    }

    async toggleUserStatus(user: LojaUser): Promise<void> {
        try {
            await this.lojaUsersService.toggleUserStatus(user.uid, !user.isActive);
            user.isActive = !user.isActive;
            
            // Registrar alteração de status
            const userInfo = this.userContextService.getCurrentUserInfo();
            this.logService.addLog({
                userId: userInfo.userId,
                userName: userInfo.userName,
                action: 'update',
                entity: 'user',
                entityId: user.uid,
                entityName: user.fullName || 'Usuário',
                details: `Status do usuário alterado para: ${user.isActive ? 'Ativo' : 'Inativo'}`,
                status: 'success',
                ...this.userContextService.getClientInfo()
            });
            
            this.snackBar.open(
                `Usuário ${user.isActive ? 'ativado' : 'desativado'} com sucesso!`,
                'Fechar',
                { duration: 3000 }
            );
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            
            // Registrar erro na alteração de status
            const userInfo = this.userContextService.getCurrentUserInfo();
            this.logService.addLog({
                userId: userInfo.userId,
                userName: userInfo.userName,
                action: 'update',
                entity: 'user',
                entityId: user.uid,
                entityName: user.fullName || 'Usuário',
                details: `Erro ao alterar status do usuário: ${error}`,
                status: 'error',
                ...this.userContextService.getClientInfo()
            });
            
            this.snackBar.open('Erro ao alterar status do usuário', 'Fechar', { duration: 3000 });
        }
    }

    async deleteUser(user: LojaUser): Promise<void> {
        if (confirm(`Tem certeza que deseja excluir o usuário ${user.fullName}?`)) {
            try {
                await this.lojaUsersService.deleteUser(user.uid);
                
                // Registrar exclusão de usuário
                const userInfo = this.userContextService.getCurrentUserInfo();
                this.logService.addLog({
                    userId: userInfo.userId,
                    userName: userInfo.userName,
                    action: 'delete',
                    entity: 'user',
                    entityId: user.uid,
                    entityName: user.fullName || 'Usuário Excluído',
                    details: `Usuário excluído: ${user.fullName || 'Nome não informado'} - Email: ${user.email || 'Email não informado'}`,
                    status: 'success',
                    ...this.userContextService.getClientInfo()
                });
                
                this.snackBar.open('Usuário excluído com sucesso!', 'Fechar', { duration: 3000 });
                this.loadUsers(); // Recarrega a lista
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                
                // Registrar erro na exclusão
                const userInfo = this.userContextService.getCurrentUserInfo();
                this.logService.addLog({
                    userId: userInfo.userId,
                    userName: userInfo.userName,
                    action: 'delete',
                    entity: 'user',
                    entityId: user.uid,
                    entityName: user.fullName || 'Usuário',
                    details: `Erro ao excluir usuário: ${error}`,
                    status: 'error',
                    ...this.userContextService.getClientInfo()
                });
                
                this.snackBar.open('Erro ao excluir usuário', 'Fechar', { duration: 3000 });
            }
        }
    }

    async bulkAction(action: string): Promise<void> {
        if (this.selectedUsers.length === 0) {
            this.snackBar.open('Selecione pelo menos um usuário', 'Fechar', { duration: 3000 });
            return;
        }

        switch (action) {
            case 'activate':
                await this.bulkActivate();
                break;
            case 'deactivate':
                await this.bulkDeactivate();
                break;
            case 'delete':
                await this.bulkDelete();
                break;
        }
    }

    private async bulkActivate(): Promise<void> {
        try {
            const userIds = this.selectedUsers.map(user => user.uid);
            await this.lojaUsersService.activateUsers(userIds);
            this.selectedUsers.forEach(user => user.isActive = true);
            this.snackBar.open(`${this.selectedUsers.length} usuários ativados!`, 'Fechar', { duration: 3000 });
        } catch (error) {
            console.error('Erro ao ativar usuários:', error);
            this.snackBar.open('Erro ao ativar usuários', 'Fechar', { duration: 3000 });
        }
    }

    private async bulkDeactivate(): Promise<void> {
        try {
            const userIds = this.selectedUsers.map(user => user.uid);
            await this.lojaUsersService.deactivateUsers(userIds);
            this.selectedUsers.forEach(user => user.isActive = false);
            this.snackBar.open(`${this.selectedUsers.length} usuários desativados!`, 'Fechar', { duration: 3000 });
        } catch (error) {
            console.error('Erro ao desativar usuários:', error);
            this.snackBar.open('Erro ao desativar usuários', 'Fechar', { duration: 3000 });
        }
    }

    private async bulkDelete(): Promise<void> {
        if (confirm(`Tem certeza que deseja excluir ${this.selectedUsers.length} usuários?`)) {
            try {
                const userIds = this.selectedUsers.map(user => user.uid);
                await this.lojaUsersService.deleteUsers(userIds);
                this.users = this.users.filter(user => !this.selectedUsers.includes(user));
                this.selectedUsers = [];
                this.snackBar.open('Usuários excluídos com sucesso!', 'Fechar', { duration: 3000 });
            } catch (error) {
                console.error('Erro ao excluir usuários:', error);
                this.snackBar.open('Erro ao excluir usuários', 'Fechar', { duration: 3000 });
            }
        }
    }

    // Métodos para estatísticas
    getAdminCount(): number {
        return this.users.filter(u => u.userRole === 'admin').length;
    }

    getStoreOwnerCount(): number {
        return this.users.filter(u => u.userRole === 'store_owner').length;
    }

    getStoreEmployeeCount(): number {
        return this.users.filter(u => u.userRole === 'store_employee').length;
    }

    getClienteCount(): number {
        return this.users.filter(u => u.userRole === 'cliente').length;
    }

    private async getMockUsers(): Promise<LojaUser[]> {
        // Simulação de dados - substitua pela chamada real do serviço
        return [
            {
                uid: '1',
                fullName: 'João Silva',
                email: 'joao@email.com',
                cpf: '123.456.789-00',
                phone: '(11) 99999-9999',
                role: 'loja',
                userRole: 'cliente',
                accessCode: 'mock_access_1',
                isActive: true,
                redirectRoute: ['/loja'],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                uid: '2',
                fullName: 'Maria Santos',
                email: 'maria@email.com',
                cpf: '987.654.321-00',
                phone: '(11) 88888-8888',
                role: 'store_employee',
                userRole: 'store_employee',
                accessCode: 'mock_access_2',
                isActive: true,
                redirectRoute: ['/loja'],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    }
}