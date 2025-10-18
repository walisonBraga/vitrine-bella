export interface LojaUser {
  uid: string;
  fullName: string;
  email: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  role: string;
  userRole: string;
  redirectRoute: string | string[];
  accessCode: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  photoURL?: string;
  managementType?: string[];
  userPermission?: string[];
}

export interface LojaUserTableColumn {
  key: keyof LojaUser;
  label: string;
  type: 'text' | 'email' | 'date' | 'boolean' | 'array' | 'badge';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface LojaUserTableConfig {
  columns: LojaUserTableColumn[];
  actions: LojaUserAction[];
  pagination?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
}

export interface LojaUserAction {
  key: string;
  label: string;
  icon: string;
  color: 'primary' | 'accent' | 'warn';
  condition?: (user: LojaUser) => boolean;
}
