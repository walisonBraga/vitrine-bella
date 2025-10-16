import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../../module/admin-vitrineBella/products/interface/products';

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  alertLevel: 'low' | 'critical' | 'out';
}

@Injectable({
  providedIn: 'root'
})
export class StockNotificationService {
  private readonly MIN_STOCK_LEVEL = 10; // Nível mínimo de estoque
  private readonly CRITICAL_STOCK_LEVEL = 5; // Nível crítico de estoque

  private stockAlertsSubject = new BehaviorSubject<StockAlert[]>([]);
  private lowStockCountSubject = new BehaviorSubject<number>(0);

  public stockAlerts$ = this.stockAlertsSubject.asObservable();
  public lowStockCount$ = this.lowStockCountSubject.asObservable();

  constructor() {}

  /**
   * Analisa produtos e gera alertas de estoque baixo
   */
  analyzeStockLevels(products: Product[]): void {
    const alerts: StockAlert[] = [];

    products.forEach(product => {
      if (product.stock <= 0) {
        alerts.push({
          productId: product.id,
          productName: product.productName,
          currentStock: product.stock,
          minStockLevel: this.MIN_STOCK_LEVEL,
          alertLevel: 'out'
        });
      } else if (product.stock <= this.CRITICAL_STOCK_LEVEL) {
        alerts.push({
          productId: product.id,
          productName: product.productName,
          currentStock: product.stock,
          minStockLevel: this.MIN_STOCK_LEVEL,
          alertLevel: 'critical'
        });
      } else if (product.stock <= this.MIN_STOCK_LEVEL) {
        alerts.push({
          productId: product.id,
          productName: product.productName,
          currentStock: product.stock,
          minStockLevel: this.MIN_STOCK_LEVEL,
          alertLevel: 'low'
        });
      }
    });

    this.stockAlertsSubject.next(alerts);
    this.lowStockCountSubject.next(alerts.length);
  }

  /**
   * Retorna os alertas atuais
   */
  getCurrentAlerts(): StockAlert[] {
    return this.stockAlertsSubject.value;
  }

  /**
   * Retorna o número de produtos com estoque baixo
   */
  getLowStockCount(): number {
    return this.lowStockCountSubject.value;
  }

  /**
   * Retorna alertas por nível
   */
  getAlertsByLevel(level: 'low' | 'critical' | 'out'): StockAlert[] {
    return this.getCurrentAlerts().filter(alert => alert.alertLevel === level);
  }

  /**
   * Verifica se um produto específico tem estoque baixo
   */
  isProductLowStock(product: Product): boolean {
    return product.stock <= this.MIN_STOCK_LEVEL;
  }

  /**
   * Verifica se um produto específico tem estoque crítico
   */
  isProductCriticalStock(product: Product): boolean {
    return product.stock <= this.CRITICAL_STOCK_LEVEL;
  }

  /**
   * Verifica se um produto está sem estoque
   */
  isProductOutOfStock(product: Product): boolean {
    return product.stock <= 0;
  }

  /**
   * Retorna o nível de alerta para um produto
   */
  getProductAlertLevel(product: Product): 'low' | 'critical' | 'out' | 'normal' {
    if (this.isProductOutOfStock(product)) return 'out';
    if (this.isProductCriticalStock(product)) return 'critical';
    if (this.isProductLowStock(product)) return 'low';
    return 'normal';
  }

  /**
   * Retorna a classe CSS para o nível de alerta
   */
  getAlertClass(level: 'low' | 'critical' | 'out' | 'normal'): string {
    switch (level) {
      case 'out':
        return 'stock-out';
      case 'critical':
        return 'stock-critical';
      case 'low':
        return 'stock-low';
      default:
        return 'stock-normal';
    }
  }

  /**
   * Retorna o ícone para o nível de alerta
   */
  getAlertIcon(level: 'low' | 'critical' | 'out' | 'normal'): string {
    switch (level) {
      case 'out':
        return 'error';
      case 'critical':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'check_circle';
    }
  }

  /**
   * Retorna a cor para o nível de alerta
   */
  getAlertColor(level: 'low' | 'critical' | 'out' | 'normal'): string {
    switch (level) {
      case 'out':
        return '#f44336'; // Vermelho
      case 'critical':
        return '#ff9800'; // Laranja
      case 'low':
        return '#ffeb3b'; // Amarelo
      default:
        return '#4caf50'; // Verde
    }
  }

  /**
   * Limpa todos os alertas
   */
  clearAlerts(): void {
    this.stockAlertsSubject.next([]);
    this.lowStockCountSubject.next(0);
  }
}
