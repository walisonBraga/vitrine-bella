import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Coupon, CouponCreateRequest } from '../../../../coupons/interface/coupon';
import { CouponService } from '../../../../coupons/service/coupon.service';

@Component({
  selector: 'app-coupon-modal',
  templateUrl: './coupon-modal.component.html',
  styleUrl: './coupon-modal.component.scss'
})
export class CouponModalComponent implements OnInit {
  couponForm!: FormGroup;
  loading = false;
  title: string;
  generatedCode: string = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CouponModalComponent>,
    private snackBar: MatSnackBar,
    private couponService: CouponService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; coupon?: Coupon }
  ) {
    this.title = data.mode === 'create' ? 'Gerar Novo Cupom' : 'Editar Cupom';
  }

  ngOnInit(): void {
    this.createCouponForm();
    if (this.data.mode === 'create') {
      this.generateCouponCode();
    }
  }

  private createCouponForm(): void {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      discountPercentage: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      validFrom: [today, Validators.required],
      validUntil: [nextMonthStr, Validators.required],
      usageLimit: [''],
      minOrderValue: [''],
      maxDiscountValue: ['']
    });

    // Se está editando, preencher com dados existentes
    if (this.data.mode === 'edit' && this.data.coupon) {
      this.couponForm.patchValue(this.data.coupon);
    }

    // Validar datas
    this.couponForm.get('validUntil')?.addValidators(this.endDateValidator.bind(this));
  }

  private endDateValidator(control: any) {
    const startDate = this.couponForm?.get('validFrom')?.value;
    const endDate = control.value;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return { endDateInvalid: true };
    }
    return null;
  }

  async generateCouponCode(): Promise<void> {
    try {
      this.generatedCode = await this.couponService.generateUniqueCouponCode();
      this.couponForm.patchValue({ code: this.generatedCode });
    } catch (error) {
      console.error('Erro ao gerar código único:', error);
      // Fallback para código aleatório se não conseguir gerar único
      const prefix = 'CUPOM';
      const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const randomLetters = Math.random().toString(36).substring(2, 4).toUpperCase();

      this.generatedCode = `${prefix}${randomNumber}${randomLetters}`;
      this.couponForm.patchValue({ code: this.generatedCode });
    }
  }

  async generateNewCode(): Promise<void> {
    await this.generateCouponCode();
  }

  formatCouponCode(): void {
    const codeControl = this.couponForm.get('code');
    if (codeControl) {
      let value = codeControl.value.toUpperCase();
      value = value.replace(/[^A-Z0-9]/g, '');
      codeControl.setValue(value);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.couponForm.value;

    try {
      const couponData: CouponCreateRequest = {
        code: formValue.code,
        name: formValue.name,
        description: formValue.description || '',
        discountPercentage: formValue.discountPercentage,
        validFrom: formValue.validFrom,
        validUntil: formValue.validUntil,
        usageLimit: formValue.usageLimit ? parseInt(formValue.usageLimit) : undefined,
        minOrderValue: formValue.minOrderValue ? parseFloat(formValue.minOrderValue) : undefined,
        maxDiscountValue: formValue.maxDiscountValue ? parseFloat(formValue.maxDiscountValue) : undefined
      };

      if (this.data.mode === 'create') {
        await this.couponService.createCoupon(couponData);
        const message = `Cupom "${formValue.code}" gerado com sucesso!`;
        this.snackBar.open(message, 'Fechar', { duration: 3000 });
      } else if (this.data.mode === 'edit' && this.data.coupon?.id) {
        await this.couponService.updateCoupon(this.data.coupon.id, couponData);
        this.snackBar.open('Cupom atualizado com sucesso!', 'Fechar', { duration: 3000 });
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Erro ao salvar cupom:', error);
      this.snackBar.open('Erro ao salvar cupom: ' + error.message, 'Fechar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.snackBar.open('Código copiado para a área de transferência!', 'Fechar', { duration: 2000 });
      });
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.snackBar.open('Código copiado para a área de transferência!', 'Fechar', { duration: 2000 });
    }
  }
}
