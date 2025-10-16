import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, query, where, getDocs, documentId } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Sale, SaleForm, SaleItem } from '../interface/sales';
import { Product } from '../../products/interface/products';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private salesCollection = collection(this.firestore, 'sales');

  constructor(private firestore: Firestore) { }

  // Criar nova venda
  createSale(saleForm: SaleForm, userId: string): Promise<string> {
    const saleData: Sale = {
      id: '', // Será gerado pelo Firestore
      customerName: saleForm.customerName,
      customerEmail: saleForm.customerEmail,
      customerPhone: saleForm.customerPhone,
      items: saleForm.items,
      totalAmount: this.calculateTotal(saleForm.items),
      discount: saleForm.discount || 0,
      finalAmount: this.calculateFinalAmount(saleForm.items, saleForm.discount || 0),
      paymentMethod: saleForm.paymentMethod,
      status: 'completed',
      createdAt: new Date().toISOString(),
      userId: userId
    };

    return addDoc(this.salesCollection, saleData).then(docRef => {
      // Atualizar estoque dos produtos vendidos
      this.updateProductStock(saleForm.items);
      return docRef.id;
    });
  }

  // Buscar todas as vendas
  getSales(): Observable<Sale[]> {
    return collectionData(this.salesCollection, { idField: 'id' }) as Observable<Sale[]>;
  }

  // Buscar vendas por período
  getSalesByDateRange(startDate: string, endDate: string): Observable<Sale[]> {
    const q = query(this.salesCollection,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Sale[]>;
  }

  // Buscar vendas por vendedor
  getSalesByUser(userId: string): Observable<Sale[]> {
    const q = query(this.salesCollection, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Sale[]>;
  }

  // Buscar venda por ID
  getSaleById(saleId: string): Observable<Sale | undefined> {
    const q = query(this.salesCollection, where('id', '==', saleId));
    const promise = getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as Sale;
        return { ...data, id: snapshot.docs[0].id };
      }
      return undefined;
    });
    return from(promise);
  }

  // Cancelar venda
  cancelSale(saleId: string): Promise<void> {
    const docRef = doc(this.firestore, `sales/${saleId}`);
    return updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    });
  }

  // Calcular total dos itens
  private calculateTotal(items: SaleItem[]): number {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }

  // Calcular valor final com desconto
  private calculateFinalAmount(items: SaleItem[], discount: number): number {
    const total = this.calculateTotal(items);
    return total - discount;
  }

  // Atualizar estoque dos produtos
  private async updateProductStock(items: SaleItem[]): Promise<void> {
    const productCollection = collection(this.firestore, 'products');

    for (const item of items) {
      try {

        // Tentar buscar pelo document ID primeiro
        let productDocRef;
        let productData;

        try {
          // Primeiro, tentar buscar diretamente pelo document ID
          productDocRef = doc(productCollection, item.productId);
          const directDoc = await getDocs(query(productCollection, where(documentId(), '==', item.productId)));

          if (!directDoc.empty) {
            productData = directDoc.docs[0].data();
            productDocRef = directDoc.docs[0].ref;
          } else {
            // Se não encontrar, buscar pelo campo 'id'
            const productSnapshot = await getDocs(query(productCollection, where('id', '==', item.productId)));
            if (!productSnapshot.empty) {
              productData = productSnapshot.docs[0].data();
              productDocRef = productSnapshot.docs[0].ref;
            }
          }
        } catch (error) {
          // Erro ao buscar produto
        }

        if (productData) {
          const currentStock = productData['stock'] || 0;
          const newStock = Math.max(0, currentStock - item.quantity);


          // Atualizar o estoque somente se productDocRef estiver definido
          if (productDocRef) {
            await updateDoc(productDocRef, {
              stock: newStock,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        // Erro ao atualizar estoque
      }
    }
  }

  // Buscar produtos para venda
  getProductsForSale(): Observable<Product[]> {
    const q = query(
      collection(this.firestore, 'products'),
      where('isActive', '==', true),
      where('stock', '>', 0)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  // Gerar relatório de vendas
  generateSalesReport(startDate: string, endDate: string): Observable<any> {
    const q = query(
      this.salesCollection,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      where('status', '==', 'completed')
    );
    return collectionData(q, { idField: 'id' }) as Observable<any>;
  }
}
