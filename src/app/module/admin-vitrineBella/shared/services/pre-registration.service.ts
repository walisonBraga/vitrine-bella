import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, doc, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface PreRegistration {
  id?: string; // UUID4 gerado
  firebaseDocumentId?: string; // Document ID do Firebase (mesmo que UUID4)
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
}

@Injectable({
  providedIn: 'root'
})
export class PreRegistrationService {
  private readonly collectionName = 'pre-registrations';

  constructor(private firestore: Firestore) { }

  // Criar pré-cadastro
  createPreRegistration(data: Omit<PreRegistration, 'id' | 'firebaseDocumentId' | 'createdAt' | 'updatedAt' | 'isCompleted'>): Observable<string> {
    const generatedUuid = uuidv4(); // Gerar UID4 para usar como document ID
    const preRegistration: PreRegistration = {
      ...data,
      id: generatedUuid, // UUID4 gerado
      firebaseDocumentId: generatedUuid, // Mesmo UUID4 como document ID
      createdAt: new Date(),
      updatedAt: new Date(),
      isCompleted: false
    };


    // Usar setDoc com o UUID4 como document ID ao invés de addDoc
    const docRef = doc(this.firestore, this.collectionName, generatedUuid);
    return from(setDoc(docRef, preRegistration).then(() => {
      return generatedUuid;
    }).catch((error) => {
      throw error;
    }));
  }

  // Buscar pré-cadastro por CPF
  getPreRegistrationByCpf(cpf: string): Observable<PreRegistration | null> {
    return from(
      getDocs(query(collection(this.firestore, this.collectionName), where('cpf', '==', cpf)))
        .then(snapshot => {
          if (snapshot.empty) {
            // Tentar buscar com formatação se o CPF estiver limpo
            if (cpf.length === 11 && !cpf.includes('.')) {
              const cpfFormatted = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

              return getDocs(query(collection(this.firestore, this.collectionName), where('cpf', '==', cpfFormatted)))
                .then(snapshotFormatted => {
                  if (snapshotFormatted.empty) {
                    return null;
                  }
                  const doc = snapshotFormatted.docs[0];
                  return { id: doc.id, firebaseDocumentId: doc.id, ...doc.data() } as PreRegistration;
                });
            }

            // Tentar buscar sem formatação se o CPF estiver formatado
            const cpfClean = cpf.replace(/\D/g, '');
            if (cpfClean !== cpf) {
              return getDocs(query(collection(this.firestore, this.collectionName), where('cpf', '==', cpfClean)))
                .then(snapshotClean => {
                  if (snapshotClean.empty) {
                    return null;
                  }
                  const doc = snapshotClean.docs[0];
                  return { id: doc.id, firebaseDocumentId: doc.id, ...doc.data() } as PreRegistration;
                });
            }

            return null;
          }
          const doc = snapshot.docs[0];
          return { id: doc.id, firebaseDocumentId: doc.id, ...doc.data() } as PreRegistration;
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
          return { id: doc.id, firebaseDocumentId: doc.id, ...doc.data() } as PreRegistration;
        })
    );
  }

  // Atualizar pré-cadastro por UUID (que agora é o document ID)
  updatePreRegistration(id: string, data: Partial<PreRegistration>): Observable<void> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, this.collectionName, id), updateData));
  }

  // Completar cadastro (vincular com Auth UID) por UUID
  completeRegistration(id: string, authUid: string, additionalData?: Partial<PreRegistration>): Observable<void> {
    const updateData = {
      authUid,
      isCompleted: true,
      updatedAt: new Date(),
      ...additionalData
    };
    return from(updateDoc(doc(this.firestore, this.collectionName, id), updateData));
  }


  // Listar todos os pré-cadastros
  getAllPreRegistrations(): Observable<PreRegistration[]> {
    return from(
      getDocs(collection(this.firestore, this.collectionName))
        .then(snapshot => {
          return snapshot.docs.map(doc => ({
            id: doc.id,
            firebaseDocumentId: doc.id,
            ...doc.data()
          })) as PreRegistration[];
        })
    );
  }

  // Deletar pré-cadastro por UUID
  deletePreRegistration(id: string): Observable<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    return from(deleteDoc(docRef));
  }
}
