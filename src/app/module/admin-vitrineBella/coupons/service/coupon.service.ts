import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where, limit, getDocs, runTransaction, writeBatch, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Coupon, CouponCreateRequest } from '../interface/coupon';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private readonly COLLECTION_NAME = 'coupons';

  constructor(private firestore: Firestore) {}

  // ===== CRUD OPERATIONS =====

  /**
   * Criar novo cupom
   */
  async createCoupon(couponData: CouponCreateRequest): Promise<string> {
    try {
      const coupon: Coupon = {
        ...couponData,
        isActive: true,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: await this.getCurrentUserId()
      };

      const couponsCollection = collection(this.firestore, this.COLLECTION_NAME);
      const docRef = await addDoc(couponsCollection, coupon);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      throw new Error('Falha ao criar cupom');
    }
  }

  /**
   * Buscar todos os cupons
   */
  getCoupons(): Observable<Coupon[]> {
    const couponsCollection = collection(this.firestore, this.COLLECTION_NAME);
    return collectionData(couponsCollection, { idField: 'id' }) as Observable<Coupon[]>;
  }

  /**
   * Buscar cupom por ID
   */
  getCouponById(id: string): Observable<Coupon | undefined> {
    const couponDoc = doc(this.firestore, this.COLLECTION_NAME, id);
    return docData(couponDoc, { idField: 'id' }) as Observable<Coupon>;
  }

  /**
   * Buscar cupom por código
   */
  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    try {
      const couponsCollection = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(couponsCollection, where('code', '==', code), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Coupon;
      }
      return undefined;
    } catch (error) {
      console.error('Erro ao buscar cupom por código:', error);
      return undefined;
    }
  }

  /**
   * Atualizar cupom
   */
  async updateCoupon(id: string, couponData: Partial<Coupon>): Promise<void> {
    try {
      const updateData = {
        ...couponData,
        updatedAt: new Date().toISOString()
      };

      const couponDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await updateDoc(couponDoc, updateData);
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      throw new Error('Falha ao atualizar cupom');
    }
  }

  /**
   * Atualizar status do cupom (ativo/inativo)
   */
  async updateCouponStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const couponDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await updateDoc(couponDoc, {
        isActive,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao atualizar status do cupom:', error);
      throw new Error('Falha ao atualizar status do cupom');
    }
  }

  /**
   * Incrementar contador de uso do cupom
   */
  async incrementCouponUsage(id: string): Promise<void> {
    try {
      const couponDoc = doc(this.firestore, this.COLLECTION_NAME, id);

      await runTransaction(this.firestore, async (transaction) => {
        const couponSnapshot = await transaction.get(couponDoc);

        if (couponSnapshot.exists()) {
          const currentCount = couponSnapshot.data()?.['usedCount'] || 0;
          transaction.update(couponDoc, {
            usedCount: currentCount + 1,
            updatedAt: new Date().toISOString()
          });
        }
      });
    } catch (error) {
      console.error('Erro ao incrementar uso do cupom:', error);
      throw new Error('Falha ao incrementar uso do cupom');
    }
  }

  /**
   * Excluir cupom
   */
  async deleteCoupon(id: string): Promise<void> {
    try {
      const couponDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await deleteDoc(couponDoc);
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      throw new Error('Falha ao excluir cupom');
    }
  }

  // ===== VALIDAÇÃO DE CUPONS =====

  /**
   * Validar se cupom é válido para uso
   */
  async validateCoupon(code: string): Promise<{ isValid: boolean; coupon?: Coupon; message?: string }> {
    try {
      const coupon = await this.getCouponByCode(code);

      if (!coupon) {
        return { isValid: false, message: 'Cupom não encontrado' };
      }

      if (!coupon.isActive) {
        return { isValid: false, message: 'Cupom está inativo' };
      }

      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = new Date(coupon.validUntil);

      if (now < validFrom) {
        return { isValid: false, message: 'Cupom ainda não é válido' };
      }

      if (now > validUntil) {
        return { isValid: false, message: 'Cupom expirado' };
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { isValid: false, message: 'Limite de uso do cupom atingido' };
      }

      return { isValid: true, coupon };
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      return { isValid: false, message: 'Erro ao validar cupom' };
    }
  }

  // ===== BUSCA E FILTROS =====

  /**
   * Buscar cupons por status
   */
  getCouponsByStatus(isActive: boolean): Observable<Coupon[]> {
    const couponsCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(couponsCollection, where('isActive', '==', isActive));
    return collectionData(q, { idField: 'id' }) as Observable<Coupon[]>;
  }

  /**
   * Buscar cupons válidos (ativos e dentro do período)
   */
  getValidCoupons(): Observable<Coupon[]> {
    const now = new Date().toISOString();

    const couponsCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      couponsCollection,
      where('isActive', '==', true),
      where('validFrom', '<=', now),
      where('validUntil', '>=', now)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Coupon[]>;
  }

  // ===== UTILITÁRIOS =====

  /**
   * Gerar código único de cupom
   */
  async generateUniqueCouponCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = this.generateCouponCode();

      try {
      const existingCoupon = await this.getCouponByCode(code);

        if (!existingCoupon) {
          isUnique = true;
        }
      } catch (error) {
        console.error('Erro ao verificar código único:', error);
      }

      attempts++;
    }

    if (!isUnique) {
      throw new Error('Não foi possível gerar um código único para o cupom');
    }

    return code!;
  }

  /**
   * Gerar código de cupom aleatório
   */
  private generateCouponCode(): string {
    const prefix = 'CUPOM';
    const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const randomLetters = Math.random().toString(36).substring(2, 4).toUpperCase();

    return `${prefix}${randomNumber}${randomLetters}`;
  }

  /**
   * Obter ID do usuário atual (implementar conforme sua autenticação)
   */
  private async getCurrentUserId(): Promise<string> {
    // Implementar conforme seu sistema de autenticação
    // Por exemplo, se usando AngularFireAuth:
    // const user = await this.auth.currentUser;
    // return user?.uid || 'anonymous';

    // Por enquanto, retorna um valor padrão
    return 'admin@vitrine.com';
  }

  /**
   * Verificar se código já existe
   */
  async isCodeUnique(code: string): Promise<boolean> {
    try {
      const existingCoupon = await this.getCouponByCode(code);
      return !existingCoupon;
    } catch (error) {
      console.error('Erro ao verificar código único:', error);
      return false;
    }
  }
}
