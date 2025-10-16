import { Component, computed, effect, Input, signal } from '@angular/core';
import { AuthService } from '../../../../../core/auth/auth.service';
import { MenuItem } from '../../interface/MenuItem';
import { Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-custom-sidenav',
  templateUrl: './custom-sidenav.component.html',
  styleUrl: './custom-sidenav.component.scss'
})
export class CustomSidenavComponent {

sideNavCollapsed = signal(false);
  userData = signal<any | null>(null);
  private destroy$ = new Subject<void>(); // Subject para unsubscribe manual

  @Input() set collapse(value: boolean) {
    this.sideNavCollapsed.set(value);
  }

  constructor(private _authService: AuthService, private _router: Router) {
    effect(() => {
      const user = this.userData();
      if (!user) {
        this._router.navigate(['/signin']);
      }
    });
  }

  sidenavWidth = computed(() => this.sideNavCollapsed() ? '70px' : '250px');

  menuItems = signal<MenuItem[]>([
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/admin/admin-dashboard',
      permission: '/dashboard'
    },
    {
      icon: 'inventory_2',
      label: 'Produtos',
      route: '/admin/adminProductTable',
      permission: '/product-management'
    },
    {
      icon: 'people',
      label: 'Usuários',
      route: '/admin/adminUserTableOwner',
      permission: '/users'
    },
    {
      icon: 'point_of_sale',
      label: 'Vendas Internas',
      route: '/admin/internal-sales',
      permission: '/internal-sales'
    },
    {
      icon: 'trending_up',
      label: 'Vendas',
      route: '/admin/sales-management',
      permission: '/sales-management'
    },
    {
      icon: 'security',
      label: 'Permissões',
      route: '/admin/permissions-management',
      permission: '/permissions-management'
    },
    {
      icon: 'person',
      label: 'Perfil',
      route: '/admin/profile'
      // Perfil não precisa de permissão específica
    }
  ])

  // Filtra os itens do menu baseado nas permissões do usuário
  filteredMenuItems = computed(() => {
    const user = this.userData();

    if (!user || !user.managementType) {
      return this.menuItems().filter(item => !item.permission); // Mostra apenas itens sem permissão
    }

    const userPermissions = user.managementType;

    const filteredItems = this.menuItems().filter(item => {
      // Se não tem permissão definida, sempre mostra (ex: Perfil)
      if (!item.permission) {
        return true;
      }
      // Se tem permissão definida, verifica se o usuário tem essa permissão
      const hasPermission = userPermissions.includes(item.permission);
      return hasPermission;
    });

    return filteredItems;
  })

  profilePicSize = computed(() => this.sideNavCollapsed() ? '32' : '100');

  ngOnInit(): void {
    this._authService.currentUser$
      .pipe(
        takeUntil(this.destroy$), // Usa o Subject manual
        filter(user => user !== null) // Opcional: filtra nulls pra não navegar desnecessariamente
      )
      .subscribe((user) => {
        this.userData.set(user);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

