import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

export interface ValidationResult {
  isValid: boolean;
  message: string;
  field?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserValidationService {

  constructor(private firestore: Firestore) { }

  /**
   * Valida se o CPF já existe no sistema
   */
  async validateUniqueCPF(cpf: string, excludeUserId?: string): Promise<ValidationResult> {
    try {
      const formattedCPF = this.formatCPF(cpf);
      
      if (!this.isValidCPF(formattedCPF)) {
        return {
          isValid: false,
          message: 'CPF inválido',
          field: 'cpf'
        };
      }

      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection, where('cpf', '==', formattedCPF));
      const querySnapshot = await getDocs(q);

      // Verifica se existe algum usuário com este CPF (excluindo o usuário atual se estiver editando)
      const existingUsers = querySnapshot.docs.filter(doc => {
        if (excludeUserId && doc.id === excludeUserId) {
          return false; // Exclui o usuário atual da verificação
        }
        return true;
      });

      if (existingUsers.length > 0) {
        return {
          isValid: false,
          message: 'Este CPF já está cadastrado no sistema',
          field: 'cpf'
        };
      }

      return {
        isValid: true,
        message: 'CPF válido'
      };
    } catch (error) {
      console.error('Erro ao validar CPF:', error);
      return {
        isValid: false,
        message: 'Erro ao validar CPF. Tente novamente.',
        field: 'cpf'
      };
    }
  }

  /**
   * Valida se o telefone já existe no sistema
   */
  async validateUniquePhone(phone: string, excludeUserId?: string): Promise<ValidationResult> {
    try {
      const formattedPhone = this.formatPhone(phone);
      
      if (!this.isValidPhone(formattedPhone)) {
        return {
          isValid: false,
          message: 'Telefone inválido',
          field: 'phone'
        };
      }

      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection, where('phone', '==', formattedPhone));
      const querySnapshot = await getDocs(q);

      // Verifica se existe algum usuário com este telefone (excluindo o usuário atual se estiver editando)
      const existingUsers = querySnapshot.docs.filter(doc => {
        if (excludeUserId && doc.id === excludeUserId) {
          return false; // Exclui o usuário atual da verificação
        }
        return true;
      });

      if (existingUsers.length > 0) {
        return {
          isValid: false,
          message: 'Este telefone já está cadastrado no sistema',
          field: 'phone'
        };
      }

      return {
        isValid: true,
        message: 'Telefone válido'
      };
    } catch (error) {
      console.error('Erro ao validar telefone:', error);
      return {
        isValid: false,
        message: 'Erro ao validar telefone. Tente novamente.',
        field: 'phone'
      };
    }
  }

  /**
   * Valida se o email já existe no sistema
   */
  async validateUniqueEmail(email: string, excludeUserId?: string): Promise<ValidationResult> {
    try {
      if (!this.isValidEmail(email)) {
        return {
          isValid: false,
          message: 'Email inválido',
          field: 'email'
        };
      }

      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection, where('email', '==', email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      // Verifica se existe algum usuário com este email (excluindo o usuário atual se estiver editando)
      const existingUsers = querySnapshot.docs.filter(doc => {
        if (excludeUserId && doc.id === excludeUserId) {
          return false; // Exclui o usuário atual da verificação
        }
        return true;
      });

      if (existingUsers.length > 0) {
        return {
          isValid: false,
          message: 'Este email já está cadastrado no sistema',
          field: 'email'
        };
      }

      return {
        isValid: true,
        message: 'Email válido'
      };
    } catch (error) {
      console.error('Erro ao validar email:', error);
      return {
        isValid: false,
        message: 'Erro ao validar email. Tente novamente.',
        field: 'email'
      };
    }
  }

  /**
   * Valida se o código de acesso já existe no sistema
   */
  async validateUniqueAccessCode(accessCode: string, excludeUserId?: string): Promise<ValidationResult> {
    try {
      if (!accessCode || accessCode.trim().length === 0) {
        return {
          isValid: false,
          message: 'Código de acesso é obrigatório',
          field: 'accessCode'
        };
      }

      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection, where('accessCode', '==', accessCode.trim()));
      const querySnapshot = await getDocs(q);

      // Verifica se existe algum usuário com este código (excluindo o usuário atual se estiver editando)
      const existingUsers = querySnapshot.docs.filter(doc => {
        if (excludeUserId && doc.id === excludeUserId) {
          return false; // Exclui o usuário atual da verificação
        }
        return true;
      });

      if (existingUsers.length > 0) {
        return {
          isValid: false,
          message: 'Este código de acesso já está em uso',
          field: 'accessCode'
        };
      }

      return {
        isValid: true,
        message: 'Código de acesso válido'
      };
    } catch (error) {
      console.error('Erro ao validar código de acesso:', error);
      return {
        isValid: false,
        message: 'Erro ao validar código de acesso. Tente novamente.',
        field: 'accessCode'
      };
    }
  }

  /**
   * Valida todos os campos únicos de uma vez
   */
  async validateAllUniqueFields(
    cpf: string, 
    phone: string, 
    email: string, 
    accessCode: string, 
    excludeUserId?: string
  ): Promise<ValidationResult[]> {
    const validations = await Promise.all([
      this.validateUniqueCPF(cpf, excludeUserId),
      this.validateUniquePhone(phone, excludeUserId),
      this.validateUniqueEmail(email, excludeUserId),
      this.validateUniqueAccessCode(accessCode, excludeUserId)
    ]);

    return validations;
  }

  /**
   * Validação de CPF usando algoritmo oficial
   */
  private isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  /**
   * Validação de telefone brasileiro
   */
  private isValidPhone(phone: string): boolean {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Verifica se tem 10 ou 11 dígitos (com DDD)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  }

  /**
   * Validação de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formata CPF para o padrão brasileiro
   */
  formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata telefone para o padrão brasileiro
   */
  formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  }

  /**
   * Gera um código de acesso único baseado no timestamp e random
   */
  generateUniqueAccessCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `USR_${timestamp}_${random}`.toUpperCase();
  }
}
