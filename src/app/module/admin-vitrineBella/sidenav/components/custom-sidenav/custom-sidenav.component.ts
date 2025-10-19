import { Component, computed, effect, Input, signal, HostListener } from '@angular/core';
import { AuthService } from '../../../../../core/auth/auth.service';
import { MenuItem } from '../../interface/MenuItem';
import { Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { StockNotificationService } from '../../../../../core/services/stock-notification.service';

@Component({
  selector: 'app-custom-sidenav',
  templateUrl: './custom-sidenav.component.html',
  styleUrl: './custom-sidenav.component.scss'
})
export class CustomSidenavComponent {

  sideNavCollapsed = signal(false);
  userData = signal<any | null>(null);
  lowStockCount = signal(0);
  hasMultipleRoles = signal(false);
  currentRole = signal<'admin' | 'loja'>('admin');
  private destroy$ = new Subject<void>(); // Subject para unsubscribe manual

  @Input() set collapse(value: boolean) {
    this.sideNavCollapsed.set(value);
  }

  constructor(
    private _authService: AuthService,
    private _router: Router,
    private stockNotificationService: StockNotificationService
  ) {
    effect(() => {
      const user = this.userData();
      if (!user) {
        this._router.navigate(['/signin']);
      } else {
        // Verifica se o usuário tem múltiplos roles
        this.checkMultipleRoles(user);
      }
    }, { allowSignalWrites: true });
  }

  sidenavWidth = computed(() => this.sideNavCollapsed() ? '70px' : 'auto');

  menuItems = signal<MenuItem[]>([
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/admin/admin-dashboard',
      permission: '/dashboard'
    },
    {
      icon: 'point_of_sale',
      label: 'Vendas Internas',
      route: '/admin/internal-sales',
      permission: '/internal-sales'
    },
    {
      icon: 'inventory_2',
      label: 'Gerenciar Produtos',
      permission: '/product-management',
      expanded: false,
      children: [
        {
          icon: 'inventory_2',
          label: 'Lista de Produtos',
          route: '/admin/adminProductTable',
          permission: '/product-management'
        },
        {
          icon: 'category',
          label: 'Categorias',
          route: '/admin/categories',
          permission: '/category-management'
        },
        {
          icon: 'confirmation_number',
          label: 'Cupons',
          route: '/admin/coupons',
          permission: '/coupon-management'
        },
        {
          icon: 'slideshow',
          label: 'Slides',
          route: '/admin/slides',
          permission: '/slides-management'
        }
      ]
    },
    {
      icon: 'group',
      label: 'Usuários da Loja',
      route: '/admin/loja-users-management',
      permission: '/users'
    },
    {
      icon: 'security',
      label: 'Permissões',
      route: '/admin/permissions-management',
      permission: '/permissions-management'
    },
    {
      icon: 'history',
      label: 'Logs de Eventos',
      route: '/admin/event-logs',
      permission: '/event-logs'
    },
    {
      icon: 'trending_up',
      label: 'Metas e Vendas',
      route: '/admin/goals-management',
      permission: '/goals-management'
    },
    {
      icon: 'person_pin',
      label: 'Minhas Metas',
      route: '/admin/employee-goals',
      permission: '/employee-goals'
    },
    {
      icon: 'person',
      label: 'Perfil',
      route: '/admin/profile'
      // Perfil não precisa de permissão específica
    }
  ])

  // Cache para evitar recálculos desnecessários
  private _filteredMenuItemsCache: MenuItem[] | null = null;
  private _lastUserPermissions: string | null = null;

  // Filtra os itens do menu baseado nas permissões do usuário
  filteredMenuItems = computed(() => {
    const user = this.userData();

    if (!user || !user.managementType) {
      return this.menuItems().filter(item => !item.permission);
    }

    const userPermissions = user.managementType;

    // Se as permissões não mudaram, retorna o cache
    if (this._lastUserPermissions === userPermissions && this._filteredMenuItemsCache) {
      return this._filteredMenuItemsCache;
    }

    const filteredItems = this.menuItems().filter(item => {
      if (!item.permission) {
        return true;
      }
      const hasPermission = userPermissions.includes(item.permission);
      return hasPermission;
    });

    // Atualiza o cache
    this._filteredMenuItemsCache = filteredItems;
    this._lastUserPermissions = userPermissions;

    return filteredItems;
  })

  profilePicSize = computed(() => this.sideNavCollapsed() ? '32' : '100');

  ngOnInit(): void {
    this._authService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        filter(user => user !== null)
      )
      .subscribe((user) => {
        // Só atualiza se o usuário realmente mudou
        const currentUser = this.userData();
        if (!currentUser || JSON.stringify(currentUser) !== JSON.stringify(user)) {
          this.userData.set(user);
        }
      });

    // Subscrever às notificações de estoque
    this.stockNotificationService.lowStockCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.lowStockCount.set(count);
      });
  }

  toggleMenuExpansion(menuItem: MenuItem, event: Event) {
    // Previne o comportamento padrão do link (refresh da página)
    event.preventDefault();
    event.stopPropagation();

    if (menuItem.children) {
      // Se o sidenav estiver fechado, redireciona para a primeira página do submenu
      if (this.sideNavCollapsed()) {
        const firstChild = menuItem.children[0];
        if (firstChild && firstChild.route) {
          this._router.navigate([firstChild.route]);
        }
      } else {
        // Se estiver aberto, apenas expande/colapsa o menu
        menuItem.expanded = !menuItem.expanded;
        this.menuItems.set([...this.menuItems()]); // Trigger change detection
      }
    }
  }

  preventDefault(event: Event) {
    // Método para prevenir comportamento padrão em todos os links
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('submit', ['$event'])
  onFormSubmit(event: Event) {
    // Previne qualquer submit de formulário dentro do sidenav
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  @HostListener('click', ['$event'])
  onGlobalClick(event: Event) {
    // Previne comportamento padrão em todos os cliques
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // Verifica se o usuário tem múltiplos roles
  private checkMultipleRoles(user: any): void {
    const redirectRoute = user.redirectRoute;

    if (Array.isArray(redirectRoute)) {
      const hasAdmin = redirectRoute.includes('/admin');
      const hasLoja = redirectRoute.includes('/loja');

      this.hasMultipleRoles.set(hasAdmin && hasLoja);

      // Define o role atual baseado na URL atual
      const currentUrl = this._router.url;
      if (currentUrl.startsWith('/admin')) {
        this.currentRole.set('admin');
      } else {
        this.currentRole.set('loja');
      }
    } else {
      this.hasMultipleRoles.set(false);
    }
  }

  // Alterna entre admin e loja
  toggleRole(): void {
    const currentRole = this.currentRole();
    if (currentRole === 'admin') {
      this._router.navigate(['/loja']);
      this.currentRole.set('loja');
    } else {
      this._router.navigate(['/admin/admin-dashboard']);
      this.currentRole.set('admin');
    }
  }

  // Método para fazer logout
  logout(): void {
    this._authService.signOut().then(() => {
      this._router.navigate(['/signin']);
    }).catch((error: any) => {
      console.error('Erro ao fazer logout:', error);
    });
  }

  // Método para obter a primeira letra do nome
  getFirstLetter(name: string): string {
    if (!name || name.trim().length === 0) {
      return 'U';
    }
    return name.trim().charAt(0).toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

