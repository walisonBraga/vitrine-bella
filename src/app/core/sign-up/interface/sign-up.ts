export interface SignUp {
  uid: string;           // UID do usuário
  fullName: string;      // Nome completo do usuário
  role: string;          // Papel do usuário
  email: string;         // Email do usuário
  password?: string;      // Senha do usuário (não será salva no Firestore)
  accessCode: string;    // Código de acesso do usuário
  isActive: boolean;     // Status do usuário
  cpf?: string;          // CPF do usuário
  phone?: string;        // Telefone do usuário
  createdAt?: Date;      // Data de criação
  updatedAt?: Date;      // Data de atualização
  birthDate?: string;    // Data de nascimento
  photoURL?: string;     // URL da foto de perfil
  photoFileName?: string; // Nome do arquivo da foto
  marketing?: boolean;   // Aceita marketing
  addresses?: any[];     // Endereços do usuário
  orders?: any[];        // Pedidos do usuário
  favorites?: any[];     // Favoritos do usuário
}
