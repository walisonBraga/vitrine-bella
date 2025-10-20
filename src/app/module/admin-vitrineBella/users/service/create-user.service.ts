import { Injectable } from '@angular/core';
import { collection, doc, Firestore, getDocs, setDoc, query, where, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { createUsersAdmin } from '../interface/createUsersAdmin';

@Injectable({
  providedIn: 'root'
})
export class CreateUserService {
  private usersCollection = collection(this._firestore, 'users');

  constructor(private _firestore: Firestore) {}

  // Cria um novo usuário no Firestore
  async createUser(createUserData: createUsersAdmin): Promise<void> {
    const userId = createUserData.uid;
    // Remove a senha do objeto antes de armazená-lo
    const { password, ...userWithoutPassword } = createUserData;
    try {
      const userDocRef = doc(this._firestore, `users/${userId}`);
      await setDoc(userDocRef, userWithoutPassword);
    } catch (error) {
      throw error;
    }
  }

  // Busca todos os usuários
  getUsers(): Observable<createUsersAdmin[]> {
    return from(getDocs(this.usersCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data() as createUsersAdmin))
    );
  }

  // Busca usuários por função (role), default para store_employee, store_manager, store_owner e admin
  getUsersByRole(roles: string[] = ['store_employee', 'store_manager', 'store_owner', 'admin']): Observable<createUsersAdmin[]> {
    const q = query(this.usersCollection, where('role', 'in', roles));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data() as createUsersAdmin))
    );
  }

  // Busca um usuário específico por UID
  getUserById(uid: string): Observable<createUsersAdmin | null> {
    const q = query(this.usersCollection, where('uid', '==', uid));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.empty ? null : snapshot.docs[0].data() as createUsersAdmin)
    );
  }

  // Atualiza dados gerais do usuário (edição de perfil)
  updateUser(uid: string, updates: Partial<createUsersAdmin>): Observable<void> {
    const userDocRef = doc(this._firestore, `users/${uid}`);
    return from(updateDoc(userDocRef, updates));
  }

  // Atualiza o status do usuário
  updateUserStatus(uid: string, isActive: boolean): Observable<void> {
    const userDocRef = doc(this._firestore, `users/${uid}`);
    return from(updateDoc(userDocRef, { isActive }));
  }

  // Exclui um usuário
  deleteUser(uid: string): Observable<void> {
    const userDocRef = doc(this._firestore, `users/${uid}`);
    return from(deleteDoc(userDocRef));
  }
}
