export interface PermissionTableColumn {
  key: string;
  label: string;
  type: 'text' | 'boolean' | 'actions';
  sortable?: boolean;
  width?: string;
}

export interface PermissionTableConfig {
  columns: PermissionTableColumn[];
  actions: PermissionAction[];
  pagination?: boolean;
  searchable?: boolean;
  selectable?: boolean;
}

export interface PermissionAction {
  key: string;
  label: string;
  icon: string;
  color: 'primary' | 'accent' | 'warn';
  condition?: (user: any) => boolean;
}

export interface UserPermission {
  uid: string;
  fullName: string;
  email: string;
  cpf?: string;
  role: string;
  isActive: boolean;
  photoURL?: string;
  createdAt?: any;
  managementType?: string[];
}
