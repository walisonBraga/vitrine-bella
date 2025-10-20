import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateLojaUserService } from '../../service/create-loja-user/create-loja-user.service';
import { UserValidationService } from '../../service/user-validation.service';
import { CreateLojaUserModalData, CreateLojaUserFormData, UserRoleOption, AccessRouteOption, ManagementTypeOption } from '../../interface/create-loja-user.interface';

@Component({
    selector: 'app-create-loja-user-modal',
    templateUrl: './create-loja-user-modal.component.html',
    styleUrl: './create-loja-user-modal.component.scss'
})
export class CreateLojaUserModalComponent implements OnInit {
    createUserForm: FormGroup;
    isLoading = false;
    isEdit = false;
    showPasswordFields = false;

    // Opções para os selects
    userRoles: UserRoleOption[] = [];
    accessRoutes: AccessRouteOption[] = [];
    managementTypes: ManagementTypeOption[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private dialogRef: MatDialogRef<CreateLojaUserModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateLojaUserModalData,
        private snackBar: MatSnackBar,
        private createLojaUserService: CreateLojaUserService,
        private userValidationService: UserValidationService
    ) {
        this.isEdit = data?.isEdit || false;
        this.createUserForm = this.createForm();
        this.loadOptions();
    }

    ngOnInit(): void {
        if (this.isEdit && this.data.user) {
            this.populateForm(this.data.user);
        }
    }

    private loadOptions(): void {
        this.userRoles = this.createLojaUserService.getUserRoles();
        this.accessRoutes = this.createLojaUserService.getAccessRoutes();
        this.managementTypes = this.createLojaUserService.getManagementTypes();
    }

    private createForm(): FormGroup {
        const form = this.formBuilder.group({
            fullName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
            cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
            phone: ['', [Validators.required]],
            birthDate: [''],
            userRole: ['admin', Validators.required],
            accessRoutes: [[], Validators.required],
            managementType: [[], Validators.required],
            isActive: [true],
            marketing: [false],
            changePassword: [false]
        });

        // Configurar permissões automáticas quando o role mudar
        form.get('userRole')?.valueChanges.subscribe(role => {
            if (role) {
                const autoPermissions = this.createLojaUserService.getAutoPermissions(role);
                form.patchValue({
                    accessRoutes: autoPermissions.accessRoutes as any,
                    managementType: autoPermissions.managementTypes as any
                });
            }
        });

        // Configurar permissões iniciais
        const initialRole = form.get('userRole')?.value;
        if (initialRole) {
            const autoPermissions = this.createLojaUserService.getAutoPermissions(initialRole);
            form.patchValue({
                accessRoutes: autoPermissions.accessRoutes as any,
                managementType: autoPermissions.managementTypes as any
            });
        }

        return form;
    }

    private populateForm(user: any): void {
        this.createUserForm.patchValue({
            fullName: user.fullName || '',
            email: user.email || '',
            cpf: user.cpf || '',
            phone: user.phone || '',
            birthDate: user.birthDate || '',
            userRole: user.userRole || 'admin',
            accessRoutes: user.redirectRoute || ['/loja'],
            managementType: user.managementType || ['/dashboard'],
            isActive: user.isActive !== false,
            marketing: user.marketing || false
        });
    }

    async onSubmit(): Promise<void> {
        if (this.createUserForm.valid) {
            this.isLoading = true;
            try {
                const formData = this.createUserForm.value as CreateLojaUserFormData;

                // Validar dados antes de enviar
                const validation = this.createLojaUserService.validateUserData(formData);
                if (!validation.isValid) {
                    this.snackBar.open(validation.errors.join(', '), 'Fechar', { duration: 5000 });
                    return;
                }

                if (this.isEdit) {
                    // Editar usuário existente
                    await this.updateUser(formData);
                } else {
                    // Criar novo usuário
                    await this.createUser(formData);
                }

                this.snackBar.open(
                    `Usuário ${this.isEdit ? 'atualizado' : 'criado'} com sucesso!`,
                    'Fechar',
                    { duration: 3000 }
                );
                this.dialogRef.close(true);
            } catch (error) {
                console.error('Erro ao salvar usuário:', error);
                this.snackBar.open('Erro ao salvar usuário', 'Fechar', { duration: 3000 });
            } finally {
                this.isLoading = false;
            }
        } else {
            this.markFormGroupTouched();
        }
    }

    private async createUser(formData: CreateLojaUserFormData): Promise<void> {
        await this.createLojaUserService.createLojaUser(formData);
    }

