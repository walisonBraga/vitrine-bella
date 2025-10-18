import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, takeUntil } from 'rxjs';
import { LojaUser, LojaUserTableConfig, LojaUserAction } from '../../interface/loja-user.interface';

@Component({
  selector: 'app-loja-user-table',
  templateUrl: './loja-user-table.component.html',
  styleUrl: './loja-user-table.component.scss'
})
export class LojaUserTableComponent implements OnInit, OnDestroy {
  @Input() users: LojaUser[] = [];
  @Input() config: LojaUserTableConfig = this.getDefaultConfig();
  @Input() loading = false;
  @Input() searchPlaceholder = 'Buscar usuários...';

  @Output() userSelected = new EventEmitter<LojaUser>();
  @Output() actionClicked = new EventEmitter<{ action: string; user: LojaUser }>();
  @Output() usersSelected = new EventEmitter<LojaUser[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<LojaUser>();
  displayedColumns: string[] = [];
  selectedUsers: Set<string> = new Set();
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.setupTable();
    this.updateDataSource();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.updateDataSource();
  }

  private setupTable(): void {
    this.displayedColumns = this.config.columns.map(col => col.key);

    if (this.config.selectable) {
      this.displayedColumns.unshift('select');
    }

    if (this.config.actions.length > 0) {
      this.displayedColumns.push('actions');
    }
  }

  private updateDataSource(): void {
    this.dataSource.data = this.users;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.searchTerm = filterValue;
  }

  isAllSelected(): boolean {
    const numSelected = this.selectedUsers.size;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedUsers.clear();
    } else {
      this.dataSource.data.forEach(user => this.selectedUsers.add(user.uid));
    }
    this.emitSelectedUsers();
  }

  toggleUserSelection(user: LojaUser): void {
    if (this.selectedUsers.has(user.uid)) {
      this.selectedUsers.delete(user.uid);
    } else {
      this.selectedUsers.add(user.uid);
    }
    this.emitSelectedUsers();
  }

  isUserSelected(user: LojaUser): boolean {
    return this.selectedUsers.has(user.uid);
  }

  emitSelectedUsers(): void {
    const selected = this.users.filter(user => this.selectedUsers.has(user.uid));
    this.usersSelected.emit(selected);
  }

  onUserClick(user: LojaUser): void {
    this.userSelected.emit(user);
  }

  onActionClick(action: LojaUserAction, user: LojaUser): void {
    this.actionClicked.emit({ action: action.key, user });
  }

  canShowAction(action: LojaUserAction, user: LojaUser): boolean {
    return !action.condition || action.condition(user);
  }

  formatCellValue(user: LojaUser, columnKey: string): any {
    const value = user[columnKey as keyof LojaUser];
    const column = this.config.columns.find(col => col.key === columnKey);

    if (!column) return value;

    switch (column.type) {
      case 'boolean':
        return value ? 'Ativo' : 'Inativo';
      case 'date':
        return value ? new Date(value as string).toLocaleDateString('pt-BR') : '-';
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'badge':
        return Array.isArray(value) ? value : [value];
      default:
        return value || '-';
    }
  }

  getBadgeColor(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'primary' : 'warn'; // Verde para ativo, vermelho para inativo
    }
    if (typeof value === 'string') {
      switch (value.toLowerCase()) {
        case 'admin': return 'warn';
        case 'store_owner': return 'accent';
        case 'store_employee': return 'primary';
        case 'cliente': return 'primary';
        default: return 'primary';
      }
    }
    return 'primary';
  }

  private getDefaultConfig(): LojaUserTableConfig {
    return {
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
        { key: 'delete', label: 'Excluir', icon: 'delete', color: 'warn', condition: (user) => user.isActive }
      ],
      pagination: true,
      searchable: true,
      filterable: true,
      selectable: true
    };
  }
}
