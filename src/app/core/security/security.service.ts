import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SecurityConfig {
  sessionTimeout: number; // em minutos
  maxLoginAttempts: number;
  lockoutDuration: number; // em minutos
  passwordMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
}

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'session_timeout' | 'suspicious_activity' | 'data_access' | 'data_modification';
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly SECURITY_CONFIG: SecurityConfig = {
    sessionTimeout: 30, // 30 minutos
    maxLoginAttempts: 5,
    lockoutDuration: 15, // 15 minutos
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true
  };

  private readonly STORAGE_KEYS = {
    LOGIN_ATTEMPTS: 'security_login_attempts',
    LOCKOUT_UNTIL: 'security_lockout_until',
    SESSION_START: 'security_session_start',
    LAST_ACTIVITY: 'security_last_activity'
  };

  private securityEvents$ = new BehaviorSubject<SecurityEvent[]>([]);
  private sessionTimeoutTimer?: any;

  constructor() {
    this.initializeSecurity();
  }

  private initializeSecurity(): void {
    // Só inicializa no browser (não no servidor)
    if (typeof window !== 'undefined') {
      this.startSessionMonitoring();
      this.setupActivityTracking();
    }
  }

  /**
   * Valida força da senha conforme LGPD e boas práticas
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.SECURITY_CONFIG.passwordMinLength) {
      errors.push(`Senha deve ter pelo menos ${this.SECURITY_CONFIG.passwordMinLength} caracteres`);
    }

    if (this.SECURITY_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (this.SECURITY_CONFIG.requireNumbers && !/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }

    if (this.SECURITY_CONFIG.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }

    // Verifica senhas comuns (lista básica)
    const commonPasswords = ['123456', 'password', '123456789', '12345678', '12345', '1234567', 'admin', 'root'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Senha muito comum. Escolha uma senha mais segura');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Verifica se o usuário está bloqueado por tentativas excessivas
   */
  isUserLockedOut(): boolean {
    // Só funciona no browser (não no servidor)
    if (typeof window === 'undefined') {
      return false;
    }
    
    const lockoutUntil = this.getSecureStorage(this.STORAGE_KEYS.LOCKOUT_UNTIL);
    if (lockoutUntil) {
      const lockoutTime = new Date(lockoutUntil);
      if (new Date() < lockoutTime) {
        return true;
      } else {
        // Remove o bloqueio expirado
        this.removeSecureStorage(this.STORAGE_KEYS.LOCKOUT_UNTIL);
      }
    }
    return false;
  }

  /**
   * Registra tentativa de login
   */
  recordLoginAttempt(email: string, success: boolean): void {
    // Só funciona no browser (não no servidor)
    if (typeof window === 'undefined') {
      return;
    }
    
    const attempts = this.getLoginAttempts();
    
    if (success) {
      // Reset contador em caso de sucesso
      this.removeSecureStorage(this.STORAGE_KEYS.LOGIN_ATTEMPTS);
      this.removeSecureStorage(this.STORAGE_KEYS.LOCKOUT_UNTIL);
      this.logSecurityEvent({
        type: 'login_success',
        userId: email,
        timestamp: new Date()
      });
    } else {
      // Incrementa tentativas falhadas
      attempts.push(new Date().toISOString());
      
      if (attempts.length >= this.SECURITY_CONFIG.maxLoginAttempts) {
        // Bloqueia usuário
        const lockoutUntil = new Date();
        lockoutUntil.setMinutes(lockoutUntil.getMinutes() + this.SECURITY_CONFIG.lockoutDuration);
        
        this.setSecureStorage(this.STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toISOString());
        
        this.logSecurityEvent({
          type: 'suspicious_activity',
          userId: email,
          timestamp: new Date(),
          details: { reason: 'max_login_attempts_exceeded', attempts: attempts.length }
        });
      }
      
      this.setSecureStorage(this.STORAGE_KEYS.LOGIN_ATTEMPTS, attempts);
      
      this.logSecurityEvent({
        type: 'login_failure',
        userId: email,
        timestamp: new Date(),
        details: { attemptNumber: attempts.length }
      });
    }
  }

  /**
   * Valida entrada de dados para prevenir XSS e injection
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Para emails, apenas remover espaços extras e caracteres perigosos
    if (input.includes('@')) {
      return input
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    }

    return input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Valida email
   */
  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254 && email.length >= 5;
  }

  /**
   * Monitora atividade da sessão
   */
  private startSessionMonitoring(): void {
    this.updateLastActivity();
    
    // Verifica timeout a cada minuto
    this.sessionTimeoutTimer = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000);
  }

  private setupActivityTracking(): void {
    // Só configura no browser (não no servidor)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Monitora atividade do usuário
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      events.forEach(event => {
        document.addEventListener(event, () => {
          this.updateLastActivity();
        }, true);
      });
    }
  }

  private updateLastActivity(): void {
    this.setSecureStorage(this.STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString());
  }

  private checkSessionTimeout(): void {
    // Só verifica no browser (não no servidor)
    if (typeof window === 'undefined') {
      return;
    }
    
    const lastActivity = this.getSecureStorage(this.STORAGE_KEYS.LAST_ACTIVITY);
    if (lastActivity) {
      const lastActivityTime = new Date(lastActivity);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60);
      
      if (diffMinutes > this.SECURITY_CONFIG.sessionTimeout) {
        this.handleSessionTimeout();
      }
    }
  }

  private handleSessionTimeout(): void {
    // Só funciona no browser (não no servidor)
    if (typeof window === 'undefined') {
      return;
    }
    
    this.logSecurityEvent({
      type: 'session_timeout',
      timestamp: new Date()
    });
    
    // Limpa dados sensíveis
    this.clearSensitiveData();
    
    // Redireciona para login
    window.location.href = '/sign-in?reason=timeout';
  }

  /**
   * Armazenamento seguro com criptografia básica
   */
  private setSecureStorage(key: string, value: any): void {
    try {
      // Só funciona no browser (não no servidor)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const encryptedValue = this.encrypt(JSON.stringify(value));
        localStorage.setItem(key, encryptedValue);
      }
    } catch (error) {
      // Erro silencioso - dados não podem ser armazenados
    }
  }

  private getSecureStorage(key: string): any {
    try {
      // Só funciona no browser (não no servidor)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const encryptedValue = localStorage.getItem(key);
        if (encryptedValue) {
          const decryptedValue = this.decrypt(encryptedValue);
          return JSON.parse(decryptedValue);
        }
      }
    } catch (error) {
      // Erro silencioso - dados não podem ser recuperados
    }
    return null;
  }

  private removeSecureStorage(key: string): void {
    // Só funciona no browser (não no servidor)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  /**
   * Criptografia básica para dados sensíveis
   */
  private encrypt(text: string): string {
    // Implementação básica - em produção usar biblioteca como crypto-js
    return btoa(text);
  }

  private decrypt(encryptedText: string): string {
    try {
      return atob(encryptedText);
    } catch (error) {
      return '';
    }
  }

  /**
   * Log de eventos de segurança
   */
  private logSecurityEvent(event: SecurityEvent): void {
    const events = this.securityEvents$.value;
    events.push(event);
    
    // Mantém apenas os últimos 100 eventos
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    this.securityEvents$.next(events);
    
    // Em produção, enviar para servidor de logs
    // Log silencioso para desenvolvimento
  }

  /**
   * Limpa dados sensíveis
   */
  clearSensitiveData(): void {
    // Só funciona no browser (não no servidor)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const keysToRemove = Object.values(this.STORAGE_KEYS);
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Remove também dados de autenticação
      localStorage.removeItem('auth-credential');
      localStorage.removeItem('user-credential');
    }
  }

  /**
   * Obtém tentativas de login
   */
  private getLoginAttempts(): string[] {
    // Só funciona no browser (não no servidor)
    if (typeof window === 'undefined') {
      return [];
    }
    
    return this.getSecureStorage(this.STORAGE_KEYS.LOGIN_ATTEMPTS) || [];
  }

  /**
   * Obtém eventos de segurança
   */
  getSecurityEvents() {
    return this.securityEvents$.asObservable();
  }

  /**
   * Destrói o serviço
   */
  ngOnDestroy(): void {
    if (this.sessionTimeoutTimer) {
      clearInterval(this.sessionTimeoutTimer);
    }
  }
}
