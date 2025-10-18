export interface createUsersAdmin {
  uid: string;
  fullName: string; // Nome completo do usuário
  email: string;
  password?: string;
  cpf?: string; // CPF do usuário
  birthDate?: string; // Data de nascimento do usuário
  managementType?: string[];
  userPermission?: string[];
  accessCode: string;
  isActive: boolean;
  role: string;
  redirectRoute?: string | string[]; // Página(s) de destino após login (/admin, /loja ou array)
  photoURL?: string; // URL da foto de perfil do usuário
}
