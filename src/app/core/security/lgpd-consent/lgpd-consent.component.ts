import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LGPDComplianceService } from '../../security/lgpd-compliance.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-lgpd-consent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lgpd-consent-overlay" *ngIf="showConsent">
      <div class="lgpd-consent-modal">
        <div class="lgpd-header">
          <h3>Política de Privacidade e Proteção de Dados</h3>
          <p>Conforme a Lei Geral de Proteção de Dados (LGPD)</p>
        </div>
        
        <div class="lgpd-content">
          <p>Para continuar usando nossos serviços, precisamos do seu consentimento para o processamento de seus dados pessoais.</p>
          
          <div class="consent-options">
            <div class="consent-item">
              <label class="consent-label">
                <input type="checkbox" [(ngModel)]="consents.necessary" disabled checked>
                <span class="checkmark"></span>
                <strong>Dados Necessários</strong>
                <small>Obrigatório para funcionamento do serviço</small>
              </label>
            </div>
            
            <div class="consent-item">
              <label class="consent-label">
                <input type="checkbox" [(ngModel)]="consents.marketing">
                <span class="checkmark"></span>
                <strong>Marketing e Comunicações</strong>
                <small>Envio de ofertas e novidades</small>
              </label>
            </div>
            
            <div class="consent-item">
              <label class="consent-label">
                <input type="checkbox" [(ngModel)]="consents.analytics">
                <span class="checkmark"></span>
                <strong>Análise e Melhorias</strong>
                <small>Coleta de dados para melhorar nossos serviços</small>
              </label>
            </div>
          </div>
          
          <div class="lgpd-info">
            <h4>Seus Direitos:</h4>
            <ul>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incorretos</li>
              <li>Exclusão dos seus dados</li>
              <li>Portabilidade dos dados</li>
              <li>Revogação do consentimento</li>
            </ul>
          </div>
        </div>
        
        <div class="lgpd-actions">
          <button type="button" class="btn btn-secondary" (click)="rejectAll()">
            Rejeitar Todos
          </button>
          <button type="button" class="btn btn-primary" (click)="acceptConsents()">
            Aceitar Selecionados
          </button>
        </div>
        
        <div class="lgpd-footer">
          <small>
            Ao continuar, você concorda com nossa 
            <a href="/privacy-policy" target="_blank">Política de Privacidade</a> e 
            <a href="/terms-of-service" target="_blank">Termos de Uso</a>
          </small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lgpd-consent-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lgpd-consent-modal {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .lgpd-header {
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e0e0e0;
      text-align: center;
    }

    .lgpd-header h3 {
      margin: 0 0 8px;
      color: #333;
      font-size: 1.5rem;
    }

    .lgpd-header p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .lgpd-content {
      padding: 24px;
    }

    .lgpd-content p {
      margin-bottom: 20px;
      color: #555;
      line-height: 1.5;
    }

    .consent-options {
      margin-bottom: 24px;
    }

    .consent-item {
      margin-bottom: 16px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    .consent-label {
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      margin: 0;
    }

    .consent-label input[type="checkbox"] {
      margin-right: 12px;
      margin-top: 2px;
    }

    .consent-label strong {
      display: block;
      margin-bottom: 4px;
      color: #333;
    }

    .consent-label small {
      color: #666;
      font-size: 0.85rem;
    }

    .lgpd-info {
      background-color: #f0f8ff;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }

    .lgpd-info h4 {
      margin: 0 0 12px;
      color: #007bff;
      font-size: 1rem;
    }

    .lgpd-info ul {
      margin: 0;
      padding-left: 20px;
    }

    .lgpd-info li {
      margin-bottom: 4px;
      color: #555;
      font-size: 0.9rem;
    }

    .lgpd-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .lgpd-footer {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      background-color: #f8f9fa;
    }

    .lgpd-footer small {
      color: #666;
      font-size: 0.8rem;
    }

    .lgpd-footer a {
      color: #007bff;
      text-decoration: none;
    }

    .lgpd-footer a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .lgpd-consent-modal {
        width: 95%;
        margin: 20px;
      }
      
      .lgpd-actions {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
      }
    }
  `]
})
export class LGPDConsentComponent implements OnInit {
  showConsent = false;
  consents = {
    necessary: true,
    marketing: false,
    analytics: false
  };

  constructor(
    private lgpdService: LGPDComplianceService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    // Verifica se já existe consentimento
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const hasConsent = await this.lgpdService.hasConsent(currentUser.uid, 'all');
      if (!hasConsent) {
        this.showConsent = true;
      }
    }
  }

  async acceptConsents() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      try {
        // Registra consentimentos individuais
        await this.lgpdService.recordConsent(
          currentUser.uid, 
          'necessary', 
          this.consents.necessary
        );
        
        if (this.consents.marketing) {
          await this.lgpdService.recordConsent(
            currentUser.uid, 
            'marketing', 
            true
          );
        }
        
        if (this.consents.analytics) {
          await this.lgpdService.recordConsent(
            currentUser.uid, 
            'analytics', 
            true
          );
        }

        // Registra consentimento geral
        await this.lgpdService.recordConsent(
          currentUser.uid, 
          'all', 
          true
        );

        this.showConsent = false;
      } catch (error) {
        console.error('Erro ao registrar consentimento:', error);
        alert('Erro ao registrar consentimento. Tente novamente.');
      }
    }
  }

  async rejectAll() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      try {
        // Registra apenas consentimento necessário
        await this.lgpdService.recordConsent(
          currentUser.uid, 
          'necessary', 
          true
        );
        
        await this.lgpdService.recordConsent(
          currentUser.uid, 
          'marketing', 
          false
        );
        
        await this.lgpdService.recordConsent(
          currentUser.uid, 
          'analytics', 
          false
        );

        this.showConsent = false;
      } catch (error) {
        console.error('Erro ao registrar consentimento:', error);
        alert('Erro ao registrar consentimento. Tente novamente.');
      }
    }
  }
}
