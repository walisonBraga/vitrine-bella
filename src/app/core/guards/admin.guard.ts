import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(): boolean {
    const currentUser = this.authService.getCurrentUser();

    // Verifica se o usuário está logado
    if (!currentUser || !currentUser.accessCode) {
      this.router.navigate(['/sign-in']);
      return false;
    }

    // Verifica se o usuário tem permissão de admin
    // Verifica pelo userRole ou se tem acesso às rotas administrativas
    const isAdmin = currentUser.userRole === 'admin' ||
      (Array.isArray(currentUser.redirectRoute) ?
        currentUser.redirectRoute.includes('/admin') :
        currentUser.redirectRoute === '/admin') ||
      (currentUser.managementType && currentUser.managementType.length > 0);

    if (!isAdmin) {
      // Redireciona para loja se não for admin
      this.router.navigate(['/loja']);
      return false;
    }

    return true;
  }
}
