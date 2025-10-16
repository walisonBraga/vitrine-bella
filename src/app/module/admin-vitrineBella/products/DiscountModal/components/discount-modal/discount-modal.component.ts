import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../service/product.service';
import { Product } from '../../../interface/products';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-discount-modal',
  templateUrl: './discount-modal.component.html',
  styleUrl: './discount-modal.component.scss'
})
export class DiscountModalComponent implements OnInit {
  discountForm!: FormGroup;
  loading = false;
  title: string;
  product: Product;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DiscountModalComponent>,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { product: Product; mode: 'add' | 'edit' | 'remove' }
  ) {
    this.product = data.product;
    this.title = this.getTitle();
  }

  ngOnInit(): void {
    this.createDiscountForm();
  }

  private getTitle(): string {
    switch (this.data.mode) {
      case 'add':
        return 'Aplicar Desconto';
      case 'edit':
        return 'Editar Desconto';
      case 'remove':
        return 'Remover Desconto';
      default:
        return 'Gerenciar Desconto';
    }
  }

  private createDiscountForm(): void {
    this.discountForm = this.fb.group({
      discountType: ['percentage', Validators.required],
      discountValue: ['', [Validators.required, Validators.min(0.01)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      description: ['']
    });

    // Se está editando, preencher com dados existentes
    if (this.data.mode === 'edit' && this.product.hasDiscount) {
      this.discountForm.patchValue({
        discountType: this.product.discountType || 'percentage',
        discountValue: this.product.discountValue || 0,
        startDate: this.product.discountStartDate || '',
        endDate: this.product.discountEndDate || '',
        description: this.product.discountDescription || ''
      });
    }

    // Se está adicionando, definir data de início como hoje
    if (this.data.mode === 'add') {
      const today = new Date().toISOString().split('T')[0];
      this.discountForm.patchValue({
        startDate: today
      });
    }

    // Validar datas
    this.discountForm.get('endDate')?.addValidators(this.endDateValidator.bind(this));
  }

  private endDateValidator(control: any) {
    const startDate = this.discountForm?.get('startDate')?.value;
    const endDate = control.value;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return { endDateInvalid: true };
    }
    return null;
  }

  getMaxDiscountValue(): number {
    const discountType = this.discountForm.get('discountType')?.value;
    return discountType === 'percentage' ? 100 : this.product.price;
  }

  calculateDiscountedPrice(): number {
    const discountType = this.discountForm.get('discountType')?.value;
    const discountValue = this.discountForm.get('discountValue')?.value;

    if (!discountValue) return this.product.price;

    if (discountType === 'percentage') {
      return this.product.price * (1 - discountValue / 100);
    } else {
      return Math.max(0, this.product.price - discountValue);
    }
  }

  getDiscountPercentage(): number {
    const originalPrice = this.product.price;
    const discountedPrice = this.calculateDiscountedPrice();

    if (originalPrice <= 0) return 0;

    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;

    // Garantir que o desconto não seja negativo ou maior que 100%
    return Math.max(0, Math.min(100, Math.round(discount * 10) / 10));
  }

  onDiscountTypeChange(): void {
    const discountValue = this.discountForm.get('discountValue');
    if (discountValue) {
      discountValue.setValue('');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.discountForm.invalid) {
      this.discountForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.discountForm.value;

    try {
      const discountedPrice = this.calculateDiscountedPrice();
      const discountPercentage = this.getDiscountPercentage();

      const updatedProduct: Product = {
        ...this.product,
        hasDiscount: true,
        discountType: formValue.discountType,
        discountValue: formValue.discountValue,
        originalPrice: this.product.price,
        discountStartDate: formValue.startDate,
        discountEndDate: formValue.endDate,
        discountDescription: formValue.description,
        price: discountedPrice,
        updatedAt: new Date().toISOString()
      };

      await this.productService.updateProduct(this.product.id, updatedProduct);

      const message = this.data.mode === 'add'
        ? `Desconto aplicado com sucesso! (${discountPercentage.toFixed(1)}% de desconto)`
        : 'Desconto atualizado com sucesso!';

      this.snackBar.open(message, 'Fechar', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open('Erro ao aplicar desconto: ' + error.message, 'Fechar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async removeDiscount(): Promise<void> {
    this.loading = true;

    try {
      const updatedProduct: Product = {
        ...this.product,
        hasDiscount: false,
        discountType: undefined,
        discountValue: undefined,
        originalPrice: undefined,
        discountStartDate: undefined,
        discountEndDate: undefined,
        discountDescription: undefined,
        price: this.product.originalPrice || this.product.price,
        updatedAt: new Date().toISOString()
      };

      await this.productService.updateProduct(this.product.id, updatedProduct);
      this.snackBar.open('Desconto removido com sucesso!', 'Fechar', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open('Erro ao remover desconto: ' + error.message, 'Fechar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
