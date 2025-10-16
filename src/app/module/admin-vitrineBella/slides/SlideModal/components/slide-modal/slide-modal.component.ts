import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SlideService } from '../../../service/slide.service';
import { Slide } from '../../../interface/slide';


@Component({
  selector: 'app-slide-modal',
  templateUrl: './slide-modal.component.html',
  styleUrls: ['./slide-modal.component.scss']
})
export class SlideModalComponent implements OnInit {
  slideForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  previewImage: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SlideModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { slide?: Slide, isEdit: boolean },
    private slideService: SlideService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = data.isEdit;

    this.slideForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      subtitulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      img: [''], // Removido validação de URL, agora será gerenciado via upload
      alt: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      ativo: [true],
      ordem: [1, [Validators.required, Validators.min(1)]]
    });

    if (this.isEditMode && this.data.slide) {
      this.loadSlideData();
    }
  }

  ngOnInit(): void {
    if (!this.isEditMode) {
      // Para novos slides, definir ordem automática
      this.slideService.getSlides().subscribe(slides => {
        const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.ordem || 0)) : 0;
        this.slideForm.patchValue({ ordem: maxOrder + 1 });
      });
    }
  }

  private loadSlideData(): void {
    if (this.data.slide) {
      this.slideForm.patchValue(this.data.slide);
      this.previewImage = this.data.slide.img;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validação do arquivo
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Por favor, selecione apenas arquivos de imagem', 'Fechar', { duration: 3000 });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.snackBar.open('Arquivo muito grande. Máximo 5MB', 'Fechar', { duration: 3000 });
        return;
      }

      this.selectedFile = file;

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewImage = null;

    // Se está editando e não tem arquivo selecionado, mantém a imagem atual
    if (this.isEditMode && this.data.slide?.img) {
      this.previewImage = this.data.slide.img;
    }
  }

  onSubmit(): void {
    // Validação adicional: precisa de imagem (arquivo ou existente)
    if (!this.selectedFile && !this.previewImage) {
      this.snackBar.open('Por favor, selecione uma imagem para o slide', 'Fechar', { duration: 3000 });
      return;
    }

    if (this.slideForm.valid) {
      this.isLoading = true;
      const slideData = { ...this.slideForm.value };
      delete slideData.img; // Remove o campo img do form, será gerenciado pelo upload

      if (this.isEditMode && this.data.slide?.id) {
        this.slideService.updateSlideWithImage(this.data.slide.id, slideData, this.selectedFile || undefined)
          .then(() => {
            this.snackBar.open('Slide atualizado com sucesso!', 'Fechar', { duration: 3000 });
            this.dialogRef.close(true);
          })
          .catch(error => {
            this.snackBar.open('Erro ao atualizar slide: ' + error.message, 'Fechar', { duration: 5000 });
          })
          .finally(() => {
            this.isLoading = false;
          });
      } else {
        this.slideService.createSlideWithImage(slideData, this.selectedFile || undefined)
          .then(() => {
            this.snackBar.open('Slide criado com sucesso!', 'Fechar', { duration: 3000 });
            this.dialogRef.close(true);
          })
          .catch(error => {
            this.snackBar.open('Erro ao criar slide: ' + error.message, 'Fechar', { duration: 5000 });
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.slideForm.controls).forEach(key => {
      const control = this.slideForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(controlName: string): string {
    const control = this.slideForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo de ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('maxlength')) {
      return `Máximo de ${control.errors?.['maxlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('pattern')) {
      if (controlName === 'img') {
        return 'URL da imagem inválida';
      }
      return 'Formato inválido';
    }
    if (control?.hasError('min')) {
      return `Valor mínimo: ${control.errors?.['min'].min}`;
    }
    return '';
  }
}
