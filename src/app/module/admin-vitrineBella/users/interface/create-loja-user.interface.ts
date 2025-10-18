export interface CreateLojaUserModalData {
  user?: any; // Para edição
  isEdit?: boolean;
}

export interface CreateLojaUserData {
  fullName: string;
  email: string;
  password?: string;
  cpf: string;
  phone: string;
  birthDate?: string;
  userRole: string;
  accessRoutes: string[];
  managementType: string[];
  isActive: boolean;
  marketing: boolean;
}

export interface UpdateLojaUserData {
  fullName: string;
  email: string;
  password?: string;
  cpf: string;
  phone: string;
  birthDate?: string;
  userRole: string;
  redirectRoute: string[];
  managementType: string[];
  isActive: boolean;
  marketing: boolean;
  accessCode?: string; // Campo opcional para validação
}

export interface CreateLojaUserFormData {
  fullName: string;
  email: string;
  password?: string;
  cpf: string;
  phone: string;
  birthDate?: string;
  userRole: string;
  accessRoutes: string[];
  managementType: string[];
  isActive: boolean;
  marketing: boolean;
  changePassword?: boolean;
}

export interface UserRoleOption {
  value: string;
  label: string;
  description: string;
}

export interface AccessRouteOption {
  value: string;
  label: string;
  description: string;
}

export interface ManagementTypeOption {
  value: string;
  label: string;
  description: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface UserFormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  cpf?: string;
  phone?: string;
  userRole?: string;
  accessRoutes?: string;
  managementType?: string;
}
