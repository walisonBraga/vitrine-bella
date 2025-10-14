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
    private router: Router
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
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
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
        maxWidth: '100vw',
        maxHeight: '100vh',
        disableClose: true,
        data: { mode: 'edit', id, product }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
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
        await this.productService.deleteProduct(id);
        this.snackBar.open('Produto excluído com sucesso!', 'Fechar', { duration: 3000 });
        this.loadProducts();
      } catch (error: any) {
        console.error('Erro ao excluir produto:', error);
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
}
