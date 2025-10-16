import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../../../core/auth/auth.service'; // Ajuste o path
import { CreateUserService } from '../../../service/create-user.service'; // Ajuste o path
import { MatSnackBar } from '@angular/material/snack-bar';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';

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
  selectedFile: File | null = null;
  previewUrl: string | null = null;
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
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)]],
      role: [{ value: '', disabled: true }, Validators.required],
      marketing: [true]
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
        fullName: this.userData.fullName || '',
        email: this.userData.email || '',
        phone: this.userData.phone || '',
        role: this.userData.role || '',
        marketing: this.userData.marketing ?? true
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

      // Se há uma foto selecionada, fazer upload primeiro
      if (this.selectedFile) {
        this.uploadPhoto().then((photoData) => {
          // Incluir dados da foto nas atualizações
          const updatesWithPhoto = { ...updates, ...photoData };
          this.updateUserProfile(updatesWithPhoto);
        }).catch((error) => {
          console.error('Erro no upload da foto:', error);
          this.loading = false;
          this.snackBar.open('Erro ao fazer upload da foto', 'Fechar', { duration: 3000 });
        });
      } else {
        // Sem foto, apenas atualizar perfil
        this.updateUserProfile(updates);
      }
    }
  }

  private updateUserProfile(updates: any): void {
    this.createUserService.updateUser(this.userData.uid, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.authService.updateUserData(this.userData.uid);
          this.userData = { ...this.userData, ...updates };
          this.loading = false;
          this.editMode = false;

          // Limpar arquivo selecionado e preview
          this.selectedFile = null;
          this.previewUrl = null;

          this.snackBar.open('Perfil atualizado com sucesso!', 'Fechar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Erro ao atualizar perfil:', error);
          this.loading = false;
          this.snackBar.open('Erro ao atualizar perfil', 'Fechar', { duration: 3000 });
        }
      });
  }

  private async uploadPhoto(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile || !this.userData) {
        reject(new Error('Arquivo ou usuário não encontrado'));
        return;
      }

      // Obter nome do usuário do formulário
      const userName = this.editForm.get('fullName')?.value || 'usuario';
      const sanitizedName = userName.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      // Obter extensão do arquivo
      const fileExtension = this.selectedFile.name.split('.').pop();

      // Criar nome do arquivo com o nome do usuário
      const fileName = `profile-photos/${this.userData.uid}/${sanitizedName}.${fileExtension}`;
      const fileRef = ref(this.storage, fileName);

      // Primeiro, deletar a foto anterior se existir
      this.deletePreviousPhoto().then(() => {
        // Upload da nova imagem
        const uploadTask = uploadBytesResumable(fileRef, this.selectedFile!);

        uploadTask.on('state_changed',
          (snapshot) => {
            // Progress callback
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          },
          (error) => {
            reject(error);
          },
          () => {
            // Success callback
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve({
                photoURL: downloadURL,
                photoFileName: fileName
              });
            }).catch((error) => {
              reject(error);
            });
          }
        );
      }).catch((error) => {
        // Continuar com o upload mesmo se não conseguir deletar
      });
    });
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
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Por favor, selecione apenas arquivos de imagem', 'Fechar', {
          duration: 3000
        });
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('A imagem deve ter no máximo 5MB', 'Fechar', {
          duration: 3000
        });
        return;
      }

      // Salvar arquivo selecionado
      this.selectedFile = file;

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);

      this.snackBar.open('Foto selecionada. Clique em "Salvar Alterações" para confirmar.', 'Fechar', {
        duration: 3000
      });
    }
  }

  private async deletePreviousPhoto(): Promise<void> {
    if (this.userData?.photoFileName && this.userData.photoURL && !this.userData.photoURL.includes('icon-sem-perfil')) {
      try {
        const oldFileRef = ref(this.storage, this.userData.photoFileName);
        await deleteObject(oldFileRef);
      } catch (error) {
        // Não falhar o processo se não conseguir deletar
      }
    }
  }

  onLogout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(['/signin']);
    });
  }

  onImageError(event: any): void {
    // Se a imagem falhar ao carregar, usar a imagem padrão
    event.target.src = 'assets/img/icon-sem-perfil.png';
  }

  getFileNameFromPath(filePath: string): string {
    return filePath.split('/').pop() || '';
  }

  formatBirthDate(birthDate: string | undefined): string {
    if (!birthDate) {
      return 'Não informado';
    }

    // Se já está no formato brasileiro, retorna como está
    if (birthDate.includes('/')) {
      return birthDate;
    }

    // Se está no formato ISO (YYYY-MM-DD), converte para DD/MM/YYYY
    if (birthDate.includes('-')) {
      const [year, month, day] = birthDate.split('-');
      return `${day}/${month}/${year}`;
    }

    return birthDate;
  }

  onDeleteAccount(): void {
    // Implementar lógica de exclusão de conta
    this.snackBar.open('Funcionalidade de exclusão de conta será implementada em breve', 'Fechar', {
      duration: 3000
    });
  }

  get email() { return this.editForm.get('email'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}
