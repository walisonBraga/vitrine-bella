import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavbarHomeComponent } from '../../../navbar-home/components/navbar-home/navbar-home.component';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NavbarHomeComponent,
    // Angular Material Modules
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {
  signInForm!: FormGroup;
  loading = false;
  hidePassword = true;
  rememberMe = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.signInForm = this.createSignInForm();
    this.loadRememberedEmail();
  }

  private createSignInForm(): FormGroup {
    const rememberedEmail = this.getRememberedEmail();
    return this.fb.group({
      email: [rememberedEmail || '', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [!!rememberedEmail]
    });
  }

  private getRememberedEmail(): string | null {
    // Verificar se estamos no browser antes de acessar localStorage
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      return localStorage.getItem('rememberedEmail');
    } catch (error) {
      console.warn('Erro ao acessar localStorage:', error);
      return null;
    }
  }

  private saveRememberedEmail(email: string): void {
    // Verificar se estamos no browser antes de acessar localStorage
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem('rememberedEmail', email);
    } catch (error) {
      console.warn('Erro ao salvar email no localStorage:', error);
    }
  }

  private removeRememberedEmail(): void {
    // Verificar se estamos no browser antes de acessar localStorage
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.removeItem('rememberedEmail');
    } catch (error) {
      console.warn('Erro ao remover email do localStorage:', error);
    }
  }

  private loadRememberedEmail(): void {
    const rememberedEmail = this.getRememberedEmail();
    if (rememberedEmail && this.signInForm) {
      this.signInForm.patchValue({
        email: rememberedEmail,
        rememberMe: true
      });
    }
  }

  public async onSubmit() {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password, rememberMe } = this.signInForm.value;

    // Salvar ou remover email baseado no checkbox "Lembrar-me"
    if (rememberMe) {
      this.saveRememberedEmail(email);
    } else {
      this.removeRememberedEmail();
    }

    try {
      const user: any = await this.authService.signIn(email, password);

      if (user) {
        // Usa redirectRoute se disponível, senão usa role para determinar redirecionamento
        if (user.redirectRoute) {
          // Verifica se tem múltiplos roles
          if (Array.isArray(user.redirectRoute) && 
              user.redirectRoute.includes('/admin') && 
              user.redirectRoute.includes('/loja')) {
            // Usuário com múltiplos roles - vai para página de escolha
            this.router.navigate(['/choose-area']);
          } else if (Array.isArray(user.redirectRoute)) {
            // Array com apenas um role
            this.router.navigate([user.redirectRoute[0]]);
          } else {
            // String única
            this.router.navigate([user.redirectRoute]);
          }
        } else if (user.role) {
          // Se role for admin, store_owner ou store_employee, vai para admin
          if (user.role === 'admin' || user.role === 'store_owner' || user.role === 'store_employee') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.router.navigate(['/home']);
        }
      } else {
        this.snackBar.open('Erro ao fazer login. Verifique suas credenciais.', 'Fechar', { duration: 5000 });
      }

    } catch (error) {
      console.error('Erro ao fazer login:', error);
      this.snackBar.open('Erro ao fazer login. Verifique suas credenciais e tente novamente.', 'Fechar', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  public goToSignUp() {
    this.router.navigate(['/sign-up']);
  }

  public onRememberMeChange(event: any): void {
    const isChecked = event.checked;
    const currentEmail = this.signInForm.get('email')?.value;

    if (isChecked && currentEmail) {
      // Se marcou o checkbox e há email, salva
      this.saveRememberedEmail(currentEmail);
    } else if (!isChecked) {
      // Se desmarcou o checkbox, remove o email salvo
      this.removeRememberedEmail();
    }
  }
}
