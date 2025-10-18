import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import { CreateUserService } from '../../../users/service/create-user.service';
import { createUsersAdmin } from '../../../users/interface/createUsersAdmin';
import { ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from '../../../shared/constants/permissions.constants';
import { PermissionTableConfig, UserPermission } from '../../interface/permission-table.interface';

@Component({
  selector: 'app-permissions-management',
  templateUrl: './permissions-management.component.html',
  styleUrls: ['./permissions-management.component.scss']
})
export class PermissionsManagementComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  users: UserPermission[] = [];
  dataSource = new MatTableDataSource<UserPermission>();
  isLoading = true;
  errorMessage = '';
  authenticatedUser: any | null = null;
  searchTerm = '';
  selectedUsers: Set<string> = new Set();

  expandedPanels = new Set<string>();

  // Configuração da tabela
  tableConfig: PermissionTableConfig = this.getDefaultTableConfig();
  displayedColumns: string[] = ['name', 'cpf', 'status', 'actions'];
  selection = new SelectionModel<UserPermission>(true, []);

  // Expanded rows management
  expandedRows = new Set<string>();

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
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.checkAuthentication();
    this.setupTable();
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
          this.users = users.map(user => ({
            uid: user.uid,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            photoURL: user.photoURL,
            managementType: user.managementType
          }));
          this.dataSource.data = this.users;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erro ao carregar usuários';
          this.snackBar.open('Erro ao carregar usuários.', 'Fechar', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  private setupDisplayedColumns(): void {
    // Columns are already defined in the component property
    // No need to modify them here since we're using a fixed table structure
  }

  /** Se o número de elementos selecionados corresponde ao número total de linhas. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Seleciona todas as linhas se não estão todas selecionadas; caso contrário, limpa a seleção. */
  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  private setupTable(): void {
    this.dataSource.filterPredicate = (data: UserPermission, filter: string) => {
      const searchTerm = filter.toLowerCase();
      return data.fullName.toLowerCase().includes(searchTerm) ||
        data.email.toLowerCase().includes(searchTerm) ||
        data.role.toLowerCase().includes(searchTerm);
    };
  }

  private getDefaultTableConfig(): PermissionTableConfig {
    return {
      columns: [
        { key: 'fullName', label: 'Nome', type: 'text', sortable: true },
        { key: 'email', label: 'Email', type: 'text', sortable: true },
        { key: 'role', label: 'Função', type: 'text', sortable: true },
        { key: 'isActive', label: 'Status', type: 'boolean', sortable: true },
        { key: 'permissions', label: 'Permissões', type: 'actions', sortable: false }
      ],
      actions: [], // Removido menu de ações
      pagination: true,
      searchable: true,
      selectable: true
    };
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.dataSource.filter = searchTerm;
  }

  onUserSelectionChange(selectedUsers: UserPermission[]): void {
    this.selectedUsers.clear();
    selectedUsers.forEach(user => this.selectedUsers.add(user.uid));
  }

  onActionClick(action: string, user: UserPermission): void {
    switch (action) {
      case 'edit':
        this.editUserPermissions(user);
        break;
    }
  }

  // Accordion methods
  onPanelOpened(userId: string): void {
    this.expandedPanels.add(userId);
  }

  onPanelClosed(userId: string): void {
    this.expandedPanels.delete(userId);
  }

  trackByUserId(index: number, user: UserPermission): string {
    return user.uid;
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
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

  editUserPermissions(user: UserPermission): void {
    // Aqui você pode abrir um modal para editar permissões
    // Por enquanto, vamos usar o método togglePermission existente
    console.log('Editando permissões do usuário:', user);
  }

  hasPermission(user: UserPermission, permission: string): boolean {
    return user.managementType?.includes(permission) || false;
  }

  togglePermission(user: UserPermission, permission: string): void {
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

  // Alias para togglePermission que já salva automaticamente
  togglePermissionAndSave(user: UserPermission, permission: string): void {
    this.togglePermission(user, permission);
  }

  canEditUser(user: UserPermission): boolean {
    // Se for admin, pode editar qualquer usuário (incluindo ele mesmo)
    const isAdmin = this.authenticatedUser?.role === 'admin';

    // Se não for o próprio usuário, pode editar
    const isNotSelf = this.authenticatedUser?.uid !== user.uid;

    // Se for admin OU não for ele mesmo, pode editar
    const canEdit = isAdmin || isNotSelf;

    return canEdit;
  }

  // Verifica se pode editar permissões específicas (proteção para admin)
  canEditPermission(user: UserPermission, permission: string): boolean {
    const isAdmin = this.authenticatedUser?.role === 'admin';
    const isSelf = this.authenticatedUser?.uid === user.uid;
    const targetIsAdmin = user.role === 'admin';

    // Se for admin editando a si mesmo, bloqueia permissões críticas
    if (isAdmin && isSelf) {
      const criticalPermissions = [
        '/permissions-management',
        '/admin-management'
      ];

      if (criticalPermissions.includes(permission)) {
        return false;
      }
    }

    // Se o usuário logado não é admin e está tentando editar um admin, bloqueia tudo
    if (!isAdmin && targetIsAdmin) {
      return false;
    }

    return this.canEditUser(user);
  }

  // Gera tooltip específico para cada permissão
  getPermissionTooltip(user: UserPermission, permission: string): string {
    if (!this.canEditPermission(user, permission)) {
      const isAdmin = this.authenticatedUser?.role === 'admin';
      const isSelf = this.authenticatedUser?.uid === user.uid;
      const targetIsAdmin = user.role === 'admin';

      // Se não é admin tentando editar conta de admin
      if (!isAdmin && targetIsAdmin) {
        return '🔒 Não é possível editar permissões de administrador';
      }

      if (isAdmin && isSelf && (permission === '/permissions-management' || permission === '/admin-management')) {
        return '🔒 Permissão crítica protegida por segurança';
      }

      if (isAdmin && isSelf) {
        return 'Erro: Permissão de edição não carregada';
      }

      return 'Você não pode editar suas próprias permissões';
    }

    return 'Clique para alterar permissão';
  }


  exportPermissions(): void {
    const data = this.users.map(user => ({
      nome: user.fullName || '',
      email: user.email || '',
      role: this.getRoleDisplayName(user.role),
      permissoes: user.managementType?.map((p: string) => this.getPermissionDisplayName(p)).join(', ') || 'Nenhuma'
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

  // Expanded rows management
  isExpanded(uid: string): boolean {
    return uid ? this.expandedRows.has(uid) : false;
  }

  isExpandedRow = (index: number, user: UserPermission) => {
    return user?.uid ? this.expandedRows.has(user.uid) : false;
  }

  toggleExpanded(uid: string): void {
    if (uid && this.expandedRows.has(uid)) {
      this.expandedRows.delete(uid);
    } else if (uid) {
      this.expandedRows.add(uid);
    }

    // Force change detection
    this.cdr.detectChanges();

    // Force table to re-render
    this.dataSource.data = [...this.dataSource.data];
  }

  // Save user permissions
  async saveUserPermissions(user: UserPermission): Promise<void> {
    try {
      this.isLoading = true;

      // Update user permissions using the existing updateUser method
      this.createUserService.updateUser(user.uid, {
        managementType: user.managementType || []
      }).subscribe({
        next: () => {
          this.snackBar.open(
            `Permissões de ${user.fullName} salvas com sucesso!`,
            'Fechar',
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.snackBar.open(
            `Erro ao salvar permissões de ${user.fullName}`,
            'Fechar',
            { duration: 5000 }
          );
        },
        complete: () => {
          this.isLoading = false;
        }
      });

    } catch (error) {
      this.snackBar.open(
        `Erro ao salvar permissões de ${user.fullName}`,
        'Fechar',
        { duration: 5000 }
      );
      this.isLoading = false;
    }
  }
}
