import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Slide } from '../interface/slide';
import { addDoc, collection, collectionData, deleteDoc, doc, docData, Firestore, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class SlideService {

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  // Buscar todos os slides
  getSlides(): Observable<Slide[]> {
    const slidesRef = collection(this.firestore, 'slides');
    return collectionData(slidesRef, { idField: 'id' }) as Observable<Slide[]>;
  }

  // Buscar slides ativos ordenados
  getSlidesAtivos(): Observable<Slide[]> {
    const slidesRef = collection(this.firestore, 'slides');
    const q = query(slidesRef, where('ativo', '==', true));
    return collectionData(q, { idField: 'id' }) as Observable<Slide[]>;
  }

  // Buscar slide por ID
  getSlide(id: string): Observable<Slide | undefined> {
    const slideRef = doc(this.firestore, 'slides', id);
    return docData(slideRef, { idField: 'id' }) as Observable<Slide | undefined>;
  }

  // Criar novo slide
  createSlide(slide: Slide): Promise<string> {
    const slidesRef = collection(this.firestore, 'slides');
    const slideWithTimestamp = {
      ...slide,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };
    return addDoc(slidesRef, slideWithTimestamp).then(docRef => docRef.id);
  }

  // Atualizar slide
  updateSlide(id: string, slide: Partial<Slide>): Promise<void> {
    const slideRef = doc(this.firestore, 'slides', id);
    const slideWithTimestamp = {
      ...slide,
      dataAtualizacao: new Date()
    };
    return updateDoc(slideRef, slideWithTimestamp);
  }

  // Deletar slide
  deleteSlide(id: string): Promise<void> {
    const slideRef = doc(this.firestore, 'slides', id);
    return deleteDoc(slideRef);
  }

  // Ativar/Desativar slide
  toggleSlideStatus(id: string, ativo: boolean): Promise<void> {
    const slideRef = doc(this.firestore, 'slides', id);
    return updateDoc(slideRef, {
      ativo,
      dataAtualizacao: new Date()
    });
  }

  // Reordenar slides
  reorderSlides(slides: { id: string, ordem: number }[]): Promise<void[]> {
    const promises = slides.map(slide => {
      const slideRef = doc(this.firestore, 'slides', slide.id);
      return updateDoc(slideRef, {
        ordem: slide.ordem,
        dataAtualizacao: new Date()
      });
    });
    return Promise.all(promises);
  }

  // Upload de imagem para o Storage
  async uploadImage(file: File, slideId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `slides/${slideId}/slide-image.${fileExtension}`;
    const fileRef = ref(this.storage, fileName);

    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  }

  // Deletar imagem do Storage
  async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('icon-sem-perfil')) {
      return; // Não deleta placeholders
    }

    try {
      const imageRef = ref(this.storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      // Continua mesmo se não conseguir deletar a imagem
    }
  }

  // Criar slide com upload de imagem
  async createSlideWithImage(slide: Slide, imageFile?: File): Promise<string> {
    try {
      const slideWithTimestamp = {
        ...slide,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      };

      // Se não tem imagem, cria o slide diretamente
      if (!imageFile) {
        const docRef = await addDoc(collection(this.firestore, 'slides'), slideWithTimestamp);
        return docRef.id;
      }

      // Se tem imagem, faz upload primeiro
      const docRef = await addDoc(collection(this.firestore, 'slides'), {
        ...slideWithTimestamp,
        img: 'uploading...' // Placeholder durante upload
      });

      // Upload da imagem
      const imageUrl = await this.uploadImage(imageFile, docRef.id);

      // Atualiza o slide com a URL da imagem
      await updateDoc(docRef, {
        img: imageUrl,
        dataAtualizacao: new Date()
      });

      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar slide com nova imagem
  async updateSlideWithImage(id: string, slide: Partial<Slide>, imageFile?: File): Promise<void> {
    try {
      const slideRef = doc(this.firestore, 'slides', id);

      // Se não tem nova imagem, atualiza normalmente
      if (!imageFile) {
        const slideWithTimestamp = {
          ...slide,
          dataAtualizacao: new Date()
        };
        await updateDoc(slideRef, slideWithTimestamp);
        return;
      }

      // Busca o slide atual para pegar a imagem anterior
      const currentSlide = await docData(slideRef) as Observable<Slide>;
      let currentImageUrl: string | undefined;

      currentSlide.subscribe(slide => {
        if (slide) {
          currentImageUrl = slide.img;
        }
      });

      // Deleta a imagem anterior se existir
      if (currentImageUrl) {
        await this.deleteImage(currentImageUrl);
      }

      // Upload da nova imagem
      const newImageUrl = await this.uploadImage(imageFile, id);

      // Atualiza o slide com a nova imagem
      const slideWithTimestamp = {
        ...slide,
        img: newImageUrl,
        dataAtualizacao: new Date()
      };

      await updateDoc(slideRef, slideWithTimestamp);
    } catch (error) {
      throw error;
    }
  }

  // Deletar slide com imagem
  async deleteSlideWithImage(id: string): Promise<void> {
    try {
      // Busca o slide para pegar a URL da imagem
      const slideRef = doc(this.firestore, 'slides', id);
      const slide = await docData(slideRef) as Observable<Slide>;

      let imageUrl: string | undefined;
      slide.subscribe(s => {
        if (s) {
          imageUrl = s.img;
        }
      });

      // Deleta a imagem do Storage se existir
      if (imageUrl) {
        await this.deleteImage(imageUrl);
      }

      // Deleta o documento do slide
      await deleteDoc(slideRef);
    } catch (error) {
      throw error;
    }
  }
}
