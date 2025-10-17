import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { Product } from '../../module/admin-vitrineBella/products/interface/products';

export interface StockNotification {
  id?: string;
  productId: string;
  productName: string;
  email: string;
  createdAt: Date;
  notified: boolean;
  notifiedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StockNotificationService {
  private firestore = inject(Firestore);

  // Observable para contagem de produtos com estoque baixo
  private lowStockCountSubject = new BehaviorSubject<number>(0);
  public lowStockCount$ = this.lowStockCountSubject.asObservable();

  // Cadastrar email para notificação
  async subscribeToStockNotification(productId: string, productName: string, email: string): Promise<void> {
    try {
      // Verificar se já existe uma notificação para este email e produto
      const existingQuery = query(
        collection(this.firestore, 'stockNotifications'),
        where('productId', '==', productId),
        where('email', '==', email),
        where('notified', '==', false)
      );

      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        throw new Error('Você já está cadastrado para receber notificações deste produto');
      }

      // Criar nova notificação
      const notification: Omit<StockNotification, 'id'> = {
        productId,
        productName,
        email,
        createdAt: new Date(),
        notified: false
      };

      await addDoc(collection(this.firestore, 'stockNotifications'), notification);
    } catch (error) {
      throw error;
    }
  }

  // Marcar notificações como enviadas
  async markNotificationsAsSent(productId: string): Promise<void> {
    try {
      const q = query(
        collection(this.firestore, 'stockNotifications'),
        where('productId', '==', productId),
        where('notified', '==', false)
      );

      const querySnapshot = await getDocs(q);

      const updatePromises = querySnapshot.docs.map(docSnapshot => {
        return updateDoc(docSnapshot.ref, {
          notified: true,
          notifiedAt: new Date()
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      throw error;
    }
  }

  // Buscar notificações pendentes para um produto
  async getPendingNotifications(productId: string): Promise<StockNotification[]> {
    try {
      const q = query(
        collection(this.firestore, 'stockNotifications'),
        where('productId', '==', productId),
        where('notified', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StockNotification));
    } catch (error) {
      return [];
    }
  }

  // Métodos para controle de estoque (usados pelo product-table)
  isProductOutOfStock(product: Product): boolean {
    return !product || product.stock <= 0;
  }

  isProductLowStock(product: Product): boolean {
    return product ? product.stock > 0 && product.stock <= 10 : false;
  }

  isProductCriticalStock(product: Product): boolean {
    return product ? product.stock > 0 && product.stock <= 3 : false;
  }

  getProductAlertLevel(product: Product): 'low' | 'critical' | 'out' | 'normal' {
    if (!product) return 'out';

    if (product.stock <= 0) {
      return 'out';
    } else if (product.stock <= 3) {
      return 'critical';
    } else if (product.stock <= 10) {
      return 'low';
    } else {
      return 'normal';
    }
  }

  getAlertClass(level: 'low' | 'critical' | 'out' | 'normal'): string {
    switch (level) {
      case 'normal':
        return 'stock-normal';
      case 'low':
        return 'stock-low';
      case 'critical':
        return 'stock-critical';
      case 'out':
        return 'stock-out';
      default:
        return 'stock-out';
    }
  }

  getAlertIcon(level: 'low' | 'critical' | 'out' | 'normal'): string {
    switch (level) {
      case 'normal':
        return 'check_circle';
      case 'low':
        return 'warning';
      case 'critical':
        return 'error';
      case 'out':
        return 'cancel';
      default:
        return 'cancel';
    }
  }

  getAlertColor(level: 'low' | 'critical' | 'out' | 'normal'): string {
    switch (level) {
      case 'normal':
        return '#4caf50';
      case 'low':
        return '#ff9800';
      case 'critical':
        return '#f44336';
      case 'out':
        return '#d32f2f';
      default:
        return '#d32f2f';
    }
  }

  // Analisar níveis de estoque de uma lista de produtos
  analyzeStockLevels(products: Product[]): void {
    if (!products) return;

    let lowStockCount = 0;
    let criticalStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(product => {
      const level = this.getProductAlertLevel(product);
      switch (level) {
        case 'low':
          lowStockCount++;
          break;
        case 'critical':
          criticalStockCount++;
          break;
        case 'out':
          outOfStockCount++;
          break;
      }
    });

    // Atualizar contagem total de produtos com problemas de estoque
    const totalProblematicStock = lowStockCount + criticalStockCount + outOfStockCount;
    this.updateLowStockCount(totalProblematicStock);
  }

  // Atualizar contagem de produtos com estoque baixo
  updateLowStockCount(count: number): void {
    this.lowStockCountSubject.next(count);
  }
}
