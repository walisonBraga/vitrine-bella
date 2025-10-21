import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Product } from '../../../products/interface/products';
import { SaleItem, SaleForm } from '../../interface/sales';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SalesService } from '../../service/sales.service';
import { PreRegistrationService, PreRegistration } from '../../../shared/services/pre-registration.service';
import { LojaUsersService } from '../../../users/service/loja-users.service';
import { CartService } from '../../../../../core/services/cart.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Formulários
  customerSearchForm!: FormGroup;
  customerDataForm!: FormGroup;
  paymentForm!: FormGroup;

  // Dados
  cartItems: SaleItem[] = [];
  authenticatedUser: any | null = null;
  foundCustomer: PreRegistration | null = null;
  isSearchingCustomer = false;

  // Estados das etapas
  currentStep = 1;
  totalSteps = 4;

  // Estados
  isProcessingSale = false;
  isCreatingPreRegistration = false;
  isProcessing = false; // Para o botão de finalizar compra
  hasSearchedForCustomer = false;
  showCustomerSearch = true; // Sempre mostrar busca primeiro
  showCustomerForm = false; // Controla se deve mostrar formulário de dados do cliente

  // Totais
  subtotal = 0;
  discount = 0;
  total = 0;

  // Etapas
  steps = [
    { number: 1, title: 'Produtos', icon: 'shopping_cart', completed: false },
    { number: 2, title: 'Cliente', icon: 'person', completed: false },
    { number: 3, title: 'Pagamento', icon: 'payment', completed: false },
    { number: 4, title: 'Confirmação', icon: 'check_circle', completed: false }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private salesService: SalesService,
    private preRegistrationService: PreRegistrationService,
    private lojaUsersService: LojaUsersService,
    private cartService: CartService,
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
        // Preencher automaticamente o campo do vendedor
        if (user) {
          const salespersonName = user.fullName || user.displayName || user.email;
          this.customerDataForm.patchValue({
            salespersonName: salespersonName
          });
        }
      });

    // Carregar dados do carrinho do localStorage
    this.loadCartFromStorage();
    this.calculateTotals();

    // Se tem produtos no carrinho, ir direto para etapa 2 (busca de cliente)
    if (this.cartItems.length > 0) {
      this.currentStep = 2;
      this.steps[0].completed = true; // Marcar etapa 1 como concluída
      // Focar no campo de busca de cliente
      setTimeout(() => {
        this.focusOnCustomerSearch();
      }, 300);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    // Formulário de busca de cliente
    this.customerSearchForm = this.formBuilder.group({
      searchTerm: ['', Validators.required]
    });

    // Formulário de dados do cliente
    this.customerDataForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      salespersonName: ['', [Validators.required, Validators.minLength(2)]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)]],
      birthDate: [''],
      gender: [''],
      address: [''],
      city: [''],
      state: [''],
      zipCode: ['']
    });

    // Formulário de pagamento
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['', Validators.required],
      discount: [0, [Validators.min(0)]],
      installments: [1, [Validators.min(1), Validators.max(12)]]
    });
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('checkout_cart');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
    }
  }

  private saveCartToStorage(): void {
    localStorage.setItem('checkout_cart', JSON.stringify(this.cartItems));
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    this.discount = this.paymentForm.get('discount')?.value || 0;
    this.total = this.subtotal - this.discount;
  }

  // Navegação entre etapas
  nextStep(): void {
    if (this.canProceedToNextStep()) {
      this.steps[this.currentStep - 1].completed = true;
      this.currentStep++;

      if (this.currentStep === 2) {
        // Etapa 2: Buscar cliente
        this.focusOnCustomerSearch();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.steps[this.currentStep].completed = false;
    }
  }

  goToStep(stepNumber: number): void {
    if (this.canGoToStep(stepNumber)) {
      this.currentStep = stepNumber;
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1: return this.cartItems.length > 0;
      case 2: return this.showCustomerForm && (this.foundCustomer !== null || this.customerDataForm.valid);
      case 3: return this.paymentForm.valid;
      default: return true;
    }
  }

  private canGoToStep(stepNumber: number): boolean {
    // Só pode voltar para etapas anteriores ou pular se os passos anteriores foram completados
    return stepNumber <= this.currentStep || this.steps[stepNumber - 2]?.completed;
  }

  // Etapa 1: Produtos
  updateQuantity(productId: string, newQuantity: number): void {
    const item = this.cartItems.find(item => item.productId === productId);
    if (item && newQuantity > 0) {
      item.quantity = newQuantity;
      item.subtotal = item.quantity * item.productPrice;
      this.saveCartToStorage();
      this.calculateTotals();
    }
  }

  removeItem(productId: string): void {
    this.cartItems = this.cartItems.filter(item => item.productId !== productId);
    this.saveCartToStorage();
    this.calculateTotals();
  }

  clearCart(): void {
    this.cartItems = [];
    this.saveCartToStorage();
    this.calculateTotals();
    this.router.navigate(['/admin/internal-sales']);
  }

  goToSalesPage(): void {
    this.router.navigate(['/admin/internal-sales']);
  }

  // Etapa 2: Cliente
  private focusOnCustomerSearch(): void {
    setTimeout(() => {
      const searchInput = document.querySelector('input[formControlName="searchTerm"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  }

  searchCustomer(): void {
    if (this.customerSearchForm.valid) {
      this.isSearchingCustomer = true;
      this.hasSearchedForCustomer = true;
      const searchTerm = this.customerSearchForm.get('searchTerm')?.value.toLowerCase().trim();

      // Buscar primeiro nos users (todos os usuários, não apenas os da loja)
      this.lojaUsersService.getAllUsers().subscribe({
        next: (users: any[]) => {
          const customerUsers = users.filter((user: any) =>
            user.userRole === 'cliente' ||
            user.cpf ||
            user.email
          );

          const foundUser = customerUsers.find((user: any) => {
            // Buscar por CPF
            if (/\d/.test(searchTerm) && !searchTerm.includes('@')) {
              const cleanSearchTerm = searchTerm.replace(/[.\-\s]/g, '');
              const cleanUserCpf = user.cpf ? user.cpf.replace(/[.\-\s]/g, '') : '';

              if (cleanUserCpf && cleanUserCpf.includes(cleanSearchTerm)) {
                return true;
              }
            }

            // Buscar por email
            if (user.email && user.email.toLowerCase().includes(searchTerm)) {
              return true;
            }

            // Buscar por nome
            if (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) {
              return true;
            }
            return false;
          });

          if (foundUser) {
            // Cliente encontrado nos users
            this.foundCustomer = {
              id: foundUser.uid,
              name: foundUser.fullName || '',
              email: foundUser.email || '',
              cpf: foundUser.cpf || '',
              phone: foundUser.phone || '',
              createdAt: new Date(),
              updatedAt: new Date(),
              isCompleted: true
            };

            const customerData = {
              name: foundUser.fullName || '',
              email: foundUser.email || '',
              cpf: foundUser.cpf || '',
              phone: foundUser.phone || ''
            };

            this.customerDataForm.patchValue(customerData);
            this.showCustomerSearch = false; // Esconder busca
            this.showCustomerForm = true; // Mostrar dados
            this.snackBar.open('Cliente encontrado!', 'Fechar', { duration: 2000 });
            this.isSearchingCustomer = false;
          } else {
            // Se não encontrou nos users, buscar nos pre-registrations
            this.searchInPreRegistrations(searchTerm);
          }
        },
        error: (error: any) => {
          console.error('Erro ao buscar cliente nos users:', error);
          // Se der erro nos users, tentar nos pre-registrations
          this.searchInPreRegistrations(searchTerm);
        }
      });
    }
  }

  private searchInPreRegistrations(searchTerm: string): void {
    this.preRegistrationService.getAllPreRegistrations().subscribe({
      next: (preRegistrations: PreRegistration[]) => {
        const foundPreRegistration = preRegistrations.find((preReg: PreRegistration) => {
          if (/\d/.test(searchTerm) && !searchTerm.includes('@')) {
            const cleanSearchTerm = searchTerm.replace(/[.\-\s]/g, '');
            const cleanPreRegCpf = preReg.cpf ? preReg.cpf.replace(/[.\-\s]/g, '') : '';
            if (cleanPreRegCpf && cleanPreRegCpf.includes(cleanSearchTerm)) {
              return true;
            }
          }
          if (preReg.email && preReg.email.toLowerCase().includes(searchTerm)) {
            return true;
          }
          if (preReg.name && preReg.name.toLowerCase().includes(searchTerm)) {
            return true;
          }
          return false;
        });

        if (foundPreRegistration) {
          // Cliente encontrado nos pre-registrations
          this.foundCustomer = foundPreRegistration;

          const customerData = {
            name: foundPreRegistration.name || '',
            email: foundPreRegistration.email || '',
            cpf: foundPreRegistration.cpf || '',
            phone: foundPreRegistration.phone || ''
          };

          this.customerDataForm.patchValue(customerData);
          this.showCustomerSearch = false; // Esconder busca
          this.showCustomerForm = true; // Mostrar dados
          this.snackBar.open('Cliente encontrado nos pré-cadastros!', 'Fechar', { duration: 2000 });
        } else {
          // Cliente não encontrado em nenhuma coleção
          this.foundCustomer = null;
          this.customerDataForm.reset();
          this.showCustomerSearch = false; // Esconder busca
          this.showCustomerForm = true; // Mostrar formulário para novo cliente
          this.snackBar.open('Cliente não encontrado. Preencha os dados para novo cadastro.', 'Fechar', { duration: 3000 });
        }
        this.isSearchingCustomer = false;
      },
      error: (error: any) => {
        console.error('Erro ao buscar cliente nos pre-registrations:', error);
        this.foundCustomer = null;
        this.customerDataForm.reset();
        this.showCustomerSearch = false; // Esconder busca
        this.showCustomerForm = true; // Mostrar formulário para novo cliente
        this.snackBar.open('Erro ao buscar cliente. Preencha os dados para novo cadastro.', 'Fechar', { duration: 3000 });
        this.isSearchingCustomer = false;
      }
    });
  }

  clearCustomerSearch(): void {
    this.foundCustomer = null;
    this.hasSearchedForCustomer = false;
    this.customerDataForm.reset();
    this.customerSearchForm.reset();
    this.showCustomerSearch = true; // Mostrar busca novamente
    this.showCustomerForm = false; // Esconder formulário
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Se o valor parece ser um CPF (contém números e não é email)
    if (/\d/.test(value) && !value.includes('@')) {
      // Aplicar máscara de CPF
      value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
      value = value.replace(/(\d{3})(\d)/, '$1.$2'); // Adiciona ponto após 3 dígitos
      value = value.replace(/(\d{3})(\d)/, '$1.$2'); // Adiciona ponto após 6 dígitos
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Adiciona hífen antes dos 2 últimos dígitos

      // Atualizar o valor no formulário
      this.customerSearchForm.patchValue({ searchTerm: value });
    }
  }

  onCpfChange(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      this.customerDataForm.get('cpf')?.setValue(value, { emitEvent: false });
    }
  }

  onPhoneChange(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      this.customerDataForm.get('phone')?.setValue(value, { emitEvent: false });
    }
  }

  onZipCodeChange(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
      this.customerDataForm.get('zipCode')?.setValue(value, { emitEvent: false });
    }
  }

  // Etapa 3: Pagamento
  onDiscountChange(): void {
    this.calculateTotals();
  }

  // Etapa 4: Confirmação e Finalização
  confirmPurchase(): void {
    if (this.canProceedToNextStep()) {
      this.isProcessingSale = true;

      // Criar pré-cadastro se necessário
      if (!this.foundCustomer) {
        this.createPreRegistrationAndProcessSale();
      } else {
        this.processSale(this.foundCustomer.id!);
      }
    }
  }

  private createPreRegistrationAndProcessSale(): void {
    this.isCreatingPreRegistration = true;

    const formData = this.customerDataForm.value;
    // Salvar apenas os dados do cliente no pré-registro
    const preRegistrationData: Omit<PreRegistration, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'sales'> = {
      cpf: formData.cpf,
      email: formData.email,
      phone: formData.phone,
      name: formData.name,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      birthDate: formData.birthDate,
      gender: formData.gender
    };

    this.preRegistrationService.createPreRegistration(preRegistrationData).subscribe({
      next: (preRegId) => {
        // Processar venda sem vincular ao pré-registro (apenas dados do cliente salvos no pré-registro)
        this.processSale()
          .then(() => {
            // Limpar tudo após venda concluída
            this.clearAllData();

            // Mostrar mensagem de sucesso
            this.snackBar.open('Venda finalizada com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });

            // Voltar para a tela de vendas internas
            setTimeout(() => {
              this.router.navigate(['/admin/internal-sales']);
            }, 1500);
          })
          .catch((error: any) => {
            console.error('Erro ao processar venda:', error);
            this.snackBar.open('Erro ao processar venda. Tente novamente.', 'Fechar', { duration: 3000 });
          })
          .finally(() => {
            this.isProcessing = false;
            this.isProcessingSale = false;
            this.isCreatingPreRegistration = false;
          });
      },
      error: (error) => {
        console.error('Erro ao criar pré-cadastro:', error);
        this.snackBar.open('Erro ao criar pré-cadastro. Tente novamente.', 'Fechar', { duration: 3000 });
        this.isProcessing = false;
        this.isProcessingSale = false;
        this.isCreatingPreRegistration = false;
      }
    });
  }

  private processSale(preRegistrationId?: string): Promise<void> {
    const customerCpf = this.customerDataForm.get('cpf')?.value;
    const saleData: SaleForm = {
      customerName: this.customerDataForm.get('name')?.value,
      customerEmail: this.customerDataForm.get('email')?.value,
      customerPhone: this.customerDataForm.get('phone')?.value,
      customerCpf: customerCpf,
      accessCPF: customerCpf, // Usar CPF como accessCode para localizar a compra do usuário
      items: [...this.cartItems],
      discount: this.paymentForm.get('discount')?.value || 0,
      paymentMethod: this.paymentForm.get('paymentMethod')?.value
    };

    return this.salesService.createSale(saleData, this.authenticatedUser?.uid || '')
      .then((saleId) => {
        // Venda salva apenas no banco de sales com accessCPF para localização
        this.steps[this.currentStep - 1].completed = true;
        this.isProcessingSale = false;
        this.isCreatingPreRegistration = false;
      })
      .catch((error: any) => {
        console.error('Erro ao processar venda:', error);
        this.snackBar.open('Erro ao processar venda. Tente novamente.', 'Fechar', { duration: 3000 });
        this.isProcessingSale = false;
        this.isCreatingPreRegistration = false;
        throw error;
      });
  }

  finalizePurchase(): void {
    if (!this.customerDataForm.valid || !this.paymentForm.valid) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }

    this.isProcessing = true;

    // Usar confirmPurchase para criar pré-registration se necessário
    this.confirmPurchase();
  }

  clearAllData(): void {
    // Limpar carrinho do CartService
    this.cartService.clearCart();
    this.cartItems = [];

    // Limpar carrinho local das vendas internas
    localStorage.removeItem('checkout_cart');
    if (this.authenticatedUser?.uid) {
      const cartKey = `cart_${this.authenticatedUser.uid}`;
      localStorage.removeItem(cartKey);
    }

    // Limpar formulários
    this.customerDataForm.reset();
    this.paymentForm.reset();

    // Resetar estados
    this.currentStep = 1;
    this.showCustomerSearch = true;
    this.showCustomerForm = false;
    this.foundCustomer = null;
    this.discount = 0;

    // Limpar dados do cliente encontrado
    this.foundCustomer = null;

    // Resetar formulário de pagamento para PIX por padrão
    this.paymentForm.patchValue({
      paymentMethod: 'pix'
    });
  }


  // Getters para validação
  get customerNameError(): string {
    const nameControl = this.customerDataForm.get('name');
    if (nameControl?.hasError('required')) return 'Nome é obrigatório';
    if (nameControl?.hasError('minlength')) return 'Nome deve ter pelo menos 2 caracteres';
    return '';
  }

  get salespersonNameError(): string {
    const salespersonControl = this.customerDataForm.get('salespersonName');
    if (salespersonControl?.hasError('required')) return 'Nome do vendedor é obrigatório';
    if (salespersonControl?.hasError('minlength')) return 'Nome do vendedor deve ter pelo menos 2 caracteres';
    return '';
  }

  get cpfError(): string {
    const cpfControl = this.customerDataForm.get('cpf');
    if (cpfControl?.hasError('required')) return 'CPF é obrigatório';
    if (cpfControl?.hasError('pattern')) return 'CPF deve estar no formato 000.000.000-00';
    return '';
  }

  get emailError(): string {
    const emailControl = this.customerDataForm.get('email');
    if (emailControl?.hasError('required')) return 'Email é obrigatório';
    if (emailControl?.hasError('email')) return 'Email inválido';
    return '';
  }

  get phoneError(): string {
    const phoneControl = this.customerDataForm.get('phone');
    if (phoneControl?.hasError('required')) return 'Telefone é obrigatório';
    if (phoneControl?.hasError('pattern')) return 'Telefone deve estar no formato (00) 00000-0000';
    return '';
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
}
