import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

export interface PreRegistration {
  id?: string;
  cpf: string;
  email: string;
  phone: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  gender?: string;
  createdAt: Date;
  updatedAt: Date;
  isCompleted: boolean;
  authUid?: string; // UID do Firebase Auth quando completar o cadastro
  sales?: Array<{
    saleId: string;
    date: Date;
    amount: number;
    items: any[];
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class PreRegistrationService {
  private readonly collectionName = 'pre-registrations';

  constructor(private firestore: Firestore) { }

  // Criar pré-cadastro
  createPreRegistration(data: Omit<PreRegistration, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'sales'>): Observable<string> {
    const preRegistration: PreRegistration = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      isCompleted: false,
      sales: []
    };

    return from(addDoc(collection(this.firestore, this.collectionName), preRegistration).then(doc => doc.id));
  }

  // Buscar pré-cadastro por CPF
  getPreRegistrationByCpf(cpf: string): Observable<PreRegistration | null> {
    return from(
      getDocs(query(collection(this.firestore, this.collectionName), where('cpf', '==', cpf)))
        .then(snapshot => {
          if (snapshot.empty) return null;
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() } as PreRegistration;
        })
    );
  }

  // Buscar pré-cadastro por email
  getPreRegistrationByEmail(email: string): Observable<PreRegistration | null> {
    return from(
      getDocs(query(collection(this.firestore, this.collectionName), where('email', '==', email)))
        .then(snapshot => {
          if (snapshot.empty) return null;
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() } as PreRegistration;
        })
    );
  }

  // Atualizar pré-cadastro
  updatePreRegistration(id: string, data: Partial<PreRegistration>): Observable<void> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, this.collectionName, id), updateData));
  }

  // Completar cadastro (vincular com Auth UID)
  completeRegistration(id: string, authUid: string, additionalData?: Partial<PreRegistration>): Observable<void> {
    const updateData = {
      authUid,
      isCompleted: true,
      updatedAt: new Date(),
      ...additionalData
    };
    return from(updateDoc(doc(this.firestore, this.collectionName, id), updateData));
  }

  // Adicionar venda ao histórico
  addSaleToHistory(cpf: string, saleData: any): Observable<void> {
    return new Observable(observer => {
      this.getPreRegistrationByCpf(cpf).subscribe({
        next: (preReg) => {
          if (preReg && preReg.id) {
            const updatedSales = [...(preReg.sales || []), saleData];
            this.updatePreRegistration(preReg.id, { sales: updatedSales }).subscribe({
              next: () => observer.next(),
              error: (error) => observer.error(error)
            });
          } else {
            observer.next();
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // Buscar histórico de vendas
  getSalesHistory(cpf: string): Observable<any[]> {
    return new Observable(observer => {
      this.getPreRegistrationByCpf(cpf).subscribe({
        next: (preReg) => {
          observer.next(preReg?.sales || []);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // Listar todos os pré-cadastros
  getAllPreRegistrations(): Observable<PreRegistration[]> {
    return from(
      getDocs(collection(this.firestore, this.collectionName))
        .then(snapshot => {
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as PreRegistration[];
        })
    );
  }

  // Deletar pré-cadastro
  deletePreRegistration(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.collectionName, id)));
  }
}
