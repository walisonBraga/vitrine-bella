import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { Router } from '@angular/router';
import { NavbarHomeComponent } from "../../../navbar-home/components/navbar-home/navbar-home.component";
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { SignUp } from '../../interface/sign-up';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarHomeComponent,
    NgxMaskDirective,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,
    MatDividerModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  providers: [provideNgxMask()],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent implements OnInit {
  signUpForm!: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.signUpForm = this.fb.group({
      nome: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        this.noNumbersValidator
      ]],
      cpf: ['', [
        Validators.required,
        Validators.minLength(11),
        this.cpfValidator
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      telefone: ['', [
        Validators.required,
        Validators.minLength(10),
        this.phoneValidator
      ]],
      senha: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmarSenha: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
    }, { validators: this.senhasIguaisValidator });
  }

  senhasIguaisValidator(group: AbstractControl): ValidationErrors | null {
    const senha = group.get('senha')?.value;
    const confirmarSenha = group.get('confirmarSenha')?.value;
    return senha && confirmarSenha && senha !== confirmarSenha ? { senhasDiferentes: true } : null;
  }

  // Validador para evitar números no nome
  noNumbersValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && /\d/.test(value)) {
      return { containsNumbers: true };
    }
    return null;
  }

  // Validador de CPF
  cpfValidator(control: AbstractControl): ValidationErrors | null {
    const cpf = control.value?.replace(/\D/g, '');

    if (!cpf || cpf.length !== 11) {
      return { invalidCpf: true };
    }

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return { invalidCpf: true };
    }

    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) {
      return { invalidCpf: true };
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) {
      return { invalidCpf: true };
    }

    return null;
  }

  // Validador de telefone brasileiro
  phoneValidator(control: AbstractControl): ValidationErrors | null {
    const phone = control.value?.replace(/\D/g, '');

    if (!phone) {
      return null; // Deixa o required validator lidar com campos vazios
    }

    // Aceita telefones com 10 ou 11 dígitos (com ou sem DDD)
    if (phone.length < 10 || phone.length > 11) {
      return { invalidPhone: true };
    }

    // Verifica se começa com DDD válido (11-99)
    const ddd = phone.substring(0, 2);
    if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
      return { invalidPhone: true };
    }

    return null;
  }

  // Validador de força da senha
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;

    if (!password) {
      return null; // Deixa o required validator lidar com campos vazios
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return { weakPassword: true };
    }

    return null;
  }

  async onSubmit() {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const formData = this.signUpForm.value;
      const { email, senha } = formData;

      // Criar usuário no Firebase Auth
      const authResponse = await this.authService.createUser(email, senha);
      const userId = authResponse.user.uid;

      // Preparar dados do usuário para salvar no Firestore
      const userData = {
        uid: userId,
        fullName: formData.nome,
        email: formData.email,
        accessCode: userId.substring(0, 10),
        isActive: true,
        role: 'loja',
        cpf: formData.cpf,
        phone: formData.telefone,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Campos adicionais para loja
        birthDate: null,
        photoURL: null,
        photoFileName: null,
        marketing: true,
        // Campos de endereço (opcionais)
        addresses: [],
        // Campos de pedidos
        orders: [],
        // Campos de favoritos
        favorites: []
      };

      // Salvar informações do usuário no Firestore
      await this.authService.saveUserInfo(userData);

      this.showSuccessMessage('Conta criada com sucesso! Agora você pode acessar.');
      this.router.navigate(['/sign-in']);
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      this.handleSignUpError(error);
    } finally {
      this.loading = false;
    }
  }

  private handleSignUpError(error: any): void {
    let errorMessage = 'Erro ao criar conta. Tente novamente.';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'A senha é muito fraca. Use pelo menos 8 caracteres com maiúscula, minúscula, número e caractere especial.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'E-mail inválido. Verifique o formato do e-mail.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
    }

    this.snackBar.open(errorMessage, 'Fechar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
