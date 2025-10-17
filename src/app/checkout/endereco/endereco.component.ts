import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { CartService, Cart } from '../../core/services/cart.service';
import { NavbarHomeComponent } from '../../core/navbar-home/components/navbar-home/navbar-home.component';
import { NgxMaskDirective } from 'ngx-mask';

export interface Endereco {
  id?: string;
  identificacao: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  referencia?: string;
  bairro: string;
  cidade: string;
  uf: string;
  isDefault?: boolean;
}

@Component({
  selector: 'app-endereco',
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
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatRadioModule,
    NavbarHomeComponent,
    NgxMaskDirective
],
  templateUrl: './endereco.component.html',
  styleUrl: './endereco.component.scss'
})
export class EnderecoComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  cart$ = this.cartService.cart$;
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  isLoading = false;
  isLoadingCep = false;
  private cartSubscription?: Subscription;

  enderecos: Endereco[] = [];
  enderecoSelecionado: string = '';
  showNovoEndereco = false;

  novoEnderecoForm: FormGroup;

  constructor() {
    this.novoEnderecoForm = this.fb.group({
      identificacao: ['', Validators.required],
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      referencia: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      uf: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cartSubscription = this.cart$.subscribe(cart => {
      this.cart = cart;
    });

  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }


  // Buscar CEP na API
  buscarCep(): void {
    const cep = this.novoEnderecoForm.get('cep')?.value?.replace(/\D/g, '');

    if (cep && cep.length === 8) {
      this.isLoadingCep = true;

      this.http.get(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
        next: (data: any) => {
          if (!data.erro) {
            this.novoEnderecoForm.patchValue({
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              uf: data.uf
            });

            // Bloquear os campos preenchidos automaticamente
            this.novoEnderecoForm.get('logradouro')?.disable();
            this.novoEnderecoForm.get('bairro')?.disable();
            this.novoEnderecoForm.get('cidade')?.disable();
            this.novoEnderecoForm.get('uf')?.disable();

            this.snackBar.open('CEP encontrado! Campos de endereço bloqueados automaticamente.', 'Fechar', { duration: 4000 });
          } else {
            this.snackBar.open('CEP não encontrado!', 'Fechar', { duration: 3000 });
          }
          this.isLoadingCep = false;
        },
        error: () => {
          this.snackBar.open('Erro ao buscar CEP!', 'Fechar', { duration: 3000 });
          this.isLoadingCep = false;
        }
      });
    } else if (cep && cep.length > 0) {
      this.snackBar.open('CEP deve ter 8 dígitos!', 'Fechar', { duration: 3000 });
    }
  }

  // Selecionar endereço
  selecionarEndereco(enderecoId: string): void {
    this.enderecoSelecionado = enderecoId;
  }

  // Mostrar formulário de novo endereço
  mostrarNovoEndereco(): void {
    this.showNovoEndereco = true;
    this.novoEnderecoForm.reset();

    // Garantir que todos os campos estejam habilitados
    this.novoEnderecoForm.get('identificacao')?.enable();
    this.novoEnderecoForm.get('cep')?.enable();
    this.novoEnderecoForm.get('logradouro')?.enable();
    this.novoEnderecoForm.get('numero')?.enable();
    this.novoEnderecoForm.get('complemento')?.enable();
    this.novoEnderecoForm.get('referencia')?.enable();
    this.novoEnderecoForm.get('bairro')?.enable();
    this.novoEnderecoForm.get('cidade')?.enable();
    this.novoEnderecoForm.get('uf')?.enable();
  }

  // Cancelar novo endereço
  cancelarNovoEndereco(): void {
    this.showNovoEndereco = false;
    this.novoEnderecoForm.reset();
  }

  // Salvar novo endereço
  salvarNovoEndereco(): void {
    if (this.novoEnderecoForm.valid) {
      const novoEndereco: Endereco = {
        id: Date.now().toString(),
        ...this.novoEnderecoForm.value
      };

      this.enderecos.push(novoEndereco);
      this.enderecoSelecionado = novoEndereco.id!;

      // Salvar no localStorage apenas se estiver no browser
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('vitrineBella_enderecos', JSON.stringify(this.enderecos));
      }

      this.showNovoEndereco = false;
      this.novoEnderecoForm.reset();

      this.snackBar.open('Endereço cadastrado com sucesso!', 'Fechar', { duration: 3000 });
    } else {
      this.snackBar.open('Preencha todos os campos obrigatórios!', 'Fechar', { duration: 3000 });
    }
  }

  // Continuar para próxima etapa
  continuar(): void {
    if (!this.enderecoSelecionado) {
      this.snackBar.open('Selecione um endereço!', 'Fechar', { duration: 3000 });
      return;
    }

    // Salvar endereço selecionado apenas se estiver no browser
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('vitrineBella_endereco_selecionado', this.enderecoSelecionado);
    }

    // Navegar para próxima etapa
    this.router.navigate(['/checkout/entrega']);
  }

  // Voltar para carrinho
  voltar(): void {
    this.router.navigate(['/carrinho']);
  }

  // Formatar preço
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  // Obter endereço selecionado
  getEnderecoSelecionado(): Endereco | undefined {
    return this.enderecos.find(e => e.id === this.enderecoSelecionado);
  }
}
