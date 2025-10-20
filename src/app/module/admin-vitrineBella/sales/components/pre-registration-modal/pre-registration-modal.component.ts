import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PreRegistrationService, PreRegistration } from '../../../shared/services/pre-registration.service';

@Component({
  selector: 'app-pre-registration-modal',
  templateUrl: './pre-registration-modal.component.html',
  styleUrls: ['./pre-registration-modal.component.scss']
})
export class PreRegistrationModalComponent implements OnInit {
  preRegistrationForm: FormGroup;
  isProcessing = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PreRegistrationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cartItems: any[], total: number },
    private preRegistrationService: PreRegistrationService,
    private snackBar: MatSnackBar
  ) {
    this.preRegistrationForm = this.createForm();
  }

  ngOnInit(): void {}

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)]],
      birthDate: [''],
      gender: [''],
      address: [''],
      city: [''],
      state: [''],
      zipCode: ['']
    });
  }

  onCpfChange(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      this.preRegistrationForm.get('cpf')?.setValue(value, { emitEvent: false });
    }
  }

  onPhoneChange(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      this.preRegistrationForm.get('phone')?.setValue(value, { emitEvent: false });
    }
  }

  onZipCodeChange(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
      this.preRegistrationForm.get('zipCode')?.setValue(value, { emitEvent: false });
    }
  }

  onSubmit(): void {
    if (this.preRegistrationForm.valid && !this.isProcessing) {
      this.isProcessing = true;

      const formData = this.preRegistrationForm.value;
      const preRegistrationData: Omit<PreRegistration, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'sales'> = {
        cpf: formData.cpf,
        email: formData.email,
        phone: formData.phone,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        birthDate: formData.birthDate,
        gender: formData.gender
      };

      // Verificar se já existe um pré-cadastro com este CPF
      this.preRegistrationService.getPreRegistrationByCpf(formData.cpf).subscribe(existingPreReg => {
        if (existingPreReg) {
          this.snackBar.open('Já existe um pré-cadastro com este CPF!', 'Fechar', { duration: 3000 });
          this.isProcessing = false;
          return;
        }

        // Verificar se já existe um pré-cadastro com este email
        this.preRegistrationService.getPreRegistrationByEmail(formData.email).subscribe(existingEmail => {
          if (existingEmail) {
            this.snackBar.open('Já existe um pré-cadastro com este email!', 'Fechar', { duration: 3000 });
            this.isProcessing = false;
            return;
          }

          // Criar novo pré-cadastro
          this.preRegistrationService.createPreRegistration(preRegistrationData).subscribe({
            next: (preRegId) => {
              this.snackBar.open('Pré-cadastro criado com sucesso!', 'Fechar', { duration: 3000 });
              
              // Fechar modal e retornar dados do cliente
              this.dialogRef.close({
                success: true,
                preRegistrationId: preRegId,
                customerData: {
                  name: formData.name,
                  cpf: formData.cpf,
                  email: formData.email,
                  phone: formData.phone
                }
              });
            },
            error: (error) => {
              console.error('Erro ao criar pré-cadastro:', error);
              this.snackBar.open('Erro ao criar pré-cadastro. Tente novamente.', 'Fechar', { duration: 3000 });
              this.isProcessing = false;
            }
          });
        });
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  // Getters para validação no template
  get nameError(): string {
    const nameControl = this.preRegistrationForm.get('name');
    if (nameControl?.hasError('required')) return 'Nome é obrigatório';
    if (nameControl?.hasError('minlength')) return 'Nome deve ter pelo menos 2 caracteres';
    return '';
  }

  get cpfError(): string {
    const cpfControl = this.preRegistrationForm.get('cpf');
    if (cpfControl?.hasError('required')) return 'CPF é obrigatório';
    if (cpfControl?.hasError('pattern')) return 'CPF deve estar no formato 000.000.000-00';
    return '';
  }

  get emailError(): string {
    const emailControl = this.preRegistrationForm.get('email');
    if (emailControl?.hasError('required')) return 'Email é obrigatório';
    if (emailControl?.hasError('email')) return 'Email inválido';
    return '';
  }

  get phoneError(): string {
    const phoneControl = this.preRegistrationForm.get('phone');
    if (phoneControl?.hasError('required')) return 'Telefone é obrigatório';
    if (phoneControl?.hasError('pattern')) return 'Telefone deve estar no formato (00) 00000-0000';
    return '';
  }
}
