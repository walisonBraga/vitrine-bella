import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Goal } from '../interface/goal.interface';

@Component({
  selector: 'app-update-sales-modal',
  templateUrl: './update-sales-modal.component.html',
  styleUrls: ['./update-sales-modal.component.scss']
})
export class UpdateSalesModalComponent {
  salesForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateSalesModalComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { goal: Goal }
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.salesForm = this.fb.group({
      salesAmount: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  onSubmit(): void {
    if (this.salesForm.valid) {
      this.loading = true;
      
      const salesAmount = this.salesForm.get('salesAmount')?.value;
      
      // Simular delay de processamento
      setTimeout(() => {
        this.loading = false;
        this.dialogRef.close({ salesAmount });
      }, 1000);
    } else {
      this.snackBar.open('Por favor, insira um valor válido', 'Fechar', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  getNewTotal(): number {
    const currentAmount = this.data.goal.currentAmount;
    const salesAmount = this.salesForm.get('salesAmount')?.value || 0;
    return currentAmount + salesAmount;
  }

  getNewCommission(): number {
    const newTotal = this.getNewTotal();
    const commissionPercentage = this.data.goal.commissionPercentage;
    return newTotal * (commissionPercentage / 100);
  }
}
