/**
 * Constantes de rotas da aplicação
 * Centraliza todos os nomes de rotas para evitar erros de digitação
 * e facilitar manutenção
 */
export const ROUTE_NAMES = {
  // Rotas públicas
  HOME: 'home',
  SIGN_IN: 'sign-in',
  SIGN_UP: 'sign-up',
  CHOOSE_ROLE: 'choose-role',

  // Rotas protegidas
  ADMIN: 'admin',
  PROFILE: 'profile',
  CART: 'cart',
  PRODUCTS: 'products',
  ABOUT: 'about',
  ORDERS: 'orders',
  FAVORITES: 'favorites',

  // Rotas de erro
  NOT_FOUND: 'not-found',
  UNAUTHORIZED: 'unauthorized',

  // Rotas de redirecionamento
  DEFAULT: '',
  WILDCARD: '**'
} as const;

/**
 * Constantes de paths completos para facilitar navegação
 */
export const ROUTE_PATHS = {
  HOME: `/${ROUTE_NAMES.HOME}`,
  SIGN_IN: `/${ROUTE_NAMES.SIGN_IN}`,
  SIGN_UP: `/${ROUTE_NAMES.SIGN_UP}`,
  CHOOSE_ROLE: `/${ROUTE_NAMES.CHOOSE_ROLE}`,
  ADMIN: `/${ROUTE_NAMES.ADMIN}`,
  PROFILE: `/${ROUTE_NAMES.PROFILE}`,
  CART: `/${ROUTE_NAMES.CART}`,
  PRODUCTS: `/${ROUTE_NAMES.PRODUCTS}`,
  ABOUT: `/${ROUTE_NAMES.ABOUT}`,
  ORDERS: `/${ROUTE_NAMES.ORDERS}`,
  FAVORITES: `/${ROUTE_NAMES.FAVORITES}`,
  NOT_FOUND: `/${ROUTE_NAMES.NOT_FOUND}`,
  UNAUTHORIZED: `/${ROUTE_NAMES.UNAUTHORIZED}`
} as const;

/**
 * Configurações de rotas para diferentes tipos de usuário
 */
export const ROUTE_PERMISSIONS = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated',
  ADMIN: 'admin',
  USER: 'user'
} as const;

/**
 * Mapeamento de rotas por permissão
 */
export const ROUTE_ACCESS_MAP = {
  [ROUTE_NAMES.HOME]: ROUTE_PERMISSIONS.PUBLIC,
  [ROUTE_NAMES.SIGN_IN]: ROUTE_PERMISSIONS.PUBLIC,
  [ROUTE_NAMES.SIGN_UP]: ROUTE_PERMISSIONS.PUBLIC,
  [ROUTE_NAMES.CHOOSE_ROLE]: ROUTE_PERMISSIONS.AUTHENTICATED,
  [ROUTE_NAMES.ADMIN]: ROUTE_PERMISSIONS.ADMIN,
  [ROUTE_NAMES.PROFILE]: ROUTE_PERMISSIONS.AUTHENTICATED,
  [ROUTE_NAMES.CART]: ROUTE_PERMISSIONS.AUTHENTICATED,
  [ROUTE_NAMES.PRODUCTS]: ROUTE_PERMISSIONS.PUBLIC,
  [ROUTE_NAMES.ABOUT]: ROUTE_PERMISSIONS.PUBLIC,
  [ROUTE_NAMES.ORDERS]: ROUTE_PERMISSIONS.AUTHENTICATED,
  [ROUTE_NAMES.FAVORITES]: ROUTE_PERMISSIONS.AUTHENTICATED
} as const;
