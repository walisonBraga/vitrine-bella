import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../../../core/auth/auth.service'; // Ajuste o path
import { CreateUserService } from '../../../service/create-user.service'; // Ajuste o path
import { MatSnackBar } from '@angular/material/snack-bar';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
userData: any | null = null;
  editMode = false;
  passwordMode = false;
  loading = false;
  photoUploading = false;
  editForm: FormGroup;
  passwordForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private createUserService: CreateUserService,
    private router: Router,
    private fb: FormBuilder,
    private storage: Storage,
    private snackBar: MatSnackBar
  ) {
    this.editForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-()]{10,}$/)]],
      role: [{ value: '', disabled: true }, Validators.required]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.userData = user;
        if (!this.userData) {
          this.router.navigate(['/signin']);
          return;
        }
        this.populateEditForm();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  populateEditForm(): void {
    if (this.userData) {
      this.editForm.patchValue({
        firstName: this.userData.firstName || '',
        lastName: this.userData.lastName || '',
        email: this.userData.email || '',
        phone: this.userData.phone || '',
        role: this.userData.role || ''
      });
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onToggleEdit(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.populateEditForm();
    }
  }

  onTogglePassword(): void {
    this.passwordMode = !this.passwordMode;
  }

  onSaveEdit(): void {
    if (this.editForm.valid && this.userData) {
      this.loading = true;
      const updates = this.editForm.value;
      this.createUserService.updateUser(this.userData.uid, updates)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.authService.updateUserData(this.userData.uid);
            this.userData = { ...this.userData, ...updates };
            this.loading = false;
            this.editMode = false;
            this.snackBar.open('Perfil atualizado com sucesso!', 'Fechar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Erro ao atualizar perfil:', error);
            this.loading = false;
            this.snackBar.open('Erro ao atualizar perfil.', 'Fechar', { duration: 3000 });
          }
        });
    }
  }

  onSavePassword(): void {
    if (this.passwordForm.valid && this.userData) {
      this.loading = true;
      // Implemente mudança de senha no AuthService
      this.loading = false;
      this.passwordMode = false;
      this.passwordForm.reset();
      this.snackBar.open('Senha alterada com sucesso!', 'Fechar', { duration: 3000 });
    }
  }

  onFileSelected(event: any): void {

  }

  onLogout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(['/signin']);
    });
  }

  get email() { return this.editForm.get('email'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}
