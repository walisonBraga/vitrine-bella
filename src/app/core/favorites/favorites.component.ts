import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { NavbarHomeComponent } from '../navbar-home/components/navbar-home/navbar-home.component';
import { ProductService } from '../../module/admin-vitrineBella/products/service/product.service';
import { Product } from '../../module/admin-vitrineBella/products/interface/products';
import { FavoritosFirebaseService } from '../services/favoritos-firebase.service';
import { Auth, authState } from '@angular/fire/auth';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    NavbarHomeComponent
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit {
  private router = inject(Router);
  private productService = inject(ProductService);
  private favoritosService = inject(FavoritosFirebaseService);
  private snackBar = inject(MatSnackBar);
  private auth = inject(Auth);

  favorites: Product[] = [];
  isLoading = true;
  isUserLoggedIn = false;
  defaultImage = 'assets/img/placeholder.png';

  ngOnInit(): void {
    this.setupAuthListener();
  }

  private setupAuthListener(): void {
    authState(this.auth).subscribe(user => {
      this.isUserLoggedIn = !!user;
      if (user) {
        this.loadFavorites(user.uid);
      } else {
        this.isLoading = false;
      }
    });
  }

  private async loadFavorites(userId: string): Promise<void> {
    try {
      this.isLoading = true;
      const favoriteIds = this.favoritosService.getFavoritosIds();

      if (favoriteIds.length === 0) {
        this.favorites = [];
        this.isLoading = false;
        return;
      }

      // Carregar produtos favoritos
      const products: Product[] = [];
      for (const productId of favoriteIds) {
        try {
          const product = await this.productService.getProductById(productId);
          if (product && product.isActive !== false) {
            products.push(product);
          }
        } catch (error) {
          console.error(`Erro ao carregar produto ${productId}:`, error);
        }
      }

      this.favorites = products;
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.snackBar.open('Erro ao carregar favoritos', 'Fechar', {
        duration: 3000
      });
    } finally {
      this.isLoading = false;
    }
  }

  verDetalhesProduto(produtoId: string): void {
    this.router.navigate(['/produto', produtoId]);
  }

  async toggleFavorito(productId: string): Promise<void> {
    if (!this.isUserLoggedIn) {
      this.snackBar.open('Faça login para gerenciar favoritos', 'Fechar', {
        duration: 3000
      });
      return;
    }

    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const isFavorito = this.favorites.some(p => p.id === productId);

      if (isFavorito) {
        await this.favoritosService.removerFavorito(productId);
        this.favorites = this.favorites.filter(p => p.id !== productId);
        this.snackBar.open('Removido dos favoritos', 'Fechar', {
          duration: 2000
        });
      } else {
        await this.favoritosService.adicionarFavorito(productId, '');
        this.snackBar.open('Adicionado aos favoritos', 'Fechar', {
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      this.snackBar.open('Erro ao alterar favorito', 'Fechar', {
        duration: 3000
      });
    }
  }

  adicionarCarrinho(product: Product): void {
    // Implementar lógica do carrinho
    console.log('Adicionar ao carrinho:', product);
    this.snackBar.open('Produto adicionado ao carrinho', 'Fechar', {
      duration: 2000
    });
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultImage;
  }

  voltar(): void {
    this.router.navigate(['/']);
  }

  goToSignIn(): void {
    this.router.navigate(['/signin']);
  }
}
