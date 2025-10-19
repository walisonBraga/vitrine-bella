import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDocs, query, where, deleteDoc, setDoc, updateDoc } from '@angular/fire/firestore';

export interface LGPDConsent {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'necessary' | 'all';
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  version: string; // versão da política de privacidade
}

export interface DataProcessingRecord {
  userId: string;
  dataType: 'personal' | 'sensitive' | 'behavioral';
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interest';
  retentionPeriod: number; // em dias
  createdAt: Date;
  lastAccessed?: Date;
  accessedBy?: string;
}

export interface DataSubjectRequest {
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  response?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LGPDComplianceService {
  private readonly CONSENT_VERSION = '1.0';
  private readonly DEFAULT_RETENTION_PERIOD = 365; // 1 ano

  constructor(private firestore: Firestore) { }

  /**
   * Registra consentimento do usuário
   */
  async recordConsent(
    userId: string,
    consentType: LGPDConsent['consentType'],
    granted: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const consent: LGPDConsent = {
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      version: this.CONSENT_VERSION
    };

    try {
      const consentRef = doc(this.firestore, 'lgpd_consents', `${userId}_${consentType}`);
      await setDoc(consentRef, consent);
    } catch (error) {
      // Erro silencioso - consentimento não pode ser registrado
      throw error;
    }
  }

  /**
   * Verifica se usuário deu consentimento
   */
  async hasConsent(userId: string, consentType: LGPDConsent['consentType']): Promise<boolean> {
    try {
      const consentQuery = query(
        collection(this.firestore, 'lgpd_consents'),
        where('userId', '==', userId),
        where('consentType', '==', consentType),
        where('granted', '==', true)
      );

      const snapshot = await getDocs(consentQuery);
      return !snapshot.empty;
    } catch (error) {
      // Erro silencioso - consentimento não pode ser verificado
      return false;
    }
  }

  /**
   * Registra processamento de dados pessoais
   */
  async recordDataProcessing(
    userId: string,
    dataType: DataProcessingRecord['dataType'],
    purpose: string,
    legalBasis: DataProcessingRecord['legalBasis'],
    retentionPeriod?: number
  ): Promise<void> {
    const record: DataProcessingRecord = {
      userId,
      dataType,
      purpose,
      legalBasis,
      retentionPeriod: retentionPeriod || this.DEFAULT_RETENTION_PERIOD,
      createdAt: new Date()
    };

    try {
      const recordRef = doc(this.firestore, 'data_processing_records', `${userId}_${Date.now()}`);
      await setDoc(recordRef, record);
    } catch (error) {
      // Erro silencioso - processamento não pode ser registrado
      throw error;
    }
  }

  /**
   * Registra acesso a dados pessoais
   */
  async recordDataAccess(
    userId: string,
    dataType: DataProcessingRecord['dataType'],
    accessedBy: string
  ): Promise<void> {
    try {
      const accessQuery = query(
        collection(this.firestore, 'data_processing_records'),
        where('userId', '==', userId),
        where('dataType', '==', dataType)
      );

      const snapshot = await getDocs(accessQuery);

      if (!snapshot.empty) {
        const recordRef = snapshot.docs[0].ref;
        await updateDoc(recordRef, {
          lastAccessed: new Date(),
          accessedBy
        });
      }
    } catch (error) {
      // Erro silencioso - acesso não pode ser registrado
    }
  }

  /**
   * Processa solicitação do titular dos dados
   */
  async processDataSubjectRequest(
    userId: string,
    requestType: DataSubjectRequest['requestType']
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      userId,
      requestType,
      status: 'pending',
      requestedAt: new Date()
    };

    try {
      const requestRef = doc(this.firestore, 'data_subject_requests', `${userId}_${Date.now()}`);
      await setDoc(requestRef, request);

      // Processa automaticamente algumas solicitações
      switch (requestType) {
        case 'access':
          await this.handleDataAccessRequest(userId);
          break;
        case 'erasure':
          await this.handleDataErasureRequest(userId);
          break;
        case 'portability':
          await this.handleDataPortabilityRequest(userId);
          break;
      }

      return request;
    } catch (error) {
      // Erro silencioso - solicitação não pode ser processada
      throw error;
    }
  }

