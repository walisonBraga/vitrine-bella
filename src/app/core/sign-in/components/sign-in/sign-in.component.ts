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

    const email = this.signInForm.value.email;
    const password = this.signInForm.value.password;

    try {
      const user: any = await this.authService.signIn(email, password);

      if (user && user.role) {
        const role = user.role;

        // 🔹 Se for um array com múltiplos papéis
        if (Array.isArray(role)) {
          if (role.length === 1) {
            this.router.navigate([role[0]]); // Exemplo: "/home"
          } else if (role.length > 1) {
            this.router.navigate(['/choose-role']);
          } else {
            console.warn('Array de roles vazio.');
          }
        }
        // 🔹 Se for apenas uma string
        else if (typeof role === 'string' && role.trim() !== '') {
          this.router.navigate([role]);
        }
        // 🔹 Se não houver role
        else {
          console.warn('Usuário sem role definida. Permanecendo na página atual.');
        }

      } else {
        console.warn('Usuário sem role definida. Permanecendo na página atual.');
      }

    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login. Verifique suas credenciais e tente novamente.');
    }
  }

  public goToSignUp() {
    this.router.navigate(['/sign-up']);
  }
}
