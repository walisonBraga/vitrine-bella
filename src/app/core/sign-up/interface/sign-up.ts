export interface SignUp {
  uid: string;           // UID do usuário
  firstName: string;     // Primeiro nome do usuário
  lastName: string;      // Último nome do usuário
  role: string;          // Papel do usuário
  email: string;         // Email do usuário
  password?: string;      // Senha do usuário (não será salva no Firestore)
  accessCode: string;    // Código de acesso do usuário
  isActive: boolean;     // Status do usuário
  cpf?: string;          // CPF do usuário
  phone?: string;     // Telefone do usuário
}
