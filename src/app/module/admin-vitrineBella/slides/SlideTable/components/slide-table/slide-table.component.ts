import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {  MatPaginator } from '@angular/material/paginator';
import {  MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog  } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Slide } from '../../../interface/slide';
import { SlideService } from '../../../service/slide.service';
import { SlideModalComponent } from '../../../SlideModal/components/slide-modal/slide-modal.component';


@Component({
  selector: 'app-slide-table',
  templateUrl: './slide-table.component.html',
  styleUrls: ['./slide-table.component.scss']
})
export class SlideTableComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['imagem', 'titulo', 'subtitulo', 'ordem', 'status', 'acoes'];
  dataSource = new MatTableDataSource<Slide>();
  slides$: Observable<Slide[]>;
  isLoading = false;
  searchTerm = '';

  constructor(
    private slideService: SlideService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.slides$ = this.slideService.getSlides();
  }

  ngOnInit(): void {
    this.loadSlides();
  }

  public loadSlides(): void {
    this.isLoading = true;
    this.slides$.subscribe({
      next: (slides) => {
        this.dataSource.data = slides.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Erro ao carregar slides', 'Fechar', { duration: 3000 });
        this.isLoading = false;
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

  openCreateModal(): void {
    const dialogRef = this.dialog.open(SlideModalComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { isEdit: false },
      panelClass: 'slide-modal-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSlides();
      }
    });
  }

  openEditModal(slide: Slide): void {
    const dialogRef = this.dialog.open(SlideModalComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { slide, isEdit: true },
      panelClass: 'slide-modal-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSlides();
      }
    });
  }

  toggleSlideStatus(slide: Slide): void {
    const newStatus = !slide.ativo;
    this.slideService.toggleSlideStatus(slide.id!, newStatus)
      .then(() => {
        this.snackBar.open(
          `Slide ${newStatus ? 'ativado' : 'desativado'} com sucesso!`,
          'Fechar',
          { duration: 3000 }
        );
      })
      .catch(error => {
        this.snackBar.open('Erro ao alterar status do slide', 'Fechar', { duration: 3000 });
      });
  }

  deleteSlide(slide: Slide): void {
    if (confirm(`Tem certeza que deseja excluir o slide "${slide.titulo}"?`)) {
      this.slideService.deleteSlideWithImage(slide.id!)
        .then(() => {
          this.snackBar.open('Slide excluído com sucesso!', 'Fechar', { duration: 3000 });
          this.loadSlides();
        })
        .catch(error => {
          this.snackBar.open('Erro ao excluir slide', 'Fechar', { duration: 3000 });
        });
    }
  }

  moveSlideUp(slide: Slide): void {
    const slides = [...this.dataSource.data];
    const currentIndex = slides.findIndex(s => s.id === slide.id);

    if (currentIndex > 0) {
      const temp = slides[currentIndex];
      slides[currentIndex] = slides[currentIndex - 1];
      slides[currentIndex - 1] = temp;

      this.updateSlideOrders(slides);
    }
  }

  moveSlideDown(slide: Slide): void {
    const slides = [...this.dataSource.data];
    const currentIndex = slides.findIndex(s => s.id === slide.id);

    if (currentIndex < slides.length - 1) {
      const temp = slides[currentIndex];
      slides[currentIndex] = slides[currentIndex + 1];
      slides[currentIndex + 1] = temp;

      this.updateSlideOrders(slides);
    }
  }

  private updateSlideOrders(slides: Slide[]): void {
    const orders = slides.map((slide, index) => ({
      id: slide.id!,
      ordem: index + 1
    }));

    this.slideService.reorderSlides(orders)
      .then(() => {
        this.snackBar.open('Ordem dos slides atualizada!', 'Fechar', { duration: 3000 });
        this.loadSlides();
      })
      .catch(error => {
        this.snackBar.open('Erro ao reordenar slides', 'Fechar', { duration: 3000 });
      });
  }

  getStatusClass(ativo: boolean): string {
    return ativo ? 'status-ativo' : 'status-inativo';
  }


  formatDate(date: Date | any): string {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/placeholder.png';
  }
}
