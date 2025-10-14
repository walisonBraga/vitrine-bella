import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { collection, doc, Firestore, getDocs, query, setDoc, where } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Constante para chave de localStorage
const LOCAL_STORAGE_KEY = 'auth-credential';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user: User | null = null;

  private _currentUserSubject = new BehaviorSubject<any | null>(null);
  currentUser$ = this._currentUserSubject.asObservable();

  constructor(
    private _firestore: Firestore,
    private _afAuth: Auth
  ) {
    this._loadInitialUser();
  }

  private _setLocalStorage(key: string, data: any): void {
    if (this._isLocalStorageAvailable()) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  private _getLocalStorage(key: string): any {
    if (this._isLocalStorageAvailable()) {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    return null; // Retorna null se localStorage não estiver disponível
  }

  async updateUserData(uid: string): Promise<void> {
    const userInfo = await this.getUserInfo(uid);
    if (userInfo) {
      this._setLocalStorage('user-credential', userInfo);
    }
  }

  private _isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false; // localStorage não está disponível
    }
  }

  async signIn(email: string, password: string): Promise<User | null> {
    try {
      const result = await signInWithEmailAndPassword(this._afAuth, email, password);
      const user = result.user;
      const userDoc = await this.getUserInfo(user.uid);
      if (userDoc && userDoc['accessCode']) {
        this._setLocalStorage(LOCAL_STORAGE_KEY, userDoc); // Armazena o userDoc ao invés de user
        this.user = userDoc; // Atualiza this.user com userDoc
        return userDoc; // Retorna o userDoc
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async createUser(email: string, password: string): Promise<{ user: User }> {
    try {
      const result = await createUserWithEmailAndPassword(this._afAuth, email, password);
      const user = result.user;
      return { user };
    } catch (error) {
      throw error;
    }
  }

  async saveUserInfo(userData: any) {
    const userRef = doc(this._firestore, 'users', userData.uid);
    return await setDoc(userRef, userData);
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this._afAuth);
      this.user = null;
      if (this._isLocalStorageAvailable()) {
        localStorage.clear();
      }
    } catch (error) {
      return
    }
  }

  getCurrentUser(): any | null {
    return this._getLocalStorage('user-credential'); // Retorna os dados do usuário armazenados
  }


  async getUserInfo(uid: string): Promise<any | null> {
    try {
      const userQuery = query(collection(this._firestore, 'users'), where("uid", "==", uid));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        delete userData['password']; // Remove a senha antes de armazenar
        this._setLocalStorage('user-credential', userData); // Atualiza o localStorage
        this._currentUserSubject.next(userData); // Propaga os dados atualizados
        return userData;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async getUserManagementRoutes(uid: string): Promise<string[]> {
    try {
      const userQuery = query(collection(this._firestore, 'users'), where("uid", "==", uid));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();

        // Supondo que as rotas estão armazenadas no campo 'managementType' como array
        const managementRoutes = userData['managementType'] || [];

        return managementRoutes; // Retorna as rotas diretamente
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  private async _loadInitialUser() {
    const storedUser = this._getLocalStorage('user-credential');
    if (storedUser) {
      this._currentUserSubject.next(storedUser);

      // Busca as informações mais recentes do Firestore
      const updatedUser = await this.getUserInfo(storedUser.uid);
      if (updatedUser) {
        this._currentUserSubject.next(updatedUser); // Atualiza o BehaviorSubject
      }
    }
  }
}
