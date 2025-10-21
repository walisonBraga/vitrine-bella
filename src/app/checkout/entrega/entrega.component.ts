import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { Subscription } from 'rxjs';

import { CartService, Cart } from '../../core/services/cart.service';
import { NavbarHomeComponent } from '../../core/navbar-home/components/navbar-home/navbar-home.component';
import { FreteService, FreteRequest, FreteOption } from './frete.service';

export interface DeliveryOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  description?: string;
  transportadora?: string;
}

@Component({
  selector: 'app-entrega',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    NavbarHomeComponent
  ],
  templateUrl: './entrega.component.html',
  styleUrl: './entrega.component.scss'
})
export class EntregaComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private freteService = inject(FreteService);

  private cart$ = this.cartService.cart$;
  private cartSubscription?: Subscription;

  cart: Cart = { items: [], totalPrice: 0, totalItems: 0 };
  
  deliveryForm: FormGroup;
  selectedDelivery: DeliveryOption | null = null;
  isLoadingFrete = false;
  
  // Endereço selecionado (vem da página anterior)
  selectedAddress: any = null;

  // Opções de entrega
  deliveryOptions: DeliveryOption[] = [
    {
      id: 'economica',
      name: 'Entrega Econômica',
      price: 82.96,
      estimatedDays: 6,
      description: 'Entrega mais econômica'
    },
    {
      id: 'padrao',
      name: 'Entrega Padrão',
      price: 151.91,
      estimatedDays: 5,
      description: 'Entrega padrão'
    },
    {
      id: 'expressa',
      name: 'Entrega Expressa',
      price: 154.21,
      estimatedDays: 1,
      description: 'Entrega mais rápida'
    }
  ];

  constructor() {
    this.deliveryForm = this.fb.group({
      deliveryOption: ['economica', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cartSubscription = this.cart$.subscribe(cart => {
      this.cart = cart;
    });

    // Carregar endereço selecionado
    this.carregarEnderecoSelecionado();
  }

  // Carregar endereço selecionado
  carregarEnderecoSelecionado(): void {
    // Tentar carregar endereço do localStorage
    const enderecoData = localStorage.getItem('vitrineBella_endereco_dados');
    
    if (enderecoData) {
      try {
        this.selectedAddress = JSON.parse(enderecoData);
        // Carregar opções de frete após carregar endereço
        this.carregarOpcoesFrete();
      } catch (error) {
        console.error('Erro ao carregar endereço:', error);
        this.snackBar.open('Erro ao carregar endereço selecionado', 'Fechar', { duration: 3000 });
        this.router.navigate(['/checkout/endereco']);
      }
    } else {
      // Se não há endereço selecionado, voltar para página de endereço
      this.snackBar.open('Nenhum endereço selecionado', 'Fechar', { duration: 3000 });
      this.router.navigate(['/checkout/endereco']);
    }
  }

  // Carregar opções de frete
  carregarOpcoesFrete(): void {
    this.isLoadingFrete = true;

    // Dados do produto (simulados - em produção vir do carrinho)
    const freteRequest: FreteRequest = {
      cepOrigem: '69901-000', // CEP de origem da loja
      cepDestino: this.selectedAddress.cep,
      peso: 1000, // 1kg
      comprimento: 30,
      largura: 20,
      altura: 10,
      valor: this.cart.totalPrice
    };

    this.freteService.calcularFrete(freteRequest).subscribe({
      next: (response) => {
        // Converter opções do serviço para opções de entrega
        this.deliveryOptions = response.opcoes.map((opcao, index) => ({
          id: opcao.transportadora.toLowerCase().replace(' ', '_') + '_' + index,
          name: opcao.servico,
          price: opcao.preco,
          estimatedDays: opcao.prazo,
          transportadora: opcao.transportadora,
          description: opcao.servico
        }));

        // Se não há opções da API, usar opções padrão
        if (this.deliveryOptions.length === 0) {
          this.deliveryOptions = this.freteService.gerarOpcoesFrete(freteRequest).map((opcao, index) => ({
            id: opcao.transportadora.toLowerCase().replace(' ', '_') + '_' + index,
            name: opcao.servico,
            price: opcao.preco,
            estimatedDays: opcao.prazo,
            transportadora: opcao.transportadora,
            description: opcao.servico
          }));
        }

        // Selecionar primeira opção por padrão
        if (this.deliveryOptions.length > 0) {
          this.selectedDelivery = this.deliveryOptions[0];
          this.deliveryForm.patchValue({ deliveryOption: this.deliveryOptions[0].id });
        }

        this.isLoadingFrete = false;
      },
      error: (error) => {
        console.error('Erro ao calcular frete:', error);
        
        // Usar opções padrão em caso de erro
        const freteRequest: FreteRequest = {
          cepOrigem: '69901-000',
          cepDestino: this.selectedAddress.cep,
          peso: 1000,
          comprimento: 30,
          largura: 20,
          altura: 10,
          valor: this.cart.totalPrice
        };

        this.deliveryOptions = this.freteService.gerarOpcoesFrete(freteRequest).map((opcao, index) => ({
          id: opcao.transportadora.toLowerCase().replace(' ', '_') + '_' + index,
          name: opcao.servico,
          price: opcao.preco,
          estimatedDays: opcao.prazo,
          transportadora: opcao.transportadora,
          description: opcao.servico
        }));

        if (this.deliveryOptions.length > 0) {
          this.selectedDelivery = this.deliveryOptions[0];
          this.deliveryForm.patchValue({ deliveryOption: this.deliveryOptions[0].id });
        }

        this.isLoadingFrete = false;
        this.snackBar.open('Usando opções de frete padrão', 'Fechar', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  // Selecionar opção de entrega
  selectDelivery(option: DeliveryOption): void {
    this.selectedDelivery = option;
    this.deliveryForm.patchValue({ deliveryOption: option.id });
  }

  // Calcular data estimada de entrega
  calculateDeliveryDate(days: number): string {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + days);
    
    return deliveryDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Formatar preço
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  // Calcular total com frete
  getTotalWithShipping(): number {
    return this.cart.totalPrice + (this.selectedDelivery?.price || 0);
  }

  // Calcular valor à vista no PIX (8% de desconto)
  getPixPrice(): number {
    return this.getTotalWithShipping() * 0.92;
  }

  // Calcular economia no PIX
  getPixSavings(): number {
    return this.getTotalWithShipping() * 0.08;
  }

  // Calcular parcela (10x sem juros)
  getInstallmentValue(): number {
    return this.getTotalWithShipping() / 10;
  }

  // Continuar para próxima etapa
  continuar(): void {
    if (this.deliveryForm.valid && this.selectedDelivery) {
      // Salvar opção de entrega selecionada
      localStorage.setItem('selectedDelivery', JSON.stringify(this.selectedDelivery));
      
      // Navegar para próxima etapa (pagamento)
      this.router.navigate(['/checkout/pagamento']);
    } else {
      this.snackBar.open('Selecione uma opção de entrega!', 'Fechar', { duration: 3000 });
    }
  }

  // Voltar para etapa anterior
  voltar(): void {
    this.router.navigate(['/checkout/endereco']);
  }
}