  /**
   * Remove dados pessoais do usuário (direito ao esquecimento)
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      // Remove dados de usuário
      const userQuery = query(
        collection(this.firestore, 'users'),
        where('uid', '==', userId)
      );
      const userSnapshot = await getDocs(userQuery);

      for (const docSnapshot of userSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }

      // Remove consentimentos
      const consentQuery = query(
        collection(this.firestore, 'lgpd_consents'),
        where('userId', '==', userId)
      );
      const consentSnapshot = await getDocs(consentQuery);

      for (const docSnapshot of consentSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }

      // Remove registros de processamento
      const processingQuery = query(
        collection(this.firestore, 'data_processing_records'),
        where('userId', '==', userId)
      );
      const processingSnapshot = await getDocs(processingQuery);

      for (const docSnapshot of processingSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }

      // Remove solicitações
      const requestQuery = query(
        collection(this.firestore, 'data_subject_requests'),
        where('userId', '==', userId)
      );
      const requestSnapshot = await getDocs(requestQuery);

      for (const docSnapshot of requestSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }

    } catch (error) {
      // Erro silencioso - dados não podem ser deletados
      throw error;
    }
  }

  /**
   * Gera relatório de dados do usuário
   */
  async generateUserDataReport(userId: string): Promise<any> {
    try {
      const report: any = {
        userId,
        generatedAt: new Date(),
        personalData: [] as any[],
        consentHistory: [] as any[],
        dataProcessingRecords: [] as any[],
        dataSubjectRequests: [] as any[]
      };

      // Coleta dados pessoais
      const userQuery = query(
        collection(this.firestore, 'users'),
        where('uid', '==', userId)
      );
      const userSnapshot = await getDocs(userQuery);
      report.personalData = userSnapshot.docs.map(doc => doc.data());

      // Coleta histórico de consentimentos
      const consentQuery = query(
        collection(this.firestore, 'lgpd_consents'),
        where('userId', '==', userId)
      );
      const consentSnapshot = await getDocs(consentQuery);
      report.consentHistory = consentSnapshot.docs.map(doc => doc.data());

      // Coleta registros de processamento
      const processingQuery = query(
        collection(this.firestore, 'data_processing_records'),
        where('userId', '==', userId)
      );
      const processingSnapshot = await getDocs(processingQuery);
      report.dataProcessingRecords = processingSnapshot.docs.map(doc => doc.data());

      // Coleta solicitações
      const requestQuery = query(
        collection(this.firestore, 'data_subject_requests'),
        where('userId', '==', userId)
      );
      const requestSnapshot = await getDocs(requestQuery);
      report.dataSubjectRequests = requestSnapshot.docs.map(doc => doc.data());

      return report;
    } catch (error) {
      // Erro silencioso - relatório não pode ser gerado
      throw error;
    }
  }

  /**
   * Verifica se dados devem ser removidos por expiração
   */
  async checkDataRetention(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.DEFAULT_RETENTION_PERIOD);

      const expiredQuery = query(
        collection(this.firestore, 'data_processing_records'),
        where('createdAt', '<', cutoffDate)
      );

      const snapshot = await getDocs(expiredQuery);

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as any;
        await this.deleteUserData(data.userId);
      }
    } catch (error) {
      // Erro silencioso - retenção não pode ser verificada
    }
  }

  private async handleDataAccessRequest(userId: string): Promise<void> {
    // Implementar lógica para fornecer acesso aos dados
    // Processamento silencioso de solicitação de acesso
  }

  private async handleDataErasureRequest(userId: string): Promise<void> {
    await this.deleteUserData(userId);
  }

  private async handleDataPortabilityRequest(userId: string): Promise<void> {
    // Implementar lógica para exportar dados em formato portável
    // Processamento silencioso de solicitação de portabilidade
  }

  /**
   * Valida se dados pessoais podem ser processados
   */
  async canProcessPersonalData(
    userId: string,
    purpose: string,
    dataType: DataProcessingRecord['dataType']
  ): Promise<boolean> {
    // Verifica se é necessário para funcionamento do serviço
    if (dataType === 'personal' && purpose === 'authentication') {
      return true;
    }

    // Verifica consentimento para outros tipos
    return await this.hasConsent(userId, 'all');
  }
}
