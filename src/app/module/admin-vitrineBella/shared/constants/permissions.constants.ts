// Constantes de permissões do sistema
export const PERMISSIONS = {
  DASHBOARD: '/dashboard',
  PRODUCT_MANAGEMENT: '/product-management',
  USERS: '/users',
  INTERNAL_SALES: '/internal-sales',
  PERMISSIONS_MANAGEMENT: '/permissions-management',
  CATEGORIES: '/categories',
  COUPONS: '/coupons',
  SLIDES: '/slides'
} as const;

export const PERMISSION_LABELS = {
  '/dashboard': 'Dashboard',
  '/product-management': 'Gerenciamento de Produtos',
  '/users': 'Gerenciamento de Usuários',
  '/internal-sales': 'Vendas Internas',
  '/permissions-management': 'Gerenciamento de Permissões',
  '/categories': 'Gerenciamento de Categorias',
  '/coupons': 'Gerenciamento de Cupons',
  '/slides': 'Gerenciamento de Slides'
} as const;

export const PERMISSION_DESCRIPTIONS = {
  '/dashboard': 'Acesso ao painel principal',
  '/product-management': 'Criar, editar e excluir produtos',
  '/users': 'Criar e gerenciar usuários',
  '/internal-sales': 'Realizar vendas diretamente na loja',
  '/permissions-management': 'Configurar permissões de usuários',
  '/categories': 'Criar e gerenciar categorias de produtos',
  '/coupons': 'Criar e gerenciar cupons de desconto',
  '/slides': 'Criar e gerenciar slides do banner'
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_PERMISSIONS = {
  ADMIN: [
    '/dashboard',
    '/product-management',
    '/users',
    '/internal-sales',
    '/permissions-management',
    '/categories',
    '/coupons',
    '/slides'
  ],
  STORE_OWNER: [
    '/dashboard',
    '/product-management',
    '/users',
    '/internal-sales',
    '/categories',
    '/coupons',
    '/slides'
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
