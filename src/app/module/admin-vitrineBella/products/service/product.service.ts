import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { Product } from '../interface/products';
import { map, Observable } from 'rxjs';
import { Storage, ref, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsCollection = collection(this.firestore, 'products');

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) { }

  async createProduct(product: Product): Promise<void> {
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
    } catch (error) {
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

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const updatedData: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      // Remove any undefined or null fields
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] === undefined || updatedData[key] === null) {
          delete updatedData[key];
        }
      });
      if (Object.keys(updatedData).length === 0) {
        return; // No updates to apply
      }
      const productDocRef = doc(this.firestore, 'products', id);
      await updateDoc(productDocRef, updatedData);
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      // Primeiro, buscar o produto para obter a URL da imagem
      const product = await this.getProductById(id);

      // Excluir a imagem do Storage se existir
      if (product.imageUrl && !product.imageUrl.includes('icon-sem-perfil')) {
        try {
          const imageRef = ref(this.storage, product.imageUrl);
          await deleteObject(imageRef);
        } catch (imageError) {
          // Continua a exclusão mesmo se não conseguir excluir a imagem
        }
      }

      // Excluir o documento do produto do Firestore
      const productDocRef = doc(this.firestore, 'products', id);
      await deleteDoc(productDocRef);
    } catch (error) {
      throw error;
    }
  }

  async deleteProductImages(imageUrls: string[]): Promise<void> {
    try {
      const deletePromises = imageUrls.map(async (imageUrl) => {
        const imageRef = ref(this.storage, imageUrl);
        await deleteObject(imageRef).catch(error => {
        });
      });
      await Promise.all(deletePromises);
    } catch (error) {
      throw error;
    }
  }

  searchProducts(term: string): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products =>
        products.filter(p =>
          p.productName.toLowerCase().includes(term.toLowerCase()) ||
          p.description.toLowerCase().includes(term.toLowerCase()) ||
          p.category.toLowerCase().includes(term.toLowerCase())
        )
      )
    );
  }
}
