import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.signInForm = this.createSignInForm();
  }

  private createSignInForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  public async onSubmit() {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const email = this.signInForm.value.email;
    const password = this.signInForm.value.password;

    try {
      const user: any = await this.authService.signIn(email, password);

      if (user) {
        // Usa redirectRoute se disponível, senão usa role para determinar redirecionamento
        if (user.redirectRoute) {
          this.router.navigate([user.redirectRoute]);
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
}
