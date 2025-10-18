// Cloud Function para excluir usuários do Firebase Authentication
// Este arquivo deve ser colocado em: functions/src/index.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Inicializar o Admin SDK
admin.initializeApp();

/**
 * Cloud Function para excluir usuário do Firebase Authentication
 * Chamada via HTTPS Callable Function
 */
export const deleteUser = functions.https.onCall(async (data, context) => {
  try {
    // Verificar se o usuário está autenticado e é admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    // Verificar se o usuário tem permissão de admin
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.userRole || !['admin', 'store_owner'].includes(userData.userRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Usuário não tem permissão para excluir outros usuários');
    }

    const { uid } = data;
    
    if (!uid) {
      throw new functions.https.HttpsError('invalid-argument', 'UID do usuário é obrigatório');
    }

    // Excluir do Firebase Authentication
    await admin.auth().deleteUser(uid);
    
    console.log(`Usuário ${uid} excluído do Firebase Authentication`);
    
    return { success: true, message: `Usuário ${uid} excluído com sucesso` };
    
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw new functions.https.HttpsError('internal', `Erro interno: ${error}`);
  }
});

/**
 * Cloud Function para excluir múltiplos usuários
 */
export const deleteUsers = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação e permissões
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.userRole || !['admin', 'store_owner'].includes(userData.userRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Usuário não tem permissão para excluir outros usuários');
    }

    const { uids } = data;
    
    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Lista de UIDs é obrigatória');
    }

    const results = await Promise.allSettled(
      uids.map(uid => admin.auth().deleteUser(uid))
    );

    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      console.warn(`${failures.length} usuários falharam na exclusão:`, failures);
      return { 
        success: false, 
        message: `${failures.length} usuários falharam na exclusão`,
        failures: failures.length
      };
    }

    console.log(`${uids.length} usuários excluídos com sucesso`);
    return { success: true, message: `${uids.length} usuários excluídos com sucesso` };
    
  } catch (error) {
    console.error('Erro ao excluir usuários:', error);
    throw new functions.https.HttpsError('internal', `Erro interno: ${error}`);
  }
});
