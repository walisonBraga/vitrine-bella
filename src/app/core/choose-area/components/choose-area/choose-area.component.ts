import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-choose-area',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './choose-area.component.html',
  styleUrl: './choose-area.component.scss'
})
export class ChooseAreaComponent {
  currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    
    // Se não tem múltiplos roles, redireciona automaticamente
    if (!this.hasMultipleRoles()) {
      this.redirectToSingleRole();
    }
  }

  hasMultipleRoles(): boolean {
    if (!this.currentUser?.redirectRoute) return false;
    
    const redirectRoute = this.currentUser.redirectRoute;
    if (Array.isArray(redirectRoute)) {
      return redirectRoute.includes('/admin') && redirectRoute.includes('/loja');
    }
    
    return false;
  }

  private redirectToSingleRole(): void {
    const redirectRoute = this.currentUser?.redirectRoute;
    
    if (Array.isArray(redirectRoute)) {
      if (redirectRoute.includes('/admin')) {
        this.router.navigate(['/admin/admin-dashboard']);
      } else if (redirectRoute.includes('/loja')) {
        this.router.navigate(['/loja']);
      }
    } else if (redirectRoute === '/admin') {
      this.router.navigate(['/admin/admin-dashboard']);
    } else {
      this.router.navigate(['/loja']);
    }
  }

  goToAdmin(): void {
    this.router.navigate(['/admin/admin-dashboard']);
  }

  goToLoja(): void {
    this.router.navigate(['/loja']);
  }

  logout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(['/sign-in']);
    });
  }
}
