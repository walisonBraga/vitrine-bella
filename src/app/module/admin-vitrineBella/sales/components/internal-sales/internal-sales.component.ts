import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { Product } from '../../../products/interface/products';
import { SaleItem, SaleForm } from '../../interface/sales';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SalesService } from '../../service/sales.service';
import { ProductService } from '../../../products/service/product.service';


@Component({
  selector: 'app-internal-sales',
  templateUrl: './internal-sales.component.html',
  styleUrls: ['./internal-sales.component.scss']
})
export class InternalSalesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Formulários
  saleForm!: FormGroup;
  customerForm!: FormGroup;

  // Dados
  products: Product[] = [];
  cartItems: SaleItem[] = [];
  authenticatedUser: any | null = null;

  // Estados
  isLoading = false;
  isProcessingSale = false;
  showSimplifiedView = false;
  hasSearchTerm = false;

  // Totais
  subtotal = 0;
  discount = 0;
  total = 0;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private salesService: SalesService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.authenticatedUser = user;
        // Carregar carrinho salvo quando usuário fizer login
        this.loadSavedCart();
      });

    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.saleForm = this.formBuilder.group({
      customerName: ['', [Validators.required, Validators.minLength(2)]],
      customerEmail: ['', [Validators.email]],
      customerPhone: [''],
      paymentMethod: ['cash', Validators.required]
    });

    this.customerForm = this.formBuilder.group({
      searchTerm: [''],
      discount: [0, [Validators.min(0)]]
    });

  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products.filter(p => p.isActive && p.stock > 0);
          // Mostrar vista simplificada se houver mais de 100 produtos
          this.showSimplifiedView = this.products.length > 100;
          this.isLoading = false;
        },
        error: (error) => {
          this.snackBar.open('Erro ao carregar produtos.', 'Fechar', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  addToCart(product: Product): void {
    const existingItem = this.cartItems.find(item => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
        existingItem.subtotal = existingItem.quantity * existingItem.productPrice;
      } else {
        this.snackBar.open('Estoque insuficiente para este produto.', 'Fechar', { duration: 3000 });
        return;
      }
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.productName,
        productPrice: product.price,
        quantity: 1,
        subtotal: product.price
      };
      this.cartItems.push(newItem);
    }

    this.calculateTotals();
    this.saveCart(); // Salvar carrinho automaticamente
  }

  removeFromCart(productId: string): void {
    this.cartItems = this.cartItems.filter(item => item.productId !== productId);
    this.calculateTotals();
    this.saveCart(); // Salvar carrinho automaticamente
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.cartItems.find(item => item.productId === productId);
    if (item) {
      const product = this.products.find(p => p.id === productId);
      if (product && quantity <= product.stock && quantity > 0) {
        item.quantity = quantity;
        item.subtotal = item.quantity * item.productPrice;
        this.calculateTotals();
        this.saveCart(); // Salvar carrinho automaticamente
      }
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.calculateTotals();
    this.clearSavedCart(); // Limpar carrinho salvo
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((total, item) => total + item.subtotal, 0);
    this.discount = this.customerForm.get('discount')?.value || 0;
    this.total = Math.max(0, this.subtotal - this.discount);
  }

  onDiscountChange(): void {
    this.calculateTotals();
  }

  processSale(): void {
    if (this.saleForm.valid && this.cartItems.length > 0) {
      this.isProcessingSale = true;

      const saleData: SaleForm = {
        customerName: this.saleForm.get('customerName')?.value,
        customerEmail: this.saleForm.get('customerEmail')?.value,
        customerPhone: this.saleForm.get('customerPhone')?.value,
        items: [...this.cartItems],
        discount: this.customerForm.get('discount')?.value || 0,
        paymentMethod: this.saleForm.get('paymentMethod')?.value
      };
      this.salesService.createSale(saleData, this.authenticatedUser?.uid || '')
        .then((saleId) => {
          this.snackBar.open('Venda realizada com sucesso!', 'Fechar', { duration: 3000 });
          this.clearCart();
          this.clearSavedCart(); // Limpar carrinho salvo após venda
          this.saleForm.reset();
          this.saleForm.patchValue({
            paymentMethod: 'cash',
            discount: 0
          });
          // Recarregar produtos para refletir o novo estoque
          this.loadProducts();
        })
        .catch((error) => {
          this.snackBar.open('Erro ao processar venda.', 'Fechar', { duration: 5000 });
        })
        .finally(() => {
          this.isProcessingSale = false;
        });
    } else {
      this.snackBar.open('Preencha todos os campos obrigatórios.', 'Fechar', { duration: 3000 });
    }
  }

  getPaymentMethodDisplayName(method: string): string {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      default: return method;
    }
  }

  onSearchInput(event: any): void {
    const value = event.target.value;
    this.hasSearchTerm = value && value.trim().length > 0;
  }

  getFilteredProducts(): Product[] {
    const searchTerm = this.customerForm.get('searchTerm')?.value?.toLowerCase() || '';
    if (!searchTerm.trim()) return [];

    return this.products.filter(product => {
      const productName = product.productName.toLowerCase();
      const category = product.category.toLowerCase();
      const id = product.id.toLowerCase();
      const description = product.description.toLowerCase();

      // Busca mais precisa: começa com o termo ou contém palavras completas
      return productName.startsWith(searchTerm) ||
             productName.includes(' ' + searchTerm + ' ') ||
             productName.endsWith(' ' + searchTerm) ||
             productName === searchTerm ||
             category.includes(searchTerm) ||
             id.includes(searchTerm) ||
             description.includes(searchTerm);
    });
  }

  getProductStock(productId: string): number {
    const product = this.products.find(p => p.id === productId);
    return product ? product.stock : 0;
  }

  // Persistência do carrinho
  private saveCart(): void {
    if (this.authenticatedUser?.uid) {
      const cartKey = `cart_${this.authenticatedUser.uid}`;
      localStorage.setItem(cartKey, JSON.stringify(this.cartItems));
    }
  }

  private loadSavedCart(): void {
    if (this.authenticatedUser?.uid) {
      const cartKey = `cart_${this.authenticatedUser.uid}`;
      const savedCart = localStorage.getItem(cartKey);

      if (savedCart) {
        try {
          this.cartItems = JSON.parse(savedCart);
          this.calculateTotals();
          this.snackBar.open('Carrinho anterior carregado!', 'Fechar', { duration: 3000 });
        } catch (error) {
          this.cartItems = [];
        }
      }
    }
  }

  private clearSavedCart(): void {
    if (this.authenticatedUser?.uid) {
      const cartKey = `cart_${this.authenticatedUser.uid}`;
      localStorage.removeItem(cartKey);
    }
  }
}
