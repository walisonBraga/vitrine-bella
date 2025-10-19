import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { Product } from '../interface/products';
import { map, Observable } from 'rxjs';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { LogService } from '../../logs/service/log.service';
import { UserContextService } from '../../logs/service/user-context.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsCollection = collection(this.firestore, 'products');

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private logService: LogService,
    private userContextService: UserContextService
  ) { }

  async createProduct(product: Product): Promise<void> {
    const userInfo = this.userContextService.getCurrentUserInfo();
    const clientInfo = this.userContextService.getClientInfo();
    
    try {
      const productWithTimestamp: any = {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Remove any undefined or null fields
      Object.keys(productWithTimestamp).forEach(key => {
        if (productWithTimestamp[key] === undefined || productWithTimestamp[key] === null) {
          delete productWithTimestamp[key];
        }
      });
      
      await addDoc(this.productsCollection, productWithTimestamp);
      
      // Log da ação de criação
      this.logService.addLog({
        userId: userInfo.userId,
        userName: userInfo.userName,
        action: 'create',
        entity: 'product',
        entityName: product.name,
        details: `Produto "${product.name}" criado com sucesso`,
        status: 'success',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      
    } catch (error) {
      // Log do erro
      this.logService.addLog({
        userId: userInfo.userId,
        userName: userInfo.userName,
        action: 'create',
        entity: 'product',
        entityName: product.name,
        details: `Erro ao criar produto "${product.name}": ${error}`,
        status: 'error',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      
      throw error;
    }
  }

  getProducts(): Observable<Product[]> {
    return collectionData(this.productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const productDocRef = doc(this.firestore, 'products', id);
      const productDoc = await getDoc(productDocRef);
      if (productDoc.exists()) {
        const data = productDoc.data();
        return { id: productDoc.id, ...data } as Product;
      } else {
        throw new Error('Produto não encontrado');
      }
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    const userInfo = this.userContextService.getCurrentUserInfo();
    const clientInfo = this.userContextService.getClientInfo();
    
    try {
      const productDocRef = doc(this.firestore, 'products', id);
      const productWithTimestamp = {
        ...product,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(productDocRef, productWithTimestamp);
      
      // Log da ação de atualização
      this.logService.addLog({
        userId: userInfo.userId,
        userName: userInfo.userName,
        action: 'update',
        entity: 'product',
        entityId: id,
        entityName: product.name || 'Produto',
        details: `Produto "${product.name || id}" atualizado com sucesso`,
        status: 'success',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      
    } catch (error) {
      // Log do erro
      this.logService.addLog({
        userId: userInfo.userId,
        userName: userInfo.userName,
        action: 'update',
        entity: 'product',
        entityId: id,
        entityName: product.name || 'Produto',
        details: `Erro ao atualizar produto "${product.name || id}": ${error}`,
        status: 'error',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const userInfo = this.userContextService.getCurrentUserInfo();
    const clientInfo = this.userContextService.getClientInfo();
    
    try {
      // Primeiro, obter informações do produto para o log
      const product = await this.getProductById(id);
      
      const productDocRef = doc(this.firestore, 'products', id);
      await deleteDoc(productDocRef);
      
      // Deletar imagens do storage se existirem
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          try {
            const imageRef = ref(this.storage, imageUrl);
            await deleteObject(imageRef);
          } catch (storageError) {
            console.warn('Erro ao deletar imagem do storage:', storageError);
          }
        }
      }
      
      // Log da ação de exclusão
      this.logService.addLog({
        userId: userInfo.userId,
        userName: userInfo.userName,
        action: 'delete',
        entity: 'product',
        entityId: id,
        entityName: product.name,
        details: `Produto "${product.name}" excluído com sucesso`,
        status: 'success',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      
    } catch (error) {
      // Log do erro
      this.logService.addLog({
        userId: userInfo.userId,
        userName: userInfo.userName,
        action: 'delete',
        entity: 'product',
        entityId: id,
        entityName: 'Produto',
        details: `Erro ao excluir produto "${id}": ${error}`,
        status: 'error',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      
      throw error;
    }
  }

  // Método para obter produtos por categoria
  getProductsByCategory(categoryId: string): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products => products.filter(product => product.categoryId === categoryId))
    );
  }

  // Método para buscar produtos
  searchProducts(searchTerm: string): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products => products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }
}
