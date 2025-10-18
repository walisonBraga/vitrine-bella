import { Injectable, Optional } from '@angular/core';
import { Firestore, doc, deleteDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserDeletionService {

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    @Optional() private functions?: Functions
  ) { }

  /**
   * Exclui um usuário completamente (Firestore + Firebase Authentication)
   * Usa Cloud Function para exclusão do Authentication se disponível
   */
  async deleteUserCompletely(uid: string): Promise<void> {
    try {
      // 1. Excluir do Firestore primeiro
      await deleteDoc(doc(this.firestore, 'users', uid));
      console.log(`✅ Usuário ${uid} excluído do Firestore`);

      // 2. Tentar excluir do Firebase Authentication via Cloud Function
      if (this.functions) {
        try {
          const deleteUserFunction = httpsCallable(this.functions, 'deleteUser');
          await deleteUserFunction({ uid });
          console.log(`✅ Usuário ${uid} excluído do Firebase Authentication`);
        } catch (functionError) {
          console.warn('⚠️ Cloud Function falhou, apenas Firestore foi excluído');
        }
      } else {
        console.warn('⚠️ Firebase Functions não configurado');
        console.warn('📝 Para exclusão completa, configure Cloud Functions ou exclua manualmente do Firebase Console');
        console.warn('🔗 Acesse: Firebase Console > Authentication > Users');
      }

    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      throw new Error(`Falha ao excluir usuário: ${error}`);
    }
  }

  /**
   * Exclui múltiplos usuários completamente
   */
  async deleteUsersCompletely(uids: string[]): Promise<void> {
    try {
      const results = await Promise.allSettled(
        uids.map(uid => this.deleteUserCompletely(uid))
      );

      // Verificar se houve falhas
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`${failures.length} usuários falharam na exclusão:`, failures);
        throw new Error(`${failures.length} usuários falharam na exclusão`);
      }

      console.log(`${uids.length} usuários excluídos com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir usuários:', error);
      throw new Error(`Falha ao excluir usuários: ${error}`);
    }
  }

  /**
   * Exclui apenas do Firestore (sem Authentication)
   * Útil para casos onde o usuário já foi excluído do Authentication
   */
  async deleteUserFromFirestore(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'users', uid));
      console.log(`Usuário ${uid} excluído do Firestore`);
    } catch (error) {
      console.error('Erro ao excluir usuário do Firestore:', error);
      throw new Error(`Falha ao excluir usuário do Firestore: ${error}`);
    }
  }
}