    private async updateUser(formData: CreateLojaUserFormData): Promise<void> {
        const updateData: any = {
            fullName: formData.fullName,
            email: formData.email,
            cpf: formData.cpf,
            phone: formData.phone,
            birthDate: formData.birthDate,
            userRole: formData.userRole,
            redirectRoute: formData.accessRoutes,
            managementType: formData.managementType,
            isActive: formData.isActive,
            marketing: formData.marketing
        };

        // Se o usuário marcou para alterar a senha, incluir a nova senha
        if (formData.changePassword && formData.password) {
            updateData.password = formData.password;
        }

        await this.createLojaUserService.updateLojaUser(this.data.user.uid, updateData);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    private markFormGroupTouched(): void {
        Object.keys(this.createUserForm.controls).forEach(key => {
            const control = this.createUserForm.get(key);
            control?.markAsTouched();
        });
    }

    // Getters para validação no template
    get fullNameError(): string {
        const control = this.createUserForm.get('fullName');
        if (control?.hasError('required')) return 'Nome é obrigatório';
        if (control?.hasError('minlength')) return 'Nome deve ter pelo menos 2 caracteres';
        return '';
    }

    get emailError(): string {
        const control = this.createUserForm.get('email');
        if (control?.hasError('required')) return 'Email é obrigatório';
        if (control?.hasError('email')) return 'Email inválido';
        if (control?.hasError('duplicate')) return control.errors?.['message'] || 'Email já cadastrado';
        return '';
    }

    get passwordError(): string {
        const control = this.createUserForm.get('password');
        if (control?.hasError('required')) return 'Senha é obrigatória';
        if (control?.hasError('minlength')) return 'Senha deve ter pelo menos 6 caracteres';
        return '';
    }

    get cpfError(): string {
        const control = this.createUserForm.get('cpf');
        if (control?.hasError('required')) return 'CPF é obrigatório';
        if (control?.hasError('pattern')) return 'CPF inválido';
        if (control?.hasError('duplicate')) return control.errors?.['message'] || 'CPF já cadastrado';
        return '';
    }

    get phoneError(): string {
        const control = this.createUserForm.get('phone');
        if (control?.hasError('required')) return 'Telefone é obrigatório';
        if (control?.hasError('duplicate')) return control.errors?.['message'] || 'Telefone já cadastrado';
        return '';
    }

    // Métodos para formatação
    formatCPF(event: any): void {
        const formatted = this.userValidationService.formatCPF(event.target.value);
        event.target.value = formatted;
        this.createUserForm.get('cpf')?.setValue(formatted);
        this.validateCPF(formatted);
    }

    formatPhone(event: any): void {
        const formatted = this.userValidationService.formatPhone(event.target.value);
        event.target.value = formatted;
        this.createUserForm.get('phone')?.setValue(formatted);
        this.validatePhone(formatted);
    }

    // Validações em tempo real
    async validateCPF(cpf: string): Promise<void> {
        if (!cpf || cpf.length < 14) return; // CPF formatado tem 14 caracteres

        try {
            const result = await this.userValidationService.validateUniqueCPF(
                cpf,
                this.isEdit ? this.data.user?.uid : undefined
            );

            const cpfControl = this.createUserForm.get('cpf');
            if (!result.isValid) {
                cpfControl?.setErrors({ 'duplicate': true, 'message': result.message });
            } else {
                const errors = cpfControl?.errors;
                if (errors) {
                    delete errors['duplicate'];
                    delete errors['message'];
                    cpfControl?.setErrors(Object.keys(errors).length > 0 ? errors : null);
                }
            }
        } catch (error) {
            console.error('Erro ao validar CPF:', error);
        }
    }

    async validatePhone(phone: string): Promise<void> {
        if (!phone || phone.length < 14) return; // Telefone formatado tem pelo menos 14 caracteres

        try {
            const result = await this.userValidationService.validateUniquePhone(
                phone,
                this.isEdit ? this.data.user?.uid : undefined
            );

            const phoneControl = this.createUserForm.get('phone');
            if (!result.isValid) {
                phoneControl?.setErrors({ 'duplicate': true, 'message': result.message });
            } else {
                const errors = phoneControl?.errors;
                if (errors) {
                    delete errors['duplicate'];
                    delete errors['message'];
                    phoneControl?.setErrors(Object.keys(errors).length > 0 ? errors : null);
                }
            }
        } catch (error) {
            console.error('Erro ao validar telefone:', error);
        }
    }

    async validateEmail(email: string): Promise<void> {
        if (!email || !email.includes('@')) return;

        try {
            const result = await this.userValidationService.validateUniqueEmail(
                email,
                this.isEdit ? this.data.user?.uid : undefined
            );

            const emailControl = this.createUserForm.get('email');
            if (!result.isValid) {
                emailControl?.setErrors({ 'duplicate': true, 'message': result.message });
            } else {
                const errors = emailControl?.errors;
                if (errors) {
                    delete errors['duplicate'];
                    delete errors['message'];
                    emailControl?.setErrors(Object.keys(errors).length > 0 ? errors : null);
                }
            }
        } catch (error) {
            console.error('Erro ao validar email:', error);
        }
    }

    onPasswordChangeToggle(event: any): void {
        const shouldChangePassword = event.checked;
        this.showPasswordFields = shouldChangePassword;

        const passwordControl = this.createUserForm.get('password');
        if (shouldChangePassword) {
            passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
        } else {
            passwordControl?.setValidators([]);
        }
        passwordControl?.updateValueAndValidity();
    }
}
