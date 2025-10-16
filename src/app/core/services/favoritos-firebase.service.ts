import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface Favorito {
  id?: string;
  userId: string;
  accessCode: string;
  productId: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritosFirebaseService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private readonly COLLECTION_NAME = 'favoritos';

  private favoritosSubject = new BehaviorSubject<Favorito[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();

  constructor() {
    this.loadFavoritos();
  }

  private loadFavoritos(): void {
    authState(this.auth).pipe(
      switchMap(user => {
        if (user) {
          return this.getFavoritosByUser(user.uid);
        } else {
          return new Observable<Favorito[]>(observer => observer.next([]));
        }
      })
    ).subscribe(favoritos => {
      this.favoritosSubject.next(favoritos);
    });
  }

  // Buscar favoritos do usuário logado
  getFavoritosByUser(userId: string): Observable<Favorito[]> {
    const favoritosRef = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(favoritosRef, where('userId', '==', userId));

    return collectionData(q, { idField: 'id' }).pipe(
      map((favoritos: any[]) =>
        favoritos.map(favorito => ({
          ...favorito,
          createdAt: favorito.createdAt?.toDate?.() || new Date()
        } as Favorito))
      )
    );
  }

  // Verificar se produto está nos favoritos
  isFavorito(userId: string, productId: string): Observable<boolean> {
    return this.getFavoritosByUser(userId).pipe(
      map(favoritos => favoritos.some(f => f.productId === productId))
    );
  }

  // Adicionar produto aos favoritos
  async adicionarFavorito(productId: string, accessCode: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Usuário não está logado');
    }

    try {
      // Verificar se já existe
      const favoritosRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(
        favoritosRef,
        where('userId', '==', user.uid),
        where('productId', '==', productId)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('Produto já está nos favoritos');
      }

      // Adicionar aos favoritos
      const novoFavorito: Omit<Favorito, 'id'> = {
        userId: user.uid,
        accessCode: accessCode,
        productId: productId,
        createdAt: new Date()
      };

      await addDoc(collection(this.firestore, this.COLLECTION_NAME), novoFavorito);

      // Recarregar favoritos
      this.loadFavoritos();
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      throw error;
    }
  }

  // Remover produto dos favoritos
  async removerFavorito(productId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Usuário não está logado');
    }

    try {
      const favoritosRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(
        favoritosRef,
        where('userId', '==', user.uid),
        where('productId', '==', productId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Produto não está nos favoritos');
      }

      // Remover o favorito
      const favoritoDoc = querySnapshot.docs[0];
      await deleteDoc(doc(this.firestore, this.COLLECTION_NAME, favoritoDoc.id));

      // Recarregar favoritos
      this.loadFavoritos();
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      throw error;
    }
  }

  // Toggle favorito (adicionar se não existe, remover se existe)
  async toggleFavorito(productId: string, accessCode: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Usuário não está logado');
    }

    try {
      // Verificar se já existe
      const favoritosRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(
        favoritosRef,
        where('userId', '==', user.uid),
        where('productId', '==', productId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Adicionar aos favoritos
        await this.adicionarFavorito(productId, accessCode);
      } else {
        // Remover dos favoritos
        await this.removerFavorito(productId);
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      throw error;
    }
  }

  // Obter IDs dos produtos favoritos
  getFavoritosIds(): string[] {
    return this.favoritosSubject.value.map(f => f.productId);
  }

  // Obter contagem de favoritos
  getFavoritosCount(): number {
    return this.favoritosSubject.value.length;
  }

  // Observable do contador de favoritos
  getFavoritosCount$(): Observable<number> {
    return this.favoritos$.pipe(
      map(favoritos => favoritos.length)
    );
  }

  // Verificar se usuário está logado
  isUserLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  // Observable do status de autenticação
  getAuthState$(): Observable<any> {
    return authState(this.auth);
  }
}
