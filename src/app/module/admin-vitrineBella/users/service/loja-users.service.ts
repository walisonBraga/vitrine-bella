import { Injectable } from '@angular/core';
import { Firestore, collection, query, getDocs, where, deleteDoc, doc, updateDoc, addDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserDeletionService } from './user-deletion.service';
import { Observable, from, map } from 'rxjs';
import { LojaUser } from '../interface/loja-user.interface';

@Injectable({
  providedIn: 'root'
})
export class LojaUsersService {

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private userDeletionService: UserDeletionService
  ) { }

  /**
   * Busca todos os usuários que têm acesso à loja
   */
  getLojaUsers(): Observable<LojaUser[]> {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection, where('redirectRoute', 'array-contains', '/loja'));

    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        const users: LojaUser[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as any;
          if (Array.isArray(userData.redirectRoute) && userData.redirectRoute.includes('/loja')) {
            users.push({
              uid: doc.id,
              fullName: userData.fullName || '',
              email: userData.email || '',
              cpf: userData.cpf || '',
              phone: userData.phone || '',
              role: userData.role || 'loja',
              userRole: userData.userRole || 'cliente',
              accessCode: userData.accessCode || '',
              isActive: userData.isActive !== false,
              redirectRoute: userData.redirectRoute || ['/loja'],
              photoURL: userData.photoURL || '',
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              salesHistory: userData.salesHistory || []
            });
          }
        });
        return users;
      })
    );
  }

  /**
   * Busca todos os usuários (incluindo clientes)
   */
  getAllUsers(): Observable<LojaUser[]> {
    const usersCollection = collection(this.firestore, 'users');

    return from(getDocs(usersCollection)).pipe(
      map(querySnapshot => {
        const users: LojaUser[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as any;
          users.push({
            uid: doc.id,
            fullName: userData.fullName || '',
            email: userData.email || '',
            cpf: userData.cpf || '',
            phone: userData.phone || '',
            role: userData.role || 'cliente',
            userRole: userData.userRole || 'cliente',
            accessCode: userData.accessCode || '',
            isActive: userData.isActive !== false,
            redirectRoute: userData.redirectRoute || [],
            photoURL: userData.photoURL || '',
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
            salesHistory: userData.salesHistory || []
          });
        });
        return users;
      })
    );
  }

  /**
   * Busca usuários por tipo específico
   */
  getUsersByRole(userRole: string): Observable<LojaUser[]> {
    return this.getLojaUsers().pipe(
      map(users => users.filter(user => user.userRole === userRole))
    );
  }

  /**
   * Ativa ou desativa um usuário
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, {
      isActive: isActive,
      updatedAt: new Date()
    });
  }

  /**
   * Exclui um usuário (Firestore + Firebase Authentication)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.userDeletionService.deleteUserCompletely(userId);
      console.log(`Usuário ${userId} excluído com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw new Error(`Falha ao excluir usuário: ${error}`);
    }
  }

  /**
   * Ativa múltiplos usuários
   */
  async activateUsers(userIds: string[]): Promise<void> {
    const updatePromises = userIds.map(id =>
      updateDoc(doc(this.firestore, 'users', id), {
        isActive: true,
        updatedAt: new Date()
      })
    );
    await Promise.all(updatePromises);
  }

  /**
   * Desativa múltiplos usuários
   */
  async deactivateUsers(userIds: string[]): Promise<void> {
    const updatePromises = userIds.map(id =>
      updateDoc(doc(this.firestore, 'users', id), {
        isActive: false,
        updatedAt: new Date()
      })
    );
    await Promise.all(updatePromises);
  }

  /**
   * Exclui múltiplos usuários (Firestore + Firebase Authentication)
   */
  async deleteUsers(userIds: string[]): Promise<void> {
    try {
      await this.userDeletionService.deleteUsersCompletely(userIds);
      console.log(`${userIds.length} usuários excluídos com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir usuários:', error);
      throw new Error(`Falha ao excluir usuários: ${error}`);
    }
  }

  /**
   * Cria um novo usuário da loja
   */
  async createLojaUser(userData: Partial<LojaUser>): Promise<string> {
    const usersCollection = collection(this.firestore, 'users');
    const docRef = await addDoc(usersCollection, {
      ...userData,
      redirectRoute: ['/loja'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });
    return docRef.id;
  }

  /**
   * Atualiza dados de um usuário
   */
  async updateUser(userId: string, userData: Partial<LojaUser>): Promise<void> {
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date()
    });
  }

  /**
   * Busca estatísticas dos usuários da loja
   */
  getLojaUsersStats(): Observable<{
    total: number;
    admins: number;
    storeOwners: number;
    storeEmployees: number;
    clientes: number;
    active: number;
    inactive: number;
  }> {
    return this.getLojaUsers().pipe(
      map(users => ({
        total: users.length,
        admins: users.filter(u => u.userRole === 'admin').length,
        storeOwners: users.filter(u => u.userRole === 'store_owner').length,
        storeEmployees: users.filter(u => u.userRole === 'store_employee').length,
        clientes: users.filter(u => u.userRole === 'cliente').length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
      }))
    );
  }
}
