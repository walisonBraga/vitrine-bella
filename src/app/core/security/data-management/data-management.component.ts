import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { DataSubjectRequest, LGPDComplianceService } from '../lgpd-compliance.service';

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="data-management-container">
      <div class="header">
        <h2>Gerenciamento de Dados Pessoais</h2>
        <p>Conforme a Lei Geral de Proteção de Dados (LGPD)</p>
      </div>

      <div class="data-rights">
        <h3>Seus Direitos</h3>
        <div class="rights-grid">
          <div class="right-card">
            <h4>👁️ Acesso</h4>
            <p>Visualizar todos os seus dados pessoais</p>
            <button class="btn btn-outline" (click)="requestDataAccess()">
              Solicitar Acesso
            </button>
          </div>
          
          <div class="right-card">
            <h4>✏️ Correção</h4>
            <p>Corrigir dados incorretos ou incompletos</p>
            <button class="btn btn-outline" (click)="requestDataRectification()">
              Solicitar Correção
            </button>
          </div>
          
          <div class="right-card">
            <h4>🗑️ Exclusão</h4>
            <p>Excluir seus dados pessoais</p>
            <button class="btn btn-danger" (click)="requestDataErasure()">
              Solicitar Exclusão
            </button>
          </div>
          
          <div class="right-card">
            <h4>📦 Portabilidade</h4>
            <p>Exportar seus dados em formato portável</p>
            <button class="btn btn-outline" (click)="requestDataPortability()">
              Solicitar Exportação
            </button>
          </div>
        </div>
      </div>

      <div class="consent-management">
        <h3>Gerenciamento de Consentimentos</h3>
        <div class="consent-list">
          <div class="consent-item" *ngFor="let consent of userConsents">
            <div class="consent-info">
              <h4>{{ getConsentTypeName(consent.consentType) }}</h4>
              <p>{{ getConsentDescription(consent.consentType) }}</p>
              <small>Consentido em: {{ formatDate(consent.timestamp) }}</small>
            </div>
            <div class="consent-status">
              <span class="status-badge" [class.active]="consent.granted" [class.inactive]="!consent.granted">
                {{ consent.granted ? 'Ativo' : 'Inativo' }}
              </span>
              <button 
                class="btn btn-sm" 
                [class.btn-danger]="consent.granted" 
                [class.btn-success]="!consent.granted"
                (click)="toggleConsent(consent.consentType, !consent.granted)"
                [disabled]="consent.consentType === 'necessary'">
                {{ consent.granted ? 'Revogar' : 'Ativar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="requests-history" *ngIf="userRequests.length > 0">
        <h3>Histórico de Solicitações</h3>
        <div class="requests-list">
          <div class="request-item" *ngFor="let request of userRequests">
            <div class="request-info">
              <h4>{{ getRequestTypeName(request.requestType) }}</h4>
              <p>Solicitado em: {{ formatDate(request.requestedAt) }}</p>
              <p *ngIf="request.processedAt">Processado em: {{ formatDate(request.processedAt) }}</p>
            </div>
            <div class="request-status">
              <span class="status-badge" [class]="'status-' + request.status">
                {{ getStatusName(request.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="data-report" *ngIf="dataReport">
        <h3>Relatório de Dados</h3>
        <div class="report-content">
          <div class="report-section">
            <h4>Dados Pessoais</h4>
            <pre>{{ formatDataReport(dataReport.personalData) }}</pre>
          </div>
          
          <div class="report-section">
            <h4>Histórico de Consentimentos</h4>
            <pre>{{ formatDataReport(dataReport.consentHistory) }}</pre>
          </div>
          
          <div class="report-section">
            <h4>Registros de Processamento</h4>
            <pre>{{ formatDataReport(dataReport.dataProcessingRecords) }}</pre>
          </div>
        </div>
        
        <div class="report-actions">
          <button class="btn btn-primary" (click)="downloadReport()">
            Baixar Relatório
          </button>
          <button class="btn btn-secondary" (click)="closeReport()">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-management-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .header h2 {
      color: #333;
      margin-bottom: 8px;
    }

    .header p {
      color: #666;
      font-size: 1.1rem;
    }

    .data-rights {
      margin-bottom: 40px;
    }

    .data-rights h3 {
      color: #333;
      margin-bottom: 20px;
      border-bottom: 2px solid #007bff;
      padding-bottom: 8px;
    }

    .rights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .right-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .right-card:hover {
      transform: translateY(-2px);
    }

    .right-card h4 {
      margin: 0 0 12px;
      color: #333;
      font-size: 1.2rem;
    }

    .right-card p {
      margin: 0 0 20px;
      color: #666;
      line-height: 1.5;
    }

    .consent-management {
      margin-bottom: 40px;
    }

    .consent-management h3 {
      color: #333;
      margin-bottom: 20px;
      border-bottom: 2px solid #28a745;
      padding-bottom: 8px;
    }

    .consent-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .consent-item {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .consent-info h4 {
      margin: 0 0 8px;
      color: #333;
    }

    .consent-info p {
      margin: 0 0 4px;
      color: #666;
    }

    .consent-info small {
      color: #999;
      font-size: 0.85rem;
    }

    .consent-status {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .status-badge.active {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.inactive {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-badge.status-pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-badge.status-processing {
      background-color: #cce5ff;
      color: #004085;
    }

    .status-badge.status-completed {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.status-rejected {
      background-color: #f8d7da;
      color: #721c24;
    }

    .requests-history {
      margin-bottom: 40px;
    }

    .requests-history h3 {
      color: #333;
      margin-bottom: 20px;
      border-bottom: 2px solid #ffc107;
      padding-bottom: 8px;
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .request-item {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .request-info h4 {
      margin: 0 0 8px;
      color: #333;
    }

    .request-info p {
      margin: 0 0 4px;
      color: #666;
      font-size: 0.9rem;
    }

    .data-report {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 40px;
    }

    .data-report h3 {
      color: #333;
      margin-bottom: 20px;
      border-bottom: 2px solid #6f42c1;
      padding-bottom: 8px;
    }

    .report-content {
      margin-bottom: 24px;
    }

    .report-section {
      margin-bottom: 20px;
    }

    .report-section h4 {
      color: #333;
      margin-bottom: 12px;
    }

    .report-section pre {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 16px;
      overflow-x: auto;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .report-actions {
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

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .btn-outline {
      background-color: transparent;
      color: #007bff;
      border: 1px solid #007bff;
    }

    .btn-outline:hover {
      background-color: #007bff;
      color: white;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }

    .btn-success {
      background-color: #28a745;
      color: white;
    }

    .btn-success:hover {
      background-color: #218838;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
    }

    @media (max-width: 768px) {
      .data-management-container {
        padding: 16px;
      }
      
      .rights-grid {
        grid-template-columns: 1fr;
      }
      
      .consent-item,
      .request-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      
      .consent-status,
      .request-status {
        align-self: flex-end;
      }
      
      .report-actions {
        flex-direction: column;
      }
    }
  `]
})
export class DataManagementComponent implements OnInit {
  userConsents: any[] = [];
  userRequests: DataSubjectRequest[] = [];
  dataReport: any = null;

  constructor(
    private lgpdService: LGPDComplianceService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    await this.loadUserData();
  }

  private async loadUserData() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Carrega consentimentos do usuário
      // Implementar carregamento de consentimentos

      // Carrega histórico de solicitações
      // Implementar carregamento de solicitações
    }
  }

  async requestDataAccess() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      try {
        const request = await this.lgpdService.processDataSubjectRequest(
          currentUser.uid,
          'access'
        );

        // Gera relatório de dados
        this.dataReport = await this.lgpdService.generateUserDataReport(currentUser.uid);

        alert('Solicitação de acesso processada com sucesso!');
      } catch (error) {
        console.error('Erro ao solicitar acesso:', error);
        alert('Erro ao processar solicitação. Tente novamente.');
      }
    }
  }

  async requestDataRectification() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      try {
        await this.lgpdService.processDataSubjectRequest(
          currentUser.uid,
          'rectification'
        );
        alert('Solicitação de correção enviada com sucesso!');
      } catch (error) {
        console.error('Erro ao solicitar correção:', error);
        alert('Erro ao processar solicitação. Tente novamente.');
      }
    }
  }

  async requestDataErasure() {
    if (confirm('Tem certeza que deseja excluir todos os seus dados? Esta ação não pode ser desfeita.')) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        try {
          await this.lgpdService.processDataSubjectRequest(
            currentUser.uid,
            'erasure'
          );
          alert('Solicitação de exclusão enviada com sucesso!');
        } catch (error) {
          console.error('Erro ao solicitar exclusão:', error);
          alert('Erro ao processar solicitação. Tente novamente.');
        }
      }
    }
  }

  async requestDataPortability() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      try {
        await this.lgpdService.processDataSubjectRequest(
          currentUser.uid,
          'portability'
        );
        alert('Solicitação de portabilidade enviada com sucesso!');
      } catch (error) {
        console.error('Erro ao solicitar portabilidade:', error);
        alert('Erro ao processar solicitação. Tente novamente.');
      }
    }
  }

  async toggleConsent(consentType: string, granted: boolean) {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      try {
        await this.lgpdService.recordConsent(
          currentUser.uid,
          consentType as any,
          granted
        );

        // Recarrega dados
        await this.loadUserData();

        alert(`Consentimento ${granted ? 'ativado' : 'revogado'} com sucesso!`);
      } catch (error) {
        console.error('Erro ao alterar consentimento:', error);
        alert('Erro ao alterar consentimento. Tente novamente.');
      }
    }
  }

  downloadReport() {
    if (this.dataReport) {
      const dataStr = JSON.stringify(this.dataReport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-dados-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
    }
  }

  closeReport() {
    this.dataReport = null;
  }

  getConsentTypeName(type: string): string {
    const names: { [key: string]: string } = {
      'necessary': 'Dados Necessários',
      'marketing': 'Marketing',
      'analytics': 'Análise',
      'all': 'Todos os Dados'
    };
    return names[type] || type;
  }

  getConsentDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'necessary': 'Dados obrigatórios para funcionamento do serviço',
      'marketing': 'Comunicações promocionais e ofertas',
      'analytics': 'Coleta de dados para melhorias',
      'all': 'Todos os tipos de processamento'
    };
    return descriptions[type] || '';
  }

  getRequestTypeName(type: string): string {
    const names: { [key: string]: string } = {
      'access': 'Acesso aos Dados',
      'rectification': 'Correção de Dados',
      'erasure': 'Exclusão de Dados',
      'portability': 'Portabilidade de Dados',
      'restriction': 'Restrição de Processamento'
    };
    return names[type] || type;
  }

  getStatusName(status: string): string {
    const names: { [key: string]: string } = {
      'pending': 'Pendente',
      'processing': 'Processando',
      'completed': 'Concluído',
      'rejected': 'Rejeitado'
    };
    return names[status] || status;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDataReport(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}
