import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product } from '../../../interface/products';
import { ProductService } from '../../../service/product.service';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { ProductRegistrationModalComponent } from '../../../ProductRegistrationModal/components/product-registration-modal/product-registration-modal.component';
import { DiscountModalComponent } from '../../../DiscountModal/components/discount-modal/discount-modal.component';
import { StockNotificationService } from '../../../../../../core/services/stock-notification.service';

import { LogService } from '../../../../logs/service/log.service';
import { UserContextService } from '../../../../logs/service/user-context.service';
// Log System Imports


@Component({
  selector: 'app-product-table',
  templateUrl: './product-table.component.html',
  styleUrls: ['./product-table.component.scss']
})
export class ProductTableComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['imageUrl', 'productName', 'description', 'price', 'stock', 'category', 'actions'];
  dataSource = new MatTableDataSource<Product>();
  loading = true;
  authenticatedUser: any | null = null;
  private productsSubscription: Subscription | undefined;
  private searchSubscription: Subscription | undefined;
  searchTerm: string = '';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private stockNotificationService: StockNotificationService,
    private logService: LogService,
    private userContextService: UserContextService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadProducts(): void {
    this.loading = true;
    if (this.searchTerm) {
      this.searchProducts(this.searchTerm);
    } else {
      this.productsSubscription?.unsubscribe();
      this.productsSubscription = this.productService.getProducts().subscribe({
        next: (products: Product[]) => {
          this.dataSource.data = products;
          this.stockNotificationService.analyzeStockLevels(products);
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar produtos:', error);
          this.snackBar.open('Erro ao carregar produtos.', 'Fechar', { duration: 5000 });
          this.loading = false;
        }
      });
    }
  }

  applyFilter(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.trim();
    this.loadProducts();
  }

  searchProducts(term: string): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubscription = this.productService.searchProducts(term).subscribe({
      next: (products: Product[]) => {
        this.dataSource.data = products;
        this.stockNotificationService.analyzeStockLevels(products);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar produtos:', error);
        this.snackBar.open('Erro ao buscar produtos.', 'Fechar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  openProductModal(): void {
    const dialogRef = this.dialog.open(ProductRegistrationModalComponent, {
      width: 'auto',
      maxWidth: 'auto',
      maxHeight: 'auto',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Registrar criação de produto
        const userInfo = this.userContextService.getCurrentUserInfo();
        this.logService.addLog({
          userId: userInfo.userId,
          userName: userInfo.userName,
          action: 'create',
          entity: 'product',
          entityName: result.productName || 'Novo Produto',
          details: `Produto criado: ${result.productName || 'Nome não informado'}`,
          status: 'success',
          ...this.userContextService.getClientInfo()
        });
        
        this.loadProducts();
      }
    });
  }

  async editProduct(id: string): Promise<void> {
    this.loading = true;
    try {
      const product = await this.productService.getProductById(id);
      const dialogRef = this.dialog.open(ProductRegistrationModalComponent, {
        width: 'auto',
        maxWidth: '250vw',
        maxHeight: '250vh',
        disableClose: true,
        data: { mode: 'edit', id, product }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Registrar edição de produto
          const userInfo = this.userContextService.getCurrentUserInfo();
          this.logService.addLog({
            userId: userInfo.userId,
            userName: userInfo.userName,
            action: 'update',
            entity: 'product',
            entityId: id,
            entityName: product.productName || 'Produto Editado',
            details: `Produto editado: ${product.productName || 'Nome não informado'}`,
            status: 'success',
            ...this.userContextService.getClientInfo()
          });
          
          this.loadProducts();
        }
      });
    } catch (error: any) {
      console.error('Erro ao carregar produto para edição:', error);
      this.snackBar.open('Erro ao carregar produto para edição.', 'Fechar', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      this.loading = true;
      try {
        // Buscar informações do produto antes de deletar para o log
        const product = await this.productService.getProductById(id);
        
        await this.productService.deleteProduct(id);
        
        // Registrar exclusão de produto
        const userInfo = this.userContextService.getCurrentUserInfo();
        this.logService.addLog({
          userId: userInfo.userId,
          userName: userInfo.userName,
          action: 'delete',
          entity: 'product',
          entityId: id,
          entityName: product.productName || 'Produto Excluído',
          details: `Produto excluído: ${product.productName || 'Nome não informado'}`,
          status: 'success',
          ...this.userContextService.getClientInfo()
        });
        
        this.snackBar.open('Produto excluído com sucesso!', 'Fechar', { duration: 3000 });
        this.loadProducts();
      } catch (error: any) {
        console.error('Erro ao excluir produto:', error);
        
        // Registrar erro na exclusão
        const userInfo = this.userContextService.getCurrentUserInfo();
        this.logService.addLog({
          userId: userInfo.userId,
          userName: userInfo.userName,
          action: 'delete',
          entity: 'product',
          entityId: id,
          entityName: 'Produto',
          details: `Erro ao excluir produto: ${error.message || error}`,
          status: 'error',
          ...this.userContextService.getClientInfo()
        });
        
        this.snackBar.open('Erro ao excluir produto.', 'Fechar', { duration: 5000 });
      } finally {
        this.loading = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.productsSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  // Métodos para análise de estoque
  isLowStock(product: Product): boolean {
    return this.stockNotificationService.isProductLowStock(product);
  }

  isCriticalStock(product: Product): boolean {
    return this.stockNotificationService.isProductCriticalStock(product);
  }

  isOutOfStock(product: Product): boolean {
    return this.stockNotificationService.isProductOutOfStock(product);
  }

  getStockAlertLevel(product: Product): 'low' | 'critical' | 'out' | 'normal' {
    return this.stockNotificationService.getProductAlertLevel(product);
  }

  getStockAlertClass(product: Product): string {
    const level = this.getStockAlertLevel(product);
    return this.stockNotificationService.getAlertClass(level);
  }

  getStockAlertIcon(product: Product): string {
    const level = this.getStockAlertLevel(product);
    return this.stockNotificationService.getAlertIcon(level);
  }

  getStockAlertColor(product: Product): string {
    const level = this.getStockAlertLevel(product);
    return this.stockNotificationService.getAlertColor(level);
  }

  getStockAlertTooltip(product: Product): string {
    const level = this.getStockAlertLevel(product);
    const productName = product.productName;

    switch (level) {
      case 'out':
        return `${productName} - SEM ESTOQUE!`;
      case 'critical':
        return `${productName} - Estoque crítico (${product.stock} unidades)`;
      case 'low':
        return `${productName} - Estoque baixo (${product.stock} unidades)`;
      default:
        return `${productName} - Estoque normal (${product.stock} unidades)`;
    }
  }

  getStockAlertLabel(product: Product): string {
    const level = this.getStockAlertLevel(product);

    switch (level) {
      case 'out':
        return 'SEM ESTOQUE';
      case 'critical':
        return 'CRÍTICO';
      case 'low':
        return 'BAIXO';
      default:
        return '';
    }
  }

  // ===== MÉTODOS PARA DESCONTO =====

  getDiscountPercentage(product: Product): number {
    if (!product.hasDiscount || !product.originalPrice || product.originalPrice <= 0) {
      return 0;
    }

    const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;

    // Garantir que o desconto não seja negativo ou maior que 100%
    return Math.max(0, Math.min(100, Math.round(discount * 10) / 10));
  }

  manageDiscount(product: Product): void {
    const mode = product.hasDiscount ? 'edit' : 'add';

    const dialogRef = this.dialog.open(DiscountModalComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { product, mode },
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadProducts();
        this.snackBar.open(
          product.hasDiscount ? 'Desconto atualizado com sucesso!' : 'Desconto aplicado com sucesso!',
          'Fechar',
          { duration: 3000 }
        );
      }
    });
  }

  removeDiscount(product: Product): void {
    const dialogRef = this.dialog.open(DiscountModalComponent, {
      width: '500px',
      maxHeight: '90vh',
      data: { product, mode: 'remove' },
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadProducts();
        this.snackBar.open('Desconto removido com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

}
