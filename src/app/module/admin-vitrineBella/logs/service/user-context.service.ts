import { Injectable } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  constructor(private authService: AuthService) { }

  getCurrentUserInfo(): { userId: string; userName: string } {
    const user = this.authService.getCurrentUser();
    return {
      userId: user?.uid || 'unknown',
      userName: user?.displayName || user?.email || 'Usuário Desconhecido'
    };
  }

  getClientInfo(): { ipAddress?: string; userAgent?: string } {
    return {
      userAgent: navigator.userAgent,
      // IP address seria obtido de um serviço externo em produção
    };
  }
}
