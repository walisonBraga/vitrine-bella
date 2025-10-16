import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../service/category.service';
import { Category, CategoryCreateRequest } from '../../../interface/category';


export interface CategoryModalData {
  mode: 'create' | 'edit';
  category?: Category;
}

@Component({
  selector: 'app-category-modal',
  templateUrl: './category-modal.component.html',
  styleUrls: ['./category-modal.component.scss']
})
export class CategoryModalComponent implements OnInit {
  categoryForm: FormGroup;
  isLoading = false;
  mode: 'create' | 'edit';
  category?: Category;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CategoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryModalData
  ) {
    this.mode = data.mode;
    this.category = data.category;
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.category) {
      this.loadCategoryData();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      icon: ['category', [Validators.required]],
      isActive: [true]
    });
  }

  private loadCategoryData(): void {
    if (this.category) {
      this.categoryForm.patchValue({
        name: this.category.name,
        description: this.category.description || '',
        icon: this.category.icon || 'category',
        isActive: this.category.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.isLoading = true;
      const formValue = this.categoryForm.value;

      if (this.mode === 'create') {
        this.createCategory(formValue);
      } else {
        this.updateCategory(formValue);
      }
    } else {
      this.markFormGroupTouched();
      this.showSnackBar('Por favor, preencha todos os campos obrigatórios', 'error');
    }
  }

  private createCategory(categoryData: any): void {
    const categoryRequest: CategoryCreateRequest = {
      name: categoryData.name.trim(),
      description: categoryData.description?.trim() || undefined,
      icon: categoryData.icon,
      isActive: categoryData.isActive
    };

    this.categoryService.createCategory(categoryRequest)
      .then(() => {
        this.isLoading = false;
        this.dialogRef.close(true);
        this.showSnackBar('Categoria criada com sucesso!', 'success');
      })
      .catch(error => {
        console.error('Erro ao criar categoria:', error);
        this.isLoading = false;
        this.showSnackBar('Erro ao criar categoria', 'error');
      });
  }

  private updateCategory(categoryData: any): void {
    if (!this.category?.id) return;

    const updateData = {
      name: categoryData.name.trim(),
      description: categoryData.description?.trim() || undefined,
      icon: categoryData.icon,
      isActive: categoryData.isActive
    };

    this.categoryService.updateCategory(this.category.id, updateData)
      .then(() => {
        this.isLoading = false;
        this.dialogRef.close(true);
        this.showSnackBar('Categoria atualizada com sucesso!', 'success');
      })
      .catch(error => {
        console.error('Erro ao atualizar categoria:', error);
        this.isLoading = false;
        this.showSnackBar('Erro ao atualizar categoria', 'error');
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onIconSelected(icon: string): void {
    this.categoryForm.patchValue({ icon });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  // Getters para validação
  get nameError(): string {
    const control = this.categoryForm.get('name');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Nome é obrigatório';
      if (control.errors['minlength']) return 'Nome deve ter pelo menos 2 caracteres';
      if (control.errors['maxlength']) return 'Nome deve ter no máximo 50 caracteres';
    }
    return '';
  }

  get descriptionError(): string {
    const control = this.categoryForm.get('description');
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) return 'Descrição deve ter no máximo 200 caracteres';
    }
    return '';
  }

  get isFormValid(): boolean {
    return this.categoryForm.valid;
  }

  get submitButtonText(): string {
    return this.mode === 'create' ? 'Criar Categoria' : 'Atualizar Categoria';
  }

  get modalTitle(): string {
    return this.mode === 'create' ? 'Criar Nova Categoria' : 'Editar Categoria';
  }
}
