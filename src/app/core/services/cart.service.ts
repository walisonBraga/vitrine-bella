import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../../module/admin-vitrineBella/products/interface/products';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private cartSubject = new BehaviorSubject<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0
  });

  public cart$ = this.cartSubject.asObservable();

  // Obter carrinho atual
  getCurrentCart(): Cart {
    return this.cartSubject.value;
  }

  // Verificar se há dados no localStorage
  hasCartInStorage(): boolean {
    if (!this.isBrowser) return false;
    const savedCart = localStorage.getItem('vitrineBella_cart');
    return savedCart !== null && savedCart !== 'null';
  }

  constructor() {
    // Carregar carrinho do localStorage se existir (apenas no browser)
    if (this.isBrowser) {
      this.loadCartFromStorage();
    }
  }

  // Adicionar produto ao carrinho
  addToCart(product: Product, quantity: number = 1): void {
    const currentCart = this.cartSubject.value;

    const existingItemIndex = currentCart.items.findIndex(
      item => item.product.id === product.id
    );

    let updatedItems: CartItem[];

    if (existingItemIndex > -1) {
      // Produto já existe no carrinho, atualizar quantidade
      updatedItems = [...currentCart.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
    } else {
      // Novo produto no carrinho
      const newItem: CartItem = {
        product,
        quantity,
        addedAt: new Date()
      };
      updatedItems = [...currentCart.items, newItem];
    }

    this.updateCart(updatedItems);
  }

  // Remover produto do carrinho
  removeFromCart(productId: string): void {
    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.filter(item => item.product.id !== productId);
    this.updateCart(updatedItems);
  }

  // Atualizar quantidade de um produto
  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity };
      }
      return item;
    });

    this.updateCart(updatedItems);
  }

  // Limpar carrinho
  clearCart(): void {
    this.updateCart([]);
  }

  // Verificar se produto está no carrinho
  isInCart(productId: string): boolean {
    const currentCart = this.cartSubject.value;
    return currentCart.items.some(item => item.product.id === productId);
  }

  // Obter quantidade de um produto no carrinho
  getProductQuantity(productId: string): number {
    const currentCart = this.cartSubject.value;
    const item = currentCart.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }

  // Atualizar carrinho e salvar no localStorage
  private updateCart(items: CartItem[]): void {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const updatedCart: Cart = {
      items,
      totalItems,
      totalPrice
    };

    this.cartSubject.next(updatedCart);
    this.saveCartToStorage(updatedCart);
  }

  // Salvar carrinho no localStorage
  private saveCartToStorage(cart: Cart): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem('vitrineBella_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }

  // Carregar carrinho do localStorage
  public loadCartFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const savedCart = localStorage.getItem('vitrineBella_cart');
      if (savedCart && savedCart !== 'null' && savedCart !== 'undefined') {
        const cart = JSON.parse(savedCart);

        // Verificar se o carrinho tem itens válidos
        if (cart && cart.items && Array.isArray(cart.items) && cart.items.length > 0) {
          // Restaurar as datas dos itens
          cart.items = cart.items.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }));

          // Recalcular totais
          const totalItems = cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
          const totalPrice = cart.items.reduce((sum: number, item: CartItem) => sum + (item.product.price * item.quantity), 0);

          cart.totalItems = totalItems;
          cart.totalPrice = totalPrice;

          this.cartSubject.next(cart);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho do localStorage:', error);
    }
  }
}
