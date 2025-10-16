import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where, limit, getDocs, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category, CategoryCreateRequest } from '../interface/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly COLLECTION_NAME = 'categories';

  constructor(private firestore: Firestore) { }

  // Criar nova categoria
  async createCategory(categoryData: CategoryCreateRequest): Promise<string> {
    try {
      const currentUser = await this.getCurrentUserId();
      const category: Omit<Category, 'id'> = {
        ...categoryData,
        isActive: categoryData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser,
        updatedBy: currentUser,
        productCount: 0
      };

      const categoryRef = await addDoc(collection(this.firestore, this.COLLECTION_NAME), category);
      return categoryRef.id;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw new Error('Erro ao criar categoria');
    }
  }

  // Buscar todas as categorias
  getCategories(): Observable<Category[]> {
    const categoriesRef = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(categoriesRef);

    return collectionData(q, { idField: 'id' }).pipe(
      map((categories: any[]) =>
        categories
          .map((category: any) => {
            return {
              ...category,
              createdAt: category?.createdAt?.toDate?.() || new Date(),
              updatedAt: category?.updatedAt?.toDate?.() || new Date()
            } as Category;
          })
          .sort((a: Category, b: Category) => a.name.localeCompare(b.name))
      )
    );
  }

  // Buscar categoria por ID
  async getCategoryById(id: string): Promise<Category | undefined> {
    try {
      const categoryRef = doc(this.firestore, this.COLLECTION_NAME, id);
      const snapshot = await getDoc(categoryRef);

      if (!snapshot.exists()) {
        return undefined;
      }
      const data = snapshot.data();
       return {
         id,
         ...data,
         createdAt: data?.['createdAt']?.toDate?.() || new Date(),
         updatedAt: data?.['updatedAt']?.toDate?.() || new Date()
       } as Category;
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      throw new Error('Erro ao buscar categoria');
    }
  }

  // Buscar categorias por nome
  async getCategoriesByName(name: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(
        categoriesRef,
        where('name', '>=', name),
        where('name', '<=', name + '\uf8ff'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
       return querySnapshot.docs.map(docSnap => {
         const data = docSnap.data();
         return {
           id: docSnap.id,
           ...data,
           createdAt: data?.['createdAt']?.toDate?.() || new Date(),
           updatedAt: data?.['updatedAt']?.toDate?.() || new Date()
         } as Category;
       });
    } catch (error) {
      console.error('Erro ao buscar categorias por nome:', error);
      throw new Error('Erro ao buscar categorias por nome');
    }
  }

  // Atualizar categoria
  async updateCategory(id: string, categoryData: Partial<Category>): Promise<void> {
    try {
      const currentUser = await this.getCurrentUserId();
      const categoryRef = doc(this.firestore, this.COLLECTION_NAME, id);

      const updateData = {
        ...categoryData,
        updatedAt: new Date(),
        updatedBy: currentUser
      };

      await updateDoc(categoryRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw new Error('Erro ao atualizar categoria');
    }
  }

  // Atualizar status da categoria
  async updateCategoryStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const currentUser = await this.getCurrentUserId();
      const categoryRef = doc(this.firestore, this.COLLECTION_NAME, id);

      await updateDoc(categoryRef, {
        isActive,
        updatedAt: new Date(),
        updatedBy: currentUser
      });
    } catch (error) {
      console.error('Erro ao atualizar status da categoria:', error);
      throw new Error('Erro ao atualizar status da categoria');
    }
  }

  // Incrementar contador de produtos
  async incrementProductCount(id: string): Promise<void> {
    try {
      const categoryRef = doc(this.firestore, this.COLLECTION_NAME, id);
      const snapshot = await getDoc(categoryRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentCount = data?.['productCount'] || 0;
        await updateDoc(categoryRef, {
          productCount: currentCount + 1,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Erro ao incrementar contador de produtos:', error);
      throw new Error('Erro ao incrementar contador de produtos');
    }
  }

  // Decrementar contador de produtos
  async decrementProductCount(id: string): Promise<void> {
    try {
      const categoryRef = doc(this.firestore, this.COLLECTION_NAME, id);
      const snapshot = await getDoc(categoryRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentCount = data?.['productCount'] || 0;
        const newCount = Math.max(0, currentCount - 1);
        await updateDoc(categoryRef, {
          productCount: newCount,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Erro ao decrementar contador de produtos:', error);
      throw new Error('Erro ao decrementar contador de produtos');
    }
  }

  // Deletar categoria
  async deleteCategory(id: string): Promise<void> {
    try {
      const categoryRef = doc(this.firestore, this.COLLECTION_NAME, id);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      throw new Error('Erro ao deletar categoria');
    }
  }

  // Buscar categorias ativas
  getActiveCategories(): Observable<Category[]> {
    const categoriesRef = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(categoriesRef, where('isActive', '==', true));

    return collectionData(q, { idField: 'id' }).pipe(
      map((categories: any[]) =>
        categories
          .map((category: any) => {
            return {
              ...category,
              createdAt: category?.createdAt?.toDate?.() || new Date(),
              updatedAt: category?.updatedAt?.toDate?.() || new Date()
            } as Category;
          })
          .sort((a: Category, b: Category) => a.name.localeCompare(b.name))
      )
    );
  }

  // Verificar se nome da categoria já existe
  async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
    try {
      const categoriesRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(categoriesRef, where('name', '==', name.trim().toLowerCase()));

      const querySnapshot = await getDocs(q);

      if (excludeId) {
        return !querySnapshot.docs.some(docSnap => docSnap.id !== excludeId);
      }

      return querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar unicidade do nome:', error);
      return false;
    }
  }

  // Obter ID do usuário atual (implementar conforme sua lógica de autenticação)
  private async getCurrentUserId(): Promise<string> {
    // Implementar lógica para obter o ID do usuário atual
    // Por enquanto, retorna um ID temporário
    return 'current-user-id';
  }
}
