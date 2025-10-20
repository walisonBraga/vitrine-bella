import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Product } from '../../../products/interface/products';
import { SaleItem, SaleForm } from '../../interface/sales';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SalesService } from '../../service/sales.service';
import { ProductService } from '../../../products/service/product.service';
import { GoalService } from '../../../goals/service/goal.service';
import { PreRegistrationService } from '../../../shared/services/pre-registration.service';
import { PreRegistrationModalComponent } from '../pre-registration-modal/pre-registration-modal.component';


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
  isUpdatingGoal = false; // Proteção contra múltiplas atualizações

  // Totais
  subtotal = 0;
  discount = 0;
  total = 0;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private salesService: SalesService,
    private productService: ProductService,
    private goalService: GoalService,
    private preRegistrationService: PreRegistrationService,
    private dialog: MatDialog,
    private router: Router,
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
        subtotal: product.price,
        imageUrl: product.imageUrl ?? undefined
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

  goToCheckout(): void {
    if (this.cartItems.length > 0) {
      // Salvar carrinho no localStorage para o checkout
      localStorage.setItem('checkout_cart', JSON.stringify(this.cartItems));
      // Redirecionar para o checkout
      this.router.navigate(['/admin/checkout']);
    } else {
      this.snackBar.open('Adicione produtos ao carrinho antes de finalizar a compra.', 'Fechar', { duration: 3000 });
    }
  }

  processSale(): void {
    if (this.cartItems.length > 0) {
      // Verificar se é um cliente novo (sem dados completos) ou cliente existente
      const customerName = this.saleForm.get('customerName')?.value;
      const customerEmail = this.saleForm.get('customerEmail')?.value;
      const customerPhone = this.saleForm.get('customerPhone')?.value;

      // Se não tem dados do cliente ou dados incompletos, abrir modal de pré-cadastro
      if (!customerName || !customerEmail || !customerPhone) {
        this.openPreRegistrationModal();
        return;
      }

      // Se tem dados completos, processar venda normalmente
      this.executeSale();
    }
  }

  private openPreRegistrationModal(): void {
    const dialogRef = this.dialog.open(PreRegistrationModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        cartItems: this.cartItems,
        total: this.total
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Atualizar formulário com dados do pré-cadastro
        this.saleForm.patchValue({
          customerName: result.customerData.name,
          customerEmail: result.customerData.email,
          customerPhone: result.customerData.phone
        });

        // Processar a venda com os dados do pré-cadastro
        this.executeSale(result.preRegistrationId);
      }
    });
  }

  private executeSale(preRegistrationId?: string): void {
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

      const finalAmount = this.total; // Valor final da venda

      this.salesService.createSale(saleData, this.authenticatedUser?.uid || '')
        .then((saleId) => {
          // Primeiro calcular e mostrar a soma das vendas
          this.calculateAndShowSalesSum(finalAmount);

          // Adicionar venda ao histórico do cliente (se for pré-cadastro)
          if (preRegistrationId) {
            this.addSaleToCustomerHistory(preRegistrationId, saleId, finalAmount);
          }

          this.snackBar.open('Venda realizada com sucesso!', 'Fechar', { duration: 3000 });
          this.clearCart();
          this.clearSavedCart();
          this.saleForm.reset();
          this.saleForm.patchValue({
            paymentMethod: 'cash',
            discount: 0
          });
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

  private addSaleToCustomerHistory(preRegistrationId: string, saleId: string, amount: number): void {
    const saleHistory = {
      saleId,
      date: new Date(),
      amount,
      items: this.cartItems.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.productPrice
      }))
    };

    // Buscar pré-cadastro e adicionar venda ao histórico
    this.preRegistrationService.getPreRegistrationByCpf(
      this.saleForm.get('customerName')?.value // Aqui deveria ser CPF, mas vamos ajustar
    ).subscribe(preReg => {
      if (preReg && preReg.id) {
        const updatedSales = [...(preReg.sales || []), saleHistory];
        this.preRegistrationService.updatePreRegistration(preReg.id, { sales: updatedSales }).subscribe();
      }
    });
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

  // Calcular soma das vendas e atualizar meta
  private calculateAndShowSalesSum(salesAmount: number): void {
    if (!this.authenticatedUser?.uid || this.isUpdatingGoal) {
      return;
    }

    this.isUpdatingGoal = true; // Bloquear múltiplas chamadas

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Buscar metas do usuário para o mês atual
    this.goalService.getGoals()
      .pipe(takeUntil(this.destroy$))
      .subscribe(goals => {
        const userGoals = goals.filter(goal =>
          goal.userId === this.authenticatedUser?.uid &&
          goal.month === currentMonth &&
          goal.year === currentYear &&
          goal.status === 'active'
        );

        if (userGoals.length > 0) {
          const goal = userGoals[0];
          const previousAmount = goal.currentAmount;
          const newTotalAmount = previousAmount + salesAmount;

          // Agora atualizar a meta com o valor correto
          this.updateSalesGoal(goal.id!, salesAmount, previousAmount, newTotalAmount);
        } else {
          this.isUpdatingGoal = false; // Liberar bloqueio
        }
      });
  }

  // Atualizar meta de vendas automaticamente
  private updateSalesGoal(goalId: string, salesAmount: number, previousAmount: number, newTotalAmount: number): void {
    this.goalService.updateSales(goalId, salesAmount)
      .subscribe({
        next: () => {
          this.snackBar.open(`Meta atualizada! Total de vendas: R$ ${newTotalAmount.toFixed(2)}`, 'Fechar', { duration: 4000 });
          this.isUpdatingGoal = false; // Liberar bloqueio após sucesso
        },
        error: (error) => {
          this.snackBar.open('Erro ao atualizar meta de vendas', 'Fechar', { duration: 3000 });
          this.isUpdatingGoal = false; // Liberar bloqueio mesmo em caso de erro
        }
      });
  }
}
