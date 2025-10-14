import { Component, HostListener, inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarHomeComponent } from '../../../navbar-home/components/navbar-home/navbar-home.component';


interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  img: string;
}

interface Categoria {
  id: string;
  nome: string;
  icon: string;
}

interface Slide {
  img: string;
  alt: string;
  titulo: string;
  subtitulo: string;
  link: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, NavbarHomeComponent],
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
export class HomeComponent {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  slides: Slide[] = [
    {
      img: 'assets/banners/banner-1.jpg',
      alt: 'Promo Lançamentos',
      titulo: 'Lançamentos imperdíveis',
      subtitulo: 'Smartphones e notebooks com até 30% OFF',
      link: '/produtos?tag=lancamento',
    },
    {
      img: 'assets/banners/banner-2.jpg',
      alt: 'Linha gamer',
      titulo: 'Setup Gamer Completo',
      subtitulo: 'Periféricos RGB a partir de R$199',
      link: '/produtos?tag=gamer',
    },
  ];
  categorias: Categoria[] = [
    { id: 'todos', nome: 'Todos', icon: 'bi bi-sliders' },
    { id: 'smartphone', nome: 'Smartphones', icon: 'bi bi-phone' },
    { id: 'notebook', nome: 'Notebooks', icon: 'bi bi-laptop' },
    { id: 'acessorio', nome: 'Acessórios', icon: 'bi bi-headphones' },
  ];
  categoriaSelecionada: string = 'todos';
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  produtosChunked: Produto[][] = [];
  currentSlideIndex = 0;
  categoriesState = 'in';
  productsState = 'in';
  defaultImage = 'assets/img/placeholder.png';

  constructor() {
    if (this.isBrowser) {
      this.loadProducts();
      this.startCarousel();
    }
  }

  async loadProducts(): Promise<void> {
    try {
      // this.produtos = await this.productService.getProducts() || this.getMockProducts();
      this.filtrar(this.categoriaSelecionada);
      this.chunkProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      this.produtos = this.getMockProducts();
      this.filtrar(this.categoriaSelecionada);
      this.chunkProducts();
    }
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

  private chunkProducts(): void {
    const w = this.isBrowser ? window.innerWidth : 1200;
    const size = w >= 992 ? 4 : w >= 768 ? 3 : 2;
    this.produtosChunked = [];
    for (let i = 0; i < this.produtos.length; i += size) {
      this.produtosChunked.push(this.produtos.slice(i, i + size));
    }
  }

  filtrar(catId: string): void {
    this.categoriaSelecionada = catId;
    this.produtosFiltrados = catId === 'todos'
      ? [...this.produtos]
      : this.produtos.filter(p => p.categoria === catId);
    if (this.isBrowser) {
      this.chunkProducts();
    }
  }

  adicionarCarrinho(produto: Produto): void {
    try {    } catch (error) {
      console.error('Error adding to cart:', error);
      // Optionally show error notification
    }
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultImage;
  }

  private startCarousel(): void {
    if (this.isBrowser) {
      setInterval(() => {
        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
      }, 5000);
    }
  }

  trackByCategory(_: number, category: Categoria): string {
    return category.id;
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
}
