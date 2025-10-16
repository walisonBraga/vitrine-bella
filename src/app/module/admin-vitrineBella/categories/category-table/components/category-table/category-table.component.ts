import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../../service/category.service';
import { Category } from '../../../interface/category';
import { CategoryModalComponent } from '../../../CategoryModal/components/category-modal/category-modal.component';


@Component({
  selector: 'app-category-table',
  templateUrl: './category-table.component.html',
  styleUrls: ['./category-table.component.scss']
})
export class CategoryTableComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['name', 'description', 'productCount', 'status', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Category>();
  categories: Category[] = [];
  isLoading = true;
  errorMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.dataSource.data = categories;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar categorias:', error);
          this.errorMessage = 'Erro ao carregar categorias';
          this.isLoading = false;
          this.showSnackBar('Erro ao carregar categorias', 'error');
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createCategory(): void {
    const dialogRef = this.dialog.open(CategoryModalComponent, {
      width: '600px',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadCategories();
          this.showSnackBar('Categoria criada com sucesso!', 'success');
        }
      });
  }

  editCategory(category: Category): void {
    const dialogRef = this.dialog.open(CategoryModalComponent, {
      width: '600px',
      disableClose: true,
      data: { mode: 'edit', category }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadCategories();
          this.showSnackBar('Categoria atualizada com sucesso!', 'success');
        }
      });
  }

  toggleCategoryStatus(category: Category): void {
    const newStatus = !category.isActive;
    const action = newStatus ? 'ativar' : 'desativar';

    this.categoryService.updateCategoryStatus(category.id!, newStatus)
      .then(() => {
        this.loadCategories();
        this.showSnackBar(`Categoria ${action}da com sucesso!`, 'success');
      })
      .catch(error => {
        console.error('Erro ao alterar status da categoria:', error);
        this.showSnackBar(`Erro ao ${action} categoria`, 'error');
      });
  }

  deleteCategory(category: Category): void {
    if (category.productCount && category.productCount > 0) {
      this.showSnackBar('Não é possível excluir uma categoria que possui produtos associados', 'error');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id!)
        .then(() => {
          this.loadCategories();
          this.showSnackBar('Categoria excluída com sucesso!', 'success');
        })
        .catch(error => {
          console.error('Erro ao excluir categoria:', error);
          this.showSnackBar('Erro ao excluir categoria', 'error');
        });
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-success' : 'badge-danger';
  }

  getStatusDisplayName(isActive: boolean): string {
    return isActive ? 'Ativo' : 'Inativo';
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}
