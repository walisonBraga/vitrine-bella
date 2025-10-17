import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../module/admin-vitrineBella/products/service/product.service';
import { Product } from '../../module/admin-vitrineBella/products/interface/products';
import { ProductReviewService } from '../../module/admin-vitrineBella/products/service/product-review.service';
import { ProductReview } from '../../module/admin-vitrineBella/products/interface/product-review';
import { NavbarHomeComponent } from "../navbar-home/components/navbar-home/navbar-home.component";
import { Auth, authState } from '@angular/fire/auth';
import { AuthService } from '../auth/auth.service';
import { FavoritosFirebaseService } from '../services/favoritos-firebase.service';
import { StockNotificationService } from '../services/stock-notification.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, FormsModule, NavbarHomeComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private reviewService = inject(ProductReviewService);
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private favoritosService = inject(FavoritosFirebaseService);
  private stockNotificationService = inject(StockNotificationService);

  product: Product | null = null;
  isLoading = true;
  error = false;
  defaultImage = 'assets/img/placeholder.png';

  // Avaliações
  reviews: ProductReview[] = [];
  averageRating = 0;
  reviewCount = 0;
  userReview: ProductReview | null = null;
  isUserLoggedIn = false;
  currentUser: any = null;

  // Formulário de avaliação
  newRating = 0;
  newComment = '';
  isSubmittingReview = false;
  showReviewForm = false;
  isFavorito = false;
  currentImageIndex = 0;
  private slideshowInterval?: number; // Intervalo do slideshow automático
  isSlideshowActive = false; // Controla se o slideshow está ativo

  // Sistema de notificação de estoque
  notificationEmail = '';
  isSubscribing = false;
  notificationSuccess = false;

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
      this.loadReviews(productId);
      this.setupAuthListener();
    } else {
      this.error = true;
      this.isLoading = false;
    }
  }

  private setupAuthListener(): void {
    authState(this.auth).subscribe(async user => {
      this.isUserLoggedIn = !!user;
      this.currentUser = user;

      if (user && this.product) {
        // Buscar informações completas do usuário do Firestore
        const userInfo: any = await this.authService.getUserInfo(user.uid);
        if (userInfo) {
          this.currentUser = { ...user, ...userInfo };
        }

        this.loadUserReview(this.product.id, user.uid);
        this.checkIfFavorito();
      }
    });
  }

  private async getUserDisplayName(): Promise<string> {
    if (!this.currentUser) return 'Usuário';

    // Se já temos fullName do Firestore, usar ele
    if (this.currentUser.fullName) {
      return this.currentUser.fullName;
    }

    // Se não, buscar do Firestore
    const userInfo: any = await this.authService.getUserInfo(this.currentUser.uid);
    if (userInfo && userInfo.fullName) {
      return userInfo.fullName;
    }

    // Fallback para displayName do Firebase Auth
    return this.currentUser.displayName || 'Usuário';
  }

  private async getUserPhoto(): Promise<string | null> {
    if (!this.currentUser) return null;

    // Se já temos photoURL do Firebase Auth, usar ele
    if (this.currentUser.photoURL) {
      return this.currentUser.photoURL;
    }

    // Se não, buscar do Firestore
    const userInfo: any = await this.authService.getUserInfo(this.currentUser.uid);
    if (userInfo && userInfo.photoURL) {
      return userInfo.photoURL;
    }

    // Para teste, vamos usar um avatar padrão baseado no nome
    // Em produção, isso seria substituído por um sistema de upload
    const userName = await this.getUserDisplayName();
    if (userName && userName !== 'Usuário') {
      // Gerar avatar com inicial do nome usando um serviço de avatar
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=100`;
    }

    return null;
  }

  private loadProduct(id: string): void {
    this.productService.getProductById(id).then(
      (product) => {
        this.product = product;
        this.isLoading = false;
      }
    ).catch(
      (error) => {
        console.error('Erro ao carregar produto:', error);
        this.error = true;
        this.isLoading = false;
      }
    );
  }

  private loadReviews(productId: string): void {
    this.reviewService.getReviewsByProduct(productId).subscribe(reviews => {
      this.reviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    this.reviewService.getAverageRating(productId).subscribe(rating => {
      this.averageRating = rating;
    });

    this.reviewService.getReviewCount(productId).subscribe(count => {
      this.reviewCount = count;
    });
  }

  private loadUserReview(productId: string, userId: string): void {
    this.reviewService.getUserReviewForProduct(productId, userId).then(review => {
      this.userReview = review;
      if (review) {
        this.newRating = review.rating;
        this.newComment = review.comment;
      }
    });
  }

  setRating(rating: number): void {
    this.newRating = rating;
  }

  toggleReviewForm(): void {
    if (!this.isUserLoggedIn) {
      this.snackBar.open('Você precisa estar logado para avaliar produtos', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }
    this.showReviewForm = !this.showReviewForm;
  }

  async submitReview(): Promise<void> {
    if (!this.isUserLoggedIn || !this.currentUser || !this.product) {
      this.snackBar.open('Você precisa estar logado para avaliar produtos', 'Fechar', {
        duration: 3000
      });
      return;
    }

    if (this.newRating === 0) {
      this.snackBar.open('Por favor, selecione uma avaliação', 'Fechar', {
        duration: 3000
      });
      return;
    }

    this.isSubmittingReview = true;

    try {
      if (this.userReview) {
        // Atualizar avaliação existente
        await this.reviewService.updateReview(this.userReview.id!, {
          rating: this.newRating,
          comment: this.newComment
        });
        this.snackBar.open('Avaliação atualizada com sucesso!', 'Fechar', {
          duration: 3000
        });
      } else {
        // Criar nova avaliação
        const userName = await this.getUserDisplayName();
        const userPhoto = await this.getUserPhoto();

        await this.reviewService.createReview({
          productId: this.product.id,
          userId: this.currentUser.uid,
          userName: userName,
          userEmail: this.currentUser.email,
          userPhoto: userPhoto || undefined,
          rating: this.newRating,
          comment: this.newComment
        });
        this.snackBar.open('Avaliação enviada com sucesso!', 'Fechar', {
          duration: 3000
        });
      }

      this.showReviewForm = false;
      this.loadReviews(this.product.id);
      this.loadUserReview(this.product.id, this.currentUser.uid);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      this.snackBar.open('Erro ao salvar avaliação. Tente novamente.', 'Fechar', {
        duration: 3000
      });
    } finally {
      this.isSubmittingReview = false;
    }
  }

  editReview(review: ProductReview): void {
    this.newRating = review.rating;
    this.newComment = review.comment;
    this.showReviewForm = true;
  }

  async deleteReview(reviewId: string): Promise<void> {
    if (!this.isUserLoggedIn || !this.currentUser) {
      this.snackBar.open('Você precisa estar logado para excluir avaliações', 'Fechar', {
        duration: 3000
      });
      return;
    }

    // Confirmação antes de excluir
    const confirmDelete = confirm('Tem certeza que deseja excluir sua avaliação? Esta ação não pode ser desfeita.');
    if (!confirmDelete) {
      return;
    }

    try {
      await this.reviewService.deleteReview(reviewId);
      this.snackBar.open('Avaliação excluída com sucesso!', 'Fechar', {
        duration: 3000
      });

      if (this.product) {
        this.loadReviews(this.product.id);
        this.loadUserReview(this.product.id, this.currentUser.uid);
        this.showReviewForm = false;
        this.newRating = 0;
        this.newComment = '';
      }
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      this.snackBar.open('Erro ao excluir avaliação. Tente novamente.', 'Fechar', {
        duration: 3000
      });
    }
  }

  isUserReview(review: ProductReview): boolean {
    return this.isUserLoggedIn && this.currentUser && review.userId === this.currentUser.uid;
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultImage;
  }

  handleAvatarError(event: Event, review: ProductReview): void {
    // Se a imagem do avatar falhar, remove a URL para mostrar a letra
    review.userPhoto = undefined;
    (event.target as HTMLImageElement).style.display = 'none';
  }

  adicionarCarrinho(): void {
    if (!this.product) return;

    // Implementar lógica do carrinho
    console.log('Adicionar ao carrinho:', this.product);

    this.snackBar.open(`${this.product.productName} adicionado ao carrinho!`, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  voltar(): void {
    this.router.navigate(['/home']);
  }

  // Métodos da galeria de imagens
  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage(): void {
    if (this.product?.images && this.currentImageIndex < this.product.images.length - 1) {
      this.currentImageIndex++;
    }
  }

  getSpecificationsArray(): { key: string; value: string }[] {
    if (!this.product?.technicalInfo?.specifications) return [];
    return Object.entries(this.product.technicalInfo.specifications).map(([key, value]) => ({ key, value }));
  }

  getProductImages(): string[] {
    if (!this.product) return [];
    const images = [];
    if (this.product.imageUrl) {
      images.push(this.product.imageUrl);
    }
    if (this.product.images) {
      images.push(...this.product.images);
    }
    return images;
  }

  getCurrentImage(): string {
    const images = this.getProductImages();
    if (images.length === 0) return this.defaultImage;
    return images[this.currentImageIndex] || this.defaultImage;
  }

  // Métodos para controlar o slideshow automático
  startSlideshow(): void {
    if (this.getProductImages().length <= 1) return;

    this.isSlideshowActive = true;
    this.slideshowInterval = window.setInterval(() => {
      this.nextImage();
    }, 3000); // Troca a cada 3 segundos
  }

  stopSlideshow(): void {
    this.isSlideshowActive = false;
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = undefined;
    }
  }

  toggleSlideshow(): void {
    if (this.isSlideshowActive) {
      this.stopSlideshow();
    } else {
      this.startSlideshow();
    }
  }

  private checkIfFavorito(): void {
    if (!this.product) return;
    const favoriteIds = this.favoritosService.getFavoritosIds();
    this.isFavorito = favoriteIds.includes(this.product.id);
  }

  async toggleFavorito(): Promise<void> {
    if (!this.isUserLoggedIn) {
      this.snackBar.open('Faça login para gerenciar favoritos', 'Fechar', {
        duration: 3000
      });
      return;
    }

    if (!this.product) return;

    try {
      if (this.isFavorito) {
        await this.favoritosService.removerFavorito(this.product.id);
        this.isFavorito = false;
        this.snackBar.open('Removido dos favoritos', 'Fechar', {
          duration: 2000
        });
      } else {
        await this.favoritosService.adicionarFavorito(this.product.id, '');
        this.isFavorito = true;
        this.snackBar.open('Adicionado aos favoritos', 'Fechar', {
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      this.snackBar.open('Erro ao alterar favorito', 'Fechar', {
        duration: 3000
      });
    }
  }

  ngOnDestroy(): void {
    // Limpar slideshow se estiver ativo
    this.stopSlideshow();
  }

  // Métodos para controle de estoque
  isOutOfStock(): boolean {
    return !this.product || this.product.stock <= 0;
  }

  isLowStock(): boolean {
    return this.product ? this.product.stock > 0 && this.product.stock <= 5 : false;
  }

  isInStock(): boolean {
    return this.product ? this.product.stock > 5 : false;
  }

  getStockStatusText(): string {
    if (!this.product) return '';

    if (this.isOutOfStock()) {
      return 'Sem estoque';
    } else if (this.isLowStock()) {
      return `Estoque baixo (${this.product.stock} unidades)`;
    } else {
      return `Em estoque (${this.product.stock} unidades)`;
    }
  }

  getStockIcon(): string {
    if (this.isOutOfStock()) {
      return 'cancel';
    } else if (this.isLowStock()) {
      return 'warning';
    } else {
      return 'check_circle';
    }
  }

  getStockStatusClass(): string {
    if (this.isOutOfStock()) {
      return 'out-of-stock';
    } else if (this.isLowStock()) {
      return 'low-stock';
    } else {
      return 'in-stock';
    }
  }

  getStockIconClass(): string {
    if (this.isOutOfStock()) {
      return 'out-of-stock-icon';
    } else if (this.isLowStock()) {
      return 'low-stock-icon';
    } else {
      return 'in-stock-icon';
    }
  }

  async subscribeToStockNotification(): Promise<void> {
    if (!this.product || !this.notificationEmail) return;

    this.isSubscribing = true;

    try {
      await this.stockNotificationService.subscribeToStockNotification(
        this.product.id,
        this.product.productName,
        this.notificationEmail
      );

      this.notificationSuccess = true;
      this.notificationEmail = '';

      this.snackBar.open('Email cadastrado com sucesso! Você será notificado quando o produto voltar ao estoque.', 'Fechar', {
        duration: 5000
      });

    } catch (error: any) {
      console.error('Erro ao cadastrar email:', error);

      const errorMessage = error.message || 'Erro ao cadastrar email. Tente novamente.';
      this.snackBar.open(errorMessage, 'Fechar', {
        duration: 5000
      });
    } finally {
      this.isSubscribing = false;
    }
  }
}
