import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarHomeComponent } from '../../../navbar-home/components/navbar-home/navbar-home.component';
import { SlideService } from '../../../../module/admin-vitrineBella/slides/service/slide.service';
import { Slide } from '../../../../module/admin-vitrineBella/slides/interface/slide';
import { CategoryService } from '../../../../module/admin-vitrineBella/categories/service/category.service';
import { ProductService } from '../../../../module/admin-vitrineBella/products/service/product.service';
import { Category } from '../../../../module/admin-vitrineBella/categories/interface/category';
import { FavoritosService } from '../../../services/favoritos.service';
import { FavoritosFirebaseService } from '../../../services/favoritos-firebase.service';
import { CartService } from '../../../services/cart.service';
import { Auth, authState } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';


interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  img: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule, NavbarHomeComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('carouselAnimation', [
      transition(':increment, :decrement', [
        style({ opacity: 0, transform: 'translateX(50px)' }),
        animate('400ms ease-in-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
    trigger('stagger', [
      transition(':enter', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private slideService = inject(SlideService);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private favoritosFirebaseService = inject(FavoritosFirebaseService);
  private cartService = inject(CartService);
  private auth = inject(Auth);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  slides: Slide[] = [];
  isLoadingSlides = true;
  categorias: Category[] = [];
  isLoadingCategories = true;
  isLoadingProducts = true;

  categoriaSelecionada: string = 'todos';
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  produtosChunked: Produto[][] = [];
  favoritos: string[] = []; // IDs dos produtos favoritos
  user$ = authState(this.auth); // Observable do usuário logado
  isUserLoggedIn = false;
  currentSlideIndex = 0;
  categoriesState = 'in';
  productsState = 'in';
  defaultImage = 'assets/img/placeholder.png';
  isAutoPlayActive = true;
  autoPlayInterval: any;

  // Subscriptions para gerenciar unsubscribe
  private productsSubscription?: Subscription;
  private categoriesSubscription?: Subscription;
  private slidesSubscription?: Subscription;

  constructor() {
    if (this.isBrowser) {
      this.loadProducts();
    }
  }

  ngOnInit(): void {
    this.loadSlides();
    this.loadCategories();
    this.loadProducts();
    this.loadFavoritos();
    this.setupAuthListener();
  }

  loadSlides(): void {
    this.slidesSubscription?.unsubscribe(); // Cancelar subscription anterior
    this.slidesSubscription = this.slideService.getSlidesAtivos().subscribe({
      next: (slides) => {
        // Ordenar slides por ordem no cliente
        this.slides = slides.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        this.isLoadingSlides = false;
        if (this.slides.length > 0 && this.isBrowser) {
          this.startCarousel();
        }
      },
      error: (error) => {
        console.error('Erro ao carregar slides:', error);
        this.isLoadingSlides = false;
        // Fallback para slides padrão se houver erro
        this.slides = this.getDefaultSlides();
        if (this.isBrowser) {
          this.startCarousel();
        }
      }
    });
  }

  loadCategories(): void {
    this.categoriesSubscription?.unsubscribe(); // Cancelar subscription anterior
    this.categoriesSubscription = this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        // Adicionar categoria "Todos" no início
        const todosCategory: Category = {
          id: 'todos',
          name: 'Todos',
          description: 'Todos os produtos',
          icon: 'apps',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          productCount: 0
        };
        this.categorias = [todosCategory, ...categories];
        this.isLoadingCategories = false;
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
        this.isLoadingCategories = false;
        // Fallback para categorias padrão
        this.categorias = this.getDefaultCategories();
      }
    });
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productsSubscription?.unsubscribe(); // Cancelar subscription anterior
    this.productsSubscription = this.productService.getProducts().subscribe({
      next: (products) => {
        // Filtrar apenas produtos ativos e converter para o formato local
        this.produtos = products
          .filter(product => product.isActive !== false) // Filtrar produtos ativos
          .map(product => ({
            id: product.id || '',
            nome: product.productName || '',
            descricao: product.description || '',
            preco: product.price || 0,
            categoria: product.category || '',
            img: product.imageUrl || 'assets/img/placeholder.png'
          }));

        this.isLoadingProducts = false;
        this.filtrar(this.categoriaSelecionada);
        if (this.isBrowser) {
          this.chunkProducts();
        }
      },
      error: (error) => {
        console.error('Erro ao carregar produtos:', error);
        // Fallback para produtos mock
        this.produtos = this.getMockProducts();
        this.isLoadingProducts = false;
        this.filtrar(this.categoriaSelecionada);
        if (this.isBrowser) {
          this.chunkProducts();
        }
      }
    });
  }

  private chunkProducts(): void {
    const w = this.isBrowser ? window.innerWidth : 1200;
    const size = w >= 992 ? 4 : w >= 768 ? 3 : 2;
    this.produtosChunked = [];

    // Usar produtosFiltrados em vez de produtos para o chunking
    for (let i = 0; i < this.produtosFiltrados.length; i += size) {
      this.produtosChunked.push(this.produtosFiltrados.slice(i, i + size));
    }
  }

  filtrar(catId: string): void {
    this.categoriaSelecionada = catId;

    if (catId === 'todos') {
      this.produtosFiltrados = [...this.produtos];
    } else {
      this.produtosFiltrados = this.produtos.filter(p => p.categoria === catId);
    }

    if (this.isBrowser) {
      this.chunkProducts();
    }
  }

  adicionarCarrinho(produto: Produto): void {
    try {
      // Converter Produto para Product (interface do serviço)
      const product = {
        id: produto.id,
        productName: produto.nome,
        description: produto.descricao,
        price: produto.preco,
        category: produto.categoria,
        imageUrl: produto.img,
        stock: 10, // Valor padrão
        isActive: true
      };

      this.cartService.addToCart(product);

      this.snackBar.open(`${produto.nome} adicionado ao carrinho!`, 'Fechar', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } catch (error) {
      this.snackBar.open('Erro ao adicionar ao carrinho', 'Fechar', {
        duration: 3000
      });
    }
  }

  // Método para obter avaliação do produto (simulado)
  getProductRating(produto: Produto): number {
    // Simular avaliação baseada no ID do produto
    const hash = produto.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 5) + 1; // Retorna entre 1 e 5
  }

  verDetalhesProduto(produtoId: string): void {
    this.router.navigate(['/produto', produtoId]);
  }

  loadFavoritos(): void {
    // Carrega favoritos do localStorage como fallback
    if (this.isBrowser) {
      const favoritosSalvos = localStorage.getItem('favoritos');
      this.favoritos = favoritosSalvos ? JSON.parse(favoritosSalvos) : [];
    }
  }

  setupAuthListener(): void {
    this.user$.subscribe(user => {
      this.isUserLoggedIn = !!user;

      if (user) {
        // Usuário logado - carregar favoritos do Firebase
        this.loadFavoritosFromFirebase(user.uid);
      } else {
        // Usuário não logado - usar favoritos locais
        this.loadFavoritos();
      }
    });
  }

  loadFavoritosFromFirebase(userId: string): void {
    this.favoritosFirebaseService.getFavoritosByUser(userId).subscribe({
      next: (favoritos) => {
        // Converter favoritos do Firebase para array de IDs
        this.favoritos = favoritos.map(f => f.productId);

        // Sincronizar com localStorage como backup
        if (this.isBrowser) {
          localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
        }
      },
      error: (error) => {
        console.error('Erro ao carregar favoritos do Firebase:', error);
        // Fallback para favoritos locais
        this.loadFavoritos();
      }
    });
  }

  salvarFavoritos(): void {
    if (this.isBrowser) {
      localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
    }
  }

  toggleFavorito(produto: Produto): void {
    if (this.isUserLoggedIn) {
      // Usuário logado - usar Firebase
      this.toggleFavoritoFirebase(produto);
    } else {
      // Usuário não logado - usar localStorage
      this.toggleFavoritoLocal(produto);
    }
  }

  private toggleFavoritoLocal(produto: Produto): void {
    const index = this.favoritos.indexOf(produto.id);
    if (index > -1) {
      // Remove dos favoritos
      this.favoritos.splice(index, 1);
    } else {
      // Adiciona aos favoritos
      this.favoritos.push(produto.id);
    }
    this.salvarFavoritos();
  }

  private async toggleFavoritoFirebase(produto: Produto): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('Usuário não está logado');
      }

      // Buscar accessCode do usuário (você pode ajustar isso conforme sua estrutura de usuário)
      const accessCode = user.uid; // Ou buscar de outro lugar se necessário

      await this.favoritosFirebaseService.toggleFavorito(produto.id, accessCode);

      // Os favoritos serão atualizados automaticamente pelo listener do Firebase
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      // Fallback para localStorage em caso de erro
      this.toggleFavoritoLocal(produto);
    }
  }

  isFavorito(produtoId: string): boolean {
    return this.favoritos.includes(produtoId);
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultImage;
  }

  private startCarousel(): void {
    if (this.isBrowser && this.slides.length > 1) {
      this.stopCarousel(); // Para qualquer intervalo anterior
      this.startAutoPlay();
    }
  }

  private startAutoPlay(): void {
    if (this.isAutoPlayActive && this.slides.length > 1) {
      this.autoPlayInterval = setInterval(() => {
        if (this.isAutoPlayActive) {
          this.nextSlide();
        }
      }, 5000);
    }
  }

  private stopCarousel(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  trackByCategory(_: number, category: Category): string {
    return category.id || '';
  }

  trackByProduct(_: number, product: Produto): string {
    return product.id;
  }

  trackBySlide(_: number, slide: Slide): string {
    return slide.alt;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) {
      this.chunkProducts();
    }
  }

  // Métodos para o novo carrossel
  nextSlide(): void {
    if (this.slides.length > 1) {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
    }
  }

  previousSlide(): void {
    if (this.slides.length > 1) {
      this.currentSlideIndex = this.currentSlideIndex === 0
        ? this.slides.length - 1
        : this.currentSlideIndex - 1;
    }
  }

  goToSlide(index: number): void {
    if (this.slides.length > 1 && index >= 0 && index < this.slides.length) {
      this.currentSlideIndex = index;
    }
  }

  // Produtos em destaque para o banner
  produtosDestaque: Produto[] = [
    {
      id: '1',
      nome: 'Smartphone Gamer 6.7" Full HD',
      descricao: 'Tela AMOLED, 8GB RAM, 128GB',
      preco: 899.99,
      categoria: 'smartphones',
      img: 'https://www.ventasrosario.com.ar/wp-content/uploads/2023/09/iphone-15-3.jpg',
    }
  ];

  toggleAutoPlay(): void {
    this.isAutoPlayActive = !this.isAutoPlayActive;

    if (this.isAutoPlayActive) {
      this.startAutoPlay();
    } else {
      this.stopCarousel();
    }
  }

  ngOnDestroy(): void {
    this.stopCarousel();
    // Unsubscribe de todas as subscriptions para evitar memory leaks
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
    if (this.slidesSubscription) {
      this.slidesSubscription.unsubscribe();
    }
  }

  private getDefaultCategories(): Category[] {
    return [
      {
        id: 'todos',
        name: 'Todos',
        description: 'Todos os produtos',
        icon: 'apps',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        productCount: 0
      },
      {
        id: 'smartphone',
        name: 'Smartphones',
        description: 'Celulares e smartphones',
        icon: 'phone',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        productCount: 0
      },
      {
        id: 'notebook',
        name: 'Notebooks',
        description: 'Laptops e notebooks',
        icon: 'laptop',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        productCount: 0
      },
      {
        id: 'acessorio',
        name: 'Acessórios',
        description: 'Acessórios diversos',
        icon: 'headphones',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        productCount: 0
      }
    ];
  }

  private getDefaultSlides(): Slide[] {
    return [
      {
        id: '1',
        titulo: 'Lançamentos Imperdíveis',
        subtitulo: 'Smartphones e notebooks com até 30% OFF',
        img: 'https://via.placeholder.com/600x400/667eea/ffffff?text=Smartphones+Gamer',
        alt: 'Smartphones Gamer em promoção',
        ativo: true,
        ordem: 1
      },
      {
        id: '2',
        titulo: 'Setup Gamer Completo',
        subtitulo: 'Notebooks com RTX 4060 e processadores Intel i7',
        img: 'https://via.placeholder.com/600x400/764ba2/ffffff?text=Notebooks+RTX',
        alt: 'Notebooks Gamer RTX',
        ativo: true,
        ordem: 2
      }
    ];
  }

  private getMockProducts(): Produto[] {
    return [
      {
        id: '1',
        nome: 'Smartphone X200',
        descricao: 'Tela 6.7″ · 128 GB',
        preco: 3299,
        categoria: 'smartphone',
        img: 'https://www.ventasrosario.com.ar/wp-content/uploads/2023/09/iphone-15-3.jpg',
      },
      {
        id: '2',
        nome: 'Notebook UltraSlim',
        descricao: '14″ · i7 · 16 GB',
        preco: 5599,
        categoria: 'notebook',
        img: 'https://io.convertiez.com.br/m/lojasedmil/shop/products/images/1439/large/notebook-positivo-celeron-c4128-motion-c-tela-antirreflexiva-141-cinza_13915.jpg',
      },
    ];
  }
}
