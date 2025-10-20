import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LojaUsersService } from '../../../../module/admin-vitrineBella/users/service/loja-users.service';
import { PreRegistrationService } from '../../../../module/admin-vitrineBella/shared/services/pre-registration.service';


@Component({
  selector: 'app-cpf-verification',
  templateUrl: './cpf-verification.component.html',
  styleUrls: ['./cpf-verification.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class CpfVerificationComponent implements OnInit {
  cpfForm!: FormGroup;
  isVerifying = false;
  foundPreRegistration: any = null;
  foundUser: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private lojaUsersService: LojaUsersService,
    private preRegistrationService: PreRegistrationService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkRedirectParams();
  }

  private checkRedirectParams(): void {
    const queryParams = this.route.snapshot.queryParams;

    // Se veio do signup, mostrar mensagem específica
    if (queryParams['fromSignUp']) {
      this.snackBar.open('Digite seu CPF para verificar se você já possui um pré-cadastro.', 'Fechar', { duration: 4000 });
    }
  }

  initForm(): void {
    this.cpfForm = this.fb.group({
      cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]]
    });
  }

  onCpfInput(event: Event): void {
    let value = (event.target as HTMLInputElement).value;
    value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    this.cpfForm.get('cpf')?.setValue(value, { emitEvent: false });
  }

  verifyCpf(): void {
    if (this.cpfForm.valid) {
      this.isVerifying = true;
      const cpf = this.cpfForm.get('cpf')?.value;

      // Primeiro, buscar na coleção users (usuários já cadastrados)
      this.lojaUsersService.getLojaUsers().subscribe({
        next: (users: any[]) => {
          const foundUser = users.find((user: any) =>
            user.cpf && user.cpf.replace(/[.\-\s]/g, '') === cpf.replace(/[.\-\s]/g, '')
          );

          if (foundUser) {
            // Usuário já está cadastrado completamente
            this.snackBar.open('Este CPF já possui cadastro completo. Faça login para continuar.', 'Fechar', { duration: 5000 });
            this.router.navigate(['/sign-in']);
            return;
          }

          // Se não encontrou na coleção users, buscar nos pré-cadastros
          this.preRegistrationService.getPreRegistrationByCpf(cpf).subscribe({
            next: (preRegistration: any) => {
              if (preRegistration) {
                // Pré-cadastro encontrado - redirecionar para completar cadastro
                this.foundPreRegistration = preRegistration;
                this.snackBar.open('Pré-cadastro encontrado! Complete seu cadastro para continuar.', 'Fechar', { duration: 3000 });

                // Salvar dados do pré-cadastro no localStorage para usar no signup
                localStorage.setItem('preRegistrationData', JSON.stringify(preRegistration));

                // Redirecionar para o signup com os dados pré-preenchidos
                setTimeout(() => {
                  this.router.navigate(['/sign-up'], {
                    queryParams: {
                      cpf: cpf,
                      preRegistration: 'true',
                      uid: preRegistration.uid || preRegistration.id
                    }
                  });
                }, 1500);
              } else {
                // Nenhum pré-cadastro encontrado - redirecionar para cadastro normal
                this.snackBar.open('Nenhum pré-cadastro encontrado. Você pode criar uma nova conta.', 'Fechar', { duration: 3000 });
                setTimeout(() => {
                  this.router.navigate(['/sign-up']);
                }, 1500);
              }
              this.isVerifying = false;
            },
            error: (error: any) => {
              console.error('Erro ao buscar pré-cadastro:', error);
              this.snackBar.open('Erro ao verificar CPF. Tente novamente.', 'Fechar', { duration: 3000 });
              this.isVerifying = false;
            }
          });
        },
        error: (error: any) => {
          console.error('Erro ao buscar usuários:', error);
          this.snackBar.open('Erro ao verificar CPF. Tente novamente.', 'Fechar', { duration: 3000 });
          this.isVerifying = false;
        }
      });
    } else {
      this.snackBar.open('Digite um CPF válido.', 'Fechar', { duration: 3000 });
    }
  }

  goToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }

  goToSignUp(): void {
    this.router.navigate(['/sign-up']);
  }
}