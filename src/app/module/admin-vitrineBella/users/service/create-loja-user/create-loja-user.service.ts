import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, setDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../../../core/auth/auth.service';
import { LojaUser } from '../../interface/loja-user.interface';
import { UserValidationService, ValidationResult } from '../user-validation.service';
import { CreateLojaUserData, UpdateLojaUserData, UserRoleOption, AccessRouteOption, ManagementTypeOption, FormValidationResult } from '../../interface/create-loja-user.interface';

@Injectable({
    providedIn: 'root'
})
export class CreateLojaUserService {

    constructor(
        private firestore: Firestore,
        private authService: AuthService,
        private userValidationService: UserValidationService
    ) { }

    /**
     * Cria um novo usuário da loja
     */
    async createLojaUser(userData: CreateLojaUserData): Promise<string> {
        try {
            // 1. Criar usuário no Firebase Auth primeiro para obter o UID
            const userCredential = await this.authService.createUser(
                userData.email,
                userData.password!
            );

            if (!userCredential.user) {
                throw new Error('Falha ao criar usuário no Firebase Auth');
            }

            // 2. Gerar accessCode usando os primeiros 10 caracteres do UID
            const accessCode = userCredential.user.uid.substring(0, 10);

            // 3. Validar campos únicos (incluindo o accessCode gerado)
            const validations = await this.userValidationService.validateAllUniqueFields(
                userData.cpf,
                userData.phone,
                userData.email,
                accessCode
            );

            // Verificar se há erros de validação
            const errors = validations.filter(v => !v.isValid);
            if (errors.length > 0) {
                const errorMessage = errors.map(e => e.message).join(', ');
                throw new Error(errorMessage);
            }

            // 4. Preparar dados para o Firestore
            const firestoreData = {
                uid: userCredential.user.uid,
                fullName: userData.fullName,
                email: userData.email.toLowerCase().trim(),
                cpf: this.userValidationService.formatCPF(userData.cpf),
                phone: this.userValidationService.formatPhone(userData.phone),
                birthDate: userData.birthDate || null,
                userRole: userData.userRole,
                redirectRoute: userData.accessRoutes,
                managementType: userData.managementType,
                isActive: userData.isActive,
                marketing: userData.marketing,
                createdAt: new Date(),
                updatedAt: new Date(),
                // Campos adicionais para compatibilidade
                role: this.getRoleFromUserRole(userData.userRole),
                accessCode: accessCode, // Código único gerado
                photoURL: null
            };

            // 5. Salvar dados no Firestore usando o UID como ID do documento
            const userDocRef = doc(this.firestore, 'users', userCredential.user.uid);
            await setDoc(userDocRef, firestoreData);

            return userCredential.user.uid;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Atualiza um usuário existente
     */
    async updateLojaUser(userId: string, userData: UpdateLojaUserData): Promise<void> {
        try {
            // 1. Validar campos únicos antes de atualizar (excluindo o usuário atual)
            const validations = await Promise.all([
                this.userValidationService.validateUniqueCPF(userData.cpf, userId),
                this.userValidationService.validateUniquePhone(userData.phone, userId),
                this.userValidationService.validateUniqueEmail(userData.email, userId)
            ]);

            // Verificar se há erros de validação
            const errors = validations.filter(v => !v.isValid);
            if (errors.length > 0) {
                const errorMessage = errors.map(e => e.message).join(', ');
                throw new Error(errorMessage);
            }

            // 2. Atualizar dados no Firestore
            const userRef = doc(this.firestore, 'users', userId);

            const updateData = {
                fullName: userData.fullName,
                email: userData.email.toLowerCase().trim(),
                cpf: this.userValidationService.formatCPF(userData.cpf),
                phone: this.userValidationService.formatPhone(userData.phone),
                birthDate: userData.birthDate || null,
                userRole: userData.userRole,
                redirectRoute: userData.redirectRoute,
                managementType: userData.managementType,
                isActive: userData.isActive,
                marketing: userData.marketing,
                updatedAt: new Date(),
                // Atualizar role baseado no userRole
                role: this.getRoleFromUserRole(userData.userRole)
            };

            await updateDoc(userRef, updateData);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Valida dados do usuário antes de criar/atualizar
     */
    validateUserData(userData: CreateLojaUserData | UpdateLojaUserData): FormValidationResult {
        const errors: string[] = [];

        // Validações básicas
        if (!userData.fullName || userData.fullName.trim().length < 2) {
            errors.push('Nome deve ter pelo menos 2 caracteres');
        }

        if (!userData.email || !this.isValidEmail(userData.email)) {
            errors.push('Email inválido');
        }

        if (!userData.cpf || !this.isValidCPF(userData.cpf)) {
            errors.push('CPF inválido');
        }

        if (!userData.phone || userData.phone.trim().length < 10) {
            errors.push('Telefone inválido');
        }

        if (!userData.userRole) {
            errors.push('Função do usuário é obrigatória');
        }

        // Verificar páginas de acesso (propriedade diferente para cada tipo)
        const accessRoutes = 'accessRoutes' in userData ? userData.accessRoutes : userData.redirectRoute;
        if (!accessRoutes || accessRoutes.length === 0) {
            errors.push('Pelo menos uma página de acesso deve ser selecionada');
        }

        if (!userData.managementType || userData.managementType.length === 0) {
            errors.push('Pelo menos uma permissão de gerenciamento deve ser selecionada');
        }

        // Validação específica para criação
        if ('password' in userData && !userData.password) {
            errors.push('Senha é obrigatória para novos usuários');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Converte userRole para role compatível
     */
    private getRoleFromUserRole(userRole: string): string {
        switch (userRole) {
            case 'admin':
                return 'admin';
            case 'store_owner':
                return 'store_owner';
            case 'store_manager':
                return 'store_manager';
            case 'store_employee':
                return 'store_employee';
            case 'cliente':
            default:
                return 'loja';
        }
    }

    /**
     * Gera código de acesso único
     */
    private generateAccessCode(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

    /**
     * Valida formato de email
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida formato de CPF
     */
    private isValidCPF(cpf: string): boolean {
        // Remove formatação
        const cleanCPF = cpf.replace(/\D/g, '');

        // Verifica se tem 11 dígitos
        if (cleanCPF.length !== 11) return false;

        // Verifica se não são todos iguais
        if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

        // Validação básica de CPF (algoritmo)
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

        return true;
    }

    /**
     * Formata CPF para exibição
     */
    formatCPF(cpf: string): string {
        const cleanCPF = cpf.replace(/\D/g, '');
        return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    /**
     * Formata telefone para exibição
     */
    formatPhone(phone: string): string {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 11) {
            return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleanPhone.length === 10) {
            return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    }

    /**
     * Obtém opções de roles disponíveis
     */
    getUserRoles(): UserRoleOption[] {
        return [
            {
                value: 'admin',
                label: 'Administrador',
                description: 'Acesso total ao sistema (admin + loja)'
            },
            {
                value: 'store_owner',
                label: 'Proprietário da Loja',
                description: 'Acesso completo à loja e área administrativa'
            },
            {
                value: 'store_manager',
                label: 'Gerente da Loja',
                description: 'Acesso à loja + gerenciamento de equipe e operações'
            },
            {
                value: 'store_employee',
                label: 'Funcionário da Loja',
                description: 'Acesso à loja + permissões específicas de gerenciamento'
            }
        ];
    }

    /**
     * Obtém permissões automáticas baseadas no role do usuário
     */
    getAutoPermissions(userRole: string): { accessRoutes: string[], managementTypes: string[] } {
        switch (userRole) {
            case 'admin':
                return {
                    accessRoutes: ['/loja', '/admin'],
                    managementTypes: ['/dashboard', '/products', '/users', '/sales', '/categories', '/coupons', '/slides', '/permissions']
                };
            case 'store_owner':
                return {
                    accessRoutes: ['/loja', '/admin'],
                    managementTypes: ['/dashboard', '/products', '/users', '/sales', '/categories', '/coupons', '/slides']
                };
            case 'store_manager':
                return {
                    accessRoutes: ['/loja', '/admin'],
                    managementTypes: ['/dashboard', '/products', '/sales', '/categories', '/coupons', '/slides']
                };
            case 'store_employee':
                return {
                    accessRoutes: ['/loja', '/admin'],
                    managementTypes: ['/dashboard', '/products', '/sales']
                };
            default:
                return {
                    accessRoutes: ['/loja'],
                    managementTypes: ['/dashboard']
                };
        }
    }
    getAccessRoutes(): AccessRouteOption[] {
        return [
            {
                value: '/loja',
                label: 'Loja Virtual',
                description: 'Acesso à área de compras e produtos'
            },
            {
                value: '/admin',
                label: 'Área Administrativa',
                description: 'Acesso ao painel de administração'
            }
        ];
    }

    /**
     * Obtém opções de permissões de gerenciamento
     */
    getManagementTypes(): ManagementTypeOption[] {
        return [
            {
                value: '/dashboard',
                label: 'Dashboard',
                description: 'Acesso ao painel principal'
            },
            {
                value: '/products',
                label: 'Produtos',
                description: 'Gerenciar catálogo de produtos'
            },
            {
                value: '/users',
                label: 'Usuários',
                description: 'Gerenciar usuários do sistema'
            },
            {
                value: '/sales',
                label: 'Vendas',
                description: 'Relatórios e gestão de vendas'
            },
            {
                value: '/categories',
                label: 'Categorias',
                description: 'Organizar produtos por categorias'
            },
            {
                value: '/coupons',
                label: 'Cupons',
                description: 'Sistema de descontos e promoções'
            },
            {
                value: '/slides',
                label: 'Slides',
                description: 'Gerenciar banners da loja'
            },
            {
                value: '/permissions',
                label: 'Permissões',
                description: 'Controle de acesso e permissões'
            }
        ];
    }
}
