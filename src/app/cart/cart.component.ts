import { Component, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { CartService, CartItem, Cart } from '../core/services/cart.service';
import { NavbarHomeComponent } from '../core/navbar-home/components/navbar-home/navbar-home.component';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    NavbarHomeComponent
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy, AfterViewInit {
  private cartService = inject(CartService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  cart$ = this.cartService.cart$;
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  isLoading = false;
  isServicesExpanded = false;
  private cartSubscription?: Subscription;

  ngOnInit(): void {
    // Carregar carrinho imediatamente
    this.loadCartData();

    // Subscribe para mudanças futuras
    this.cartSubscription = this.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }

  ngAfterViewInit(): void {
    // Verificar novamente após a view estar pronta
    this.loadCartData();
  }

  private loadCartData(): void {
    // Carregar carrinho do localStorage se existir
    if (this.cartService.hasCartInStorage()) {
      this.cartService.loadCartFromStorage();
    }

    // Atualizar carrinho local
    this.cart = this.cartService.getCurrentCart();
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  // Atualizar quantidade de um item
  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeItem(item.product.id);
      return;
    }

    this.cartService.updateQuantity(item.product.id, newQuantity);
    this.snackBar.open('Quantidade atualizada!', 'Fechar', { duration: 2000 });
  }

  // Remover item do carrinho
  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
    this.snackBar.open('Produto removido do carrinho!', 'Fechar', { duration: 2000 });
  }

  // Limpar carrinho
  clearCart(): void {
    this.cartService.clearCart();
    this.snackBar.open('Carrinho limpo!', 'Fechar', { duration: 2000 });
  }

  // Ir para página de produto
  goToProduct(productId: string): void {
    this.router.navigate(['/produto', productId]);
  }

  // Finalizar compra
  checkout(): void {
    if (this.cart.items.length === 0) {
      this.snackBar.open('Carrinho vazio!', 'Fechar', { duration: 2000 });
      return;
    }

    // Navegar para página de endereço
    this.router.navigate(['/checkout/endereco']);
  }

  // Voltar para home
  goHome(): void {
    this.router.navigate(['/']);
  }

  // Alternar expansão da seção de serviços
  toggleServicesExpansion(): void {
    this.isServicesExpanded = !this.isServicesExpanded;
  }

  // Formatar preço
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  // Tratar erro de imagem
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/icon-sem-perfil.png';
  }
}
