export interface createUsersAdmin {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  managementType?: string[];
  userPermission?: string[];
  accessCode: string;
  isActive: boolean;
  role: string;
  redirectRoute?: string; // Página de destino após login (/admin ou /home)
  photoURL?: string; // URL da foto de perfil do usuário
}
