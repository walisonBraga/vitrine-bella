import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { Auth, authState, signOut, User } from '@angular/fire/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { FavoritosFirebaseService } from '../../../services/favoritos-firebase.service';
import { CartService } from '../../../services/cart.service';
import { Observable, map, switchMap, Subscription } from 'rxjs';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-navbar-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    // Angular Material Modules
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './navbar-home.component.html',
  styleUrl: './navbar-home.component.scss'
})
export class NavbarHomeComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private favoritosFirebaseService = inject(FavoritosFirebaseService);
  private cartService = inject(CartService);

  user$: Observable<any> = authState(this.auth);
  userInfo$: Observable<any> = this.user$.pipe(
    switchMap(user => {
      if (user) {
        return this.authService.getUserInfo(user.uid);
      }
      return [null];
    })
  );

  cartCount: number = 0;
  favoritosCount: number = 0;
  logoPath: string = 'assets/img/logo.png';
  defaultAvatar: string = 'assets/img/icon-sem-perfil.png';
  isMobileMenuOpen = false;
  private cartSubscription?: Subscription;

  constructor() {
    this.setupFavoritosListener();
    this.setupCartListener();
  }

  ngOnInit(): void {
    // Inicialização do componente
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  setupFavoritosListener(): void {
    // Escutar mudanças nos favoritos do Firebase
    this.favoritosFirebaseService.getFavoritosCount$().subscribe(count => {
      this.favoritosCount = count;
    });

    // Fallback para localStorage quando não logado
    if (typeof window !== 'undefined' && window.localStorage) {
      const favoritosSalvos = localStorage.getItem('favoritos');
      if (favoritosSalvos) {
        this.favoritosCount = JSON.parse(favoritosSalvos).length;
      }
    }
  }

  setupCartListener(): void {
    // Escutar mudanças no carrinho
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart.totalItems;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (window.innerWidth >= 992) {
      this.isMobileMenuOpen = false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.showSuccessMessage('Logout realizado com sucesso!');
      await this.router.navigate(['/home']);
    } catch (error) {
      this.showErrorMessage('Erro ao fazer logout. Tente novamente.');
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
