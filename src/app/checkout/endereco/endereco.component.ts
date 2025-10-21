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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where } from '@angular/fire/firestore';
import { AuthService } from '../../core/auth/auth.service';

import { CartService, Cart } from '../../core/services/cart.service';
import { NavbarHomeComponent } from '../../core/navbar-home/components/navbar-home/navbar-home.component';
import { NgxMaskDirective } from 'ngx-mask';

export interface Endereco {
  id?: string;
  accessCode: string; // CPF do usuário como accessCode
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
  createdAt?: Date;
  updatedAt?: Date;
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
    MatCheckboxModule,
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
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  cart$ = this.cartService.cart$;
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  isLoading = false;
  isLoadingCep = false;
  isLoadingEndereco = false;
  private cartSubscription?: Subscription;
  
  // Usuário atual
  currentUser: any = null;
  userAccessCode: string = '';

  enderecos: Endereco[] = [];
  enderecoSelecionado: string = '';
  showNovoEndereco = false;
  showEditarEndereco = false;
  enderecoParaEditar: Endereco | null = null;
  enderecoOriginal: any = null;

  novoEnderecoForm: FormGroup;
  editarEnderecoForm: FormGroup;

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
      uf: ['', Validators.required],
      isDefault: [false]
    });

    this.editarEnderecoForm = this.fb.group({
      identificacao: ['', Validators.required],
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      referencia: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      uf: ['', Validators.required],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    this.cartSubscription = this.cart$.subscribe(cart => {
      this.cart = cart;
    });

    // Carregar usuário atual
    this.loadCurrentUser();
  }

  // Carregar usuário atual e seus endereços
  async loadCurrentUser(): Promise<void> {
    try {
      this.currentUser = await this.authService.getCurrentUser();
      if (this.currentUser) {
        // Usar CPF como accessCode
        this.userAccessCode = this.currentUser.cpf || this.currentUser.uid;
        // Carregar endereços do usuário
        await this.loadUserEnderecos();
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  }

  // Carregar endereços do usuário do Firebase
  async loadUserEnderecos(): Promise<void> {
    if (!this.userAccessCode) return;

    try {
      const enderecosRef = collection(this.firestore, 'enderecos');
      const q = query(enderecosRef, where('accessCode', '==', this.userAccessCode));
      const querySnapshot = await getDocs(q);
      
      this.enderecos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Endereco[];

      // Carregar do localStorage como fallback se não houver no Firebase
      if (this.enderecos.length === 0 && isPlatformBrowser(this.platformId)) {
        const savedEnderecos = localStorage.getItem('vitrineBella_enderecos');
        if (savedEnderecos) {
          this.enderecos = JSON.parse(savedEnderecos);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      // Fallback para localStorage
      if (isPlatformBrowser(this.platformId)) {
        const savedEnderecos = localStorage.getItem('vitrineBella_enderecos');
        if (savedEnderecos) {
          this.enderecos = JSON.parse(savedEnderecos);
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }


  // Buscar CEP na API
  buscarCep(): void {
    const cep = this.novoEnderecoForm.get('cep')?.value?.replace(/\D/g, '');

    if (cep && cep.length === 8) {
      this.isLoadingCep = true;

      // Função para buscar CEP com retry
      const buscarCepComRetry = async (tentativas = 3): Promise<void> => {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            mode: 'cors',
            cache: 'no-cache'
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          
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

          } else {
            this.snackBar.open('CEP não encontrado!', 'Fechar', { duration: 3000 });
          }
          this.isLoadingCep = false;
        } catch (error) {
          if (tentativas > 1) {
            // Retry após 1 segundo
            setTimeout(() => {
              buscarCepComRetry(tentativas - 1);
            }, 1000);
          } else {
            this.snackBar.open('Erro ao buscar CEP! Verifique sua conexão ou tente novamente.', 'Fechar', { duration: 4000 });
            this.isLoadingCep = false;
          }
        }
      };

      buscarCepComRetry();
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

  // Abrir edição de endereço
  abrirEdicaoEndereco(endereco: Endereco): void {
    this.enderecoParaEditar = endereco;
    this.showEditarEndereco = true;
    
    // Salvar dados originais para comparação
    this.enderecoOriginal = {
      identificacao: endereco.identificacao,
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento || '',
      referencia: endereco.referencia || '',
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
      isDefault: endereco.isDefault || false
    };
    
    // Preencher formulário com dados do endereço
    this.editarEnderecoForm.patchValue({
      identificacao: endereco.identificacao,
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento || '',
      referencia: endereco.referencia || '',
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
      isDefault: endereco.isDefault || false
    });

    // Garantir que todos os campos estejam habilitados
    this.editarEnderecoForm.get('identificacao')?.enable();
    this.editarEnderecoForm.get('cep')?.enable();
    this.editarEnderecoForm.get('logradouro')?.enable();
    this.editarEnderecoForm.get('numero')?.enable();
    this.editarEnderecoForm.get('complemento')?.enable();
    this.editarEnderecoForm.get('referencia')?.enable();
    this.editarEnderecoForm.get('bairro')?.enable();
    this.editarEnderecoForm.get('cidade')?.enable();
    this.editarEnderecoForm.get('uf')?.enable();
  }

  // Buscar CEP para edição
  buscarCepEdicao(): void {
    const cep = this.editarEnderecoForm.get('cep')?.value?.replace(/\D/g, '');

    if (cep && cep.length === 8) {
      this.isLoadingCep = true;

      // Função para buscar CEP com retry
      const buscarCepComRetry = async (tentativas = 3): Promise<void> => {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            mode: 'cors',
            cache: 'no-cache'
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          
          if (!data.erro) {
            this.editarEnderecoForm.patchValue({
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              uf: data.uf
            });

            // Atualizar dados originais para refletir as mudanças do CEP
            if (this.enderecoOriginal) {
              this.enderecoOriginal.logradouro = data.logradouro;
              this.enderecoOriginal.bairro = data.bairro;
              this.enderecoOriginal.cidade = data.localidade;
              this.enderecoOriginal.uf = data.uf;
              this.enderecoOriginal.cep = data.cep || this.editarEnderecoForm.get('cep')?.value;
            }

            // Bloquear os campos preenchidos automaticamente
            this.editarEnderecoForm.get('logradouro')?.disable();
            this.editarEnderecoForm.get('bairro')?.disable();
            this.editarEnderecoForm.get('cidade')?.disable();
            this.editarEnderecoForm.get('uf')?.disable();

            this.snackBar.open('CEP encontrado! Campos de endereço bloqueados automaticamente.', 'Fechar', { duration: 4000 });
          } else {
            this.snackBar.open('CEP não encontrado!', 'Fechar', { duration: 3000 });
          }
          this.isLoadingCep = false;
        } catch (error) {
          if (tentativas > 1) {
            // Retry após 1 segundo
            setTimeout(() => {
              buscarCepComRetry(tentativas - 1);
            }, 1000);
          } else {
            this.snackBar.open('Erro ao buscar CEP! Verifique sua conexão ou tente novamente.', 'Fechar', { duration: 4000 });
            this.isLoadingCep = false;
          }
        }
      };

      buscarCepComRetry();
    } else if (cep && cep.length > 0) {
      this.snackBar.open('CEP deve ter 8 dígitos!', 'Fechar', { duration: 3000 });
    }
  }

  // Salvar edição de endereço
  async salvarEdicaoEndereco(): Promise<void> {
    if (this.editarEnderecoForm.valid && this.enderecoParaEditar && this.userAccessCode) {
      this.isLoadingEndereco = true;

      try {
        // Obter todos os valores do formulário, incluindo campos desabilitados
        const formValue = this.editarEnderecoForm.getRawValue();
        
        // Se este endereço será padrão, remover padrão dos outros
        if (formValue.isDefault) {
          await this.removerEnderecoPadrao();
        }
        
        const enderecoAtualizado: Endereco = {
          ...this.enderecoParaEditar,
          ...formValue,
          updatedAt: new Date()
        };

        // Atualizar no Firebase
        const enderecoRef = doc(this.firestore, 'enderecos', this.enderecoParaEditar.id!);
        await updateDoc(enderecoRef, {
          ...enderecoAtualizado
        });

        // Atualizar lista local
        const index = this.enderecos.findIndex(e => e.id === this.enderecoParaEditar!.id);
        if (index !== -1) {
          this.enderecos[index] = enderecoAtualizado;
        }

        // Atualizar localStorage
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('vitrineBella_enderecos', JSON.stringify(this.enderecos));
        }

        this.showEditarEndereco = false;
        this.enderecoParaEditar = null;
        this.editarEnderecoForm.reset();

        this.snackBar.open('Endereço atualizado com sucesso!', 'Fechar', { duration: 3000 });
      } catch (error) {
        console.error('Erro ao atualizar endereço:', error);
        this.snackBar.open('Erro ao atualizar endereço. Tente novamente.', 'Fechar', { duration: 3000 });
      } finally {
        this.isLoadingEndereco = false;
      }
    } else {
      this.snackBar.open('Preencha todos os campos obrigatórios!', 'Fechar', { duration: 3000 });
    }
  }

  // Verificar se houve alterações no formulário
  temAlteracoes(): boolean {
    if (!this.enderecoOriginal || !this.editarEnderecoForm) {
      return false;
    }

    const formValue = this.editarEnderecoForm.value;
    
    return (
      formValue.identificacao !== this.enderecoOriginal.identificacao ||
      formValue.cep !== this.enderecoOriginal.cep ||
      formValue.logradouro !== this.enderecoOriginal.logradouro ||
      formValue.numero !== this.enderecoOriginal.numero ||
      formValue.complemento !== this.enderecoOriginal.complemento ||
      formValue.referencia !== this.enderecoOriginal.referencia ||
      formValue.bairro !== this.enderecoOriginal.bairro ||
      formValue.cidade !== this.enderecoOriginal.cidade ||
      formValue.uf !== this.enderecoOriginal.uf ||
      formValue.isDefault !== this.enderecoOriginal.isDefault
    );
  }

  // Cancelar edição de endereço
  cancelarEdicaoEndereco(): void {
    this.showEditarEndereco = false;
    this.enderecoParaEditar = null;
    this.enderecoOriginal = null;
    this.editarEnderecoForm.reset();
  }

  // Confirmar exclusão de endereço
  confirmarExclusaoEndereco(endereco: Endereco): void {
    if (confirm(`Tem certeza que deseja excluir o endereço "${endereco.identificacao}"?`)) {
      this.excluirEndereco(endereco.id!);
    }
  }

  // Remover endereço padrão de outros endereços
  private async removerEnderecoPadrao(): Promise<void> {
    if (this.userAccessCode) {
      const enderecosQuery = query(
        collection(this.firestore, 'enderecos'),
        where('accessCode', '==', this.userAccessCode),
        where('isDefault', '==', true)
      );
      
      const querySnapshot = await getDocs(enderecosQuery);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isDefault: false })
      );
      
      await Promise.all(updatePromises);
    }
  }

  // Salvar novo endereço
  async salvarNovoEndereco(): Promise<void> {
    if (this.novoEnderecoForm.valid && this.userAccessCode) {
      this.isLoadingEndereco = true;

      try {
        // Obter todos os valores do formulário, incluindo campos desabilitados
        const formValue = this.novoEnderecoForm.getRawValue();
        
        // Se este endereço será padrão, remover padrão dos outros
        if (formValue.isDefault) {
          await this.removerEnderecoPadrao();
        }
        
        const novoEndereco: Omit<Endereco, 'id'> = {
          accessCode: this.userAccessCode,
          ...formValue,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Salvar no Firebase
        const enderecosRef = collection(this.firestore, 'enderecos');
        const docRef = await addDoc(enderecosRef, novoEndereco);

        // Atualizar lista local
        const enderecoComId: Endereco = {
          id: docRef.id,
          ...novoEndereco
        };

        this.enderecos.push(enderecoComId);
        this.enderecoSelecionado = docRef.id;

        // Salvar no localStorage como backup
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('vitrineBella_enderecos', JSON.stringify(this.enderecos));
        }

        this.showNovoEndereco = false;
        this.novoEnderecoForm.reset();

        this.snackBar.open('Endereço cadastrado com sucesso no Firebase!', 'Fechar', { duration: 3000 });
      } catch (error) {
        console.error('Erro ao salvar endereço no Firebase:', error);
        this.snackBar.open('Erro ao salvar endereço. Tente novamente.', 'Fechar', { duration: 3000 });
      } finally {
        this.isLoadingEndereco = false;
      }
    } else if (!this.userAccessCode) {
      this.snackBar.open('Usuário não identificado. Faça login novamente.', 'Fechar', { duration: 3000 });
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

    // Obter endereço selecionado
    const enderecoSelecionado = this.getEnderecoSelecionado();
    if (!enderecoSelecionado) {
      this.snackBar.open('Endereço não encontrado!', 'Fechar', { duration: 3000 });
      return;
    }

    // Salvar endereço selecionado apenas se estiver no browser
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('vitrineBella_endereco_selecionado', this.enderecoSelecionado);
      localStorage.setItem('vitrineBella_endereco_dados', JSON.stringify(enderecoSelecionado));
    }

    // Navegar para página de entrega
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


  // Excluir endereço
  async excluirEndereco(enderecoId: string): Promise<void> {
    if (!enderecoId || !this.userAccessCode) return;

    this.isLoadingEndereco = true;

    try {
      // Excluir do Firebase
      const enderecoRef = doc(this.firestore, 'enderecos', enderecoId);
      await deleteDoc(enderecoRef);

      // Remover da lista local
      this.enderecos = this.enderecos.filter(e => e.id !== enderecoId);

      // Se era o endereço selecionado, limpar seleção
      if (this.enderecoSelecionado === enderecoId) {
        this.enderecoSelecionado = '';
      }

      // Atualizar localStorage
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('vitrineBella_enderecos', JSON.stringify(this.enderecos));
      }

      this.snackBar.open('Endereço excluído com sucesso!', 'Fechar', { duration: 3000 });
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      this.snackBar.open('Erro ao excluir endereço. Tente novamente.', 'Fechar', { duration: 3000 });
    } finally {
      this.isLoadingEndereco = false;
    }
  }
}
