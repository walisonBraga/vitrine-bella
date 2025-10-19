import { Injectable } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { SecurityService } from './security.service';

export const securityInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<any> => {
  const securityService = new SecurityService();
  const MAX_RETRIES = 3;

  // Adiciona headers de segurança
  const secureReq = req.clone({
    setHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    }
  });

  return next(secureReq).pipe(
    retry(MAX_RETRIES),
    catchError((error: HttpErrorResponse) => {
      handleHttpError(error, req, securityService);
      return throwError(() => error);
    })
  );
};

function handleHttpError(error: HttpErrorResponse, req: HttpRequest<any>, securityService: SecurityService): void {
  // Log de segurança para erros HTTP
  securityService['logSecurityEvent']({
    type: 'suspicious_activity',
    timestamp: new Date(),
    details: {
      error: error.message,
      status: error.status,
      url: req.url,
      method: req.method
    }
  });

    // Tratamento específico para diferentes tipos de erro
    // Logs silenciosos para diferentes tipos de erro HTTP
    switch (error.status) {
      case 401:
        // Não autorizado - pode ser tentativa de acesso não autorizado
        break;
      case 403:
        // Proibido - acesso negado
        break;
      case 429:
        // Muitas requisições - possível ataque de força bruta
        break;
      case 500:
        // Erro interno do servidor
        break;
    }
}
