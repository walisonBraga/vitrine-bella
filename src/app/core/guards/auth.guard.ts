import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser && currentUser.accessCode) {
      return true;
    }
    
    // Redireciona para login se não estiver autenticado
    this.router.navigate(['/sign-in']);
    return false;
  }
}
