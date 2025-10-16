// Constantes de permissões do sistema
export const PERMISSIONS = {
  DASHBOARD: '/dashboard',
  PRODUCT_MANAGEMENT: '/product-management',
  USERS: '/users',
  SALES_MANAGEMENT: '/sales-management',
  INTERNAL_SALES: '/internal-sales',
  PERMISSIONS_MANAGEMENT: '/permissions-management',
  ADMIN_MANAGEMENT: '/admin-management'
} as const;

export const PERMISSION_LABELS = {
  '/dashboard': 'Dashboard',
  '/product-management': 'Gerenciamento de Produtos',
  '/users': 'Gerenciamento de Usuários',
  '/sales-management': 'Gerenciamento de Vendas',
  '/internal-sales': 'Vendas Internas',
  '/permissions-management': 'Gerenciamento de Permissões',
  '/admin-management': 'Gerenciamento de Administração'
} as const;

export const PERMISSION_DESCRIPTIONS = {
  '/dashboard': 'Acesso ao painel principal',
  '/product-management': 'Criar, editar e excluir produtos',
  '/users': 'Criar e gerenciar usuários',
  '/sales-management': 'Visualizar relatórios de vendas',
  '/internal-sales': 'Realizar vendas diretamente na loja',
  '/permissions-management': 'Configurar permissões de usuários',
  '/admin-management': 'Acesso completo ao sistema administrativo'
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_PERMISSIONS = {
  ADMIN: [
    '/dashboard',
    '/product-management',
    '/users',
    '/sales-management',
    '/internal-sales',
    '/permissions-management',
    '/admin-management'
  ],
  STORE_OWNER: [
    '/dashboard',
    '/product-management',
    '/users',
    '/sales-management',
    '/internal-sales'
  ],
  STORE_EMPLOYEE: [
    '/dashboard',
    '/internal-sales'
  ]
} as const;

export function getDefaultPermissionsByRole(role: string): string[] {
  switch (role) {
    case 'admin':
      return [...DEFAULT_PERMISSIONS.ADMIN];
    case 'store_owner':
      return [...DEFAULT_PERMISSIONS.STORE_OWNER];
    case 'store_employee':
      return [...DEFAULT_PERMISSIONS.STORE_EMPLOYEE];
    default:
      return ['/dashboard'];
  }
}

export function getPermissionLabel(permission: string): string {
  return PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS] || permission;
}

export function getPermissionDescription(permission: string): string {
  return PERMISSION_DESCRIPTIONS[permission as keyof typeof PERMISSION_DESCRIPTIONS] || '';
}
