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
      route: '/admin/admin-dashboard'
    },
    {
      icon: 'inventory_2',
      label: 'Produtos',
      route: '/admin/adminProductTable'
    },
    {
      icon: 'people',
      label: 'Usuários',
      route: '/admin/adminUserTableOwner'
    },
    {
      icon: 'settings',
      label: 'Perfil',
      route: '/admin/profile'
    },
    // { icon: 'category', label: 'Categorias', route: '/admin-vitrineBella/categories' },
    // { icon: 'shopping_cart', label: 'Pedidos', route: '/admin/orders' },
    // { icon: 'bar_chart', label: 'Relatórios', route: '/admin/reports' },
    // { icon: 'settings', label: 'Configurações', route: '/admin/settings' },
    // { icon: 'settings', label: 'Configurações', route: '/admin/settings' },
  ])

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

