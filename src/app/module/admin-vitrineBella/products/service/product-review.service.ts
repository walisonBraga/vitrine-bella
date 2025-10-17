import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { ProductReview, ProductReviewCreateRequest, ProductReviewUpdateRequest } from '../interface/product-review';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductReviewService {
  private reviewsCollection = collection(this.firestore, 'productReviews');

  constructor(private firestore: Firestore) { }

  async createReview(review: ProductReviewCreateRequest): Promise<void> {
    try {
      const reviewWithTimestamp = {
        ...review,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(this.reviewsCollection, reviewWithTimestamp);
    } catch (error) {
      throw error;
    }
  }

  getReviewsByProduct(productId: string): Observable<ProductReview[]> {
    const q = query(this.reviewsCollection, where('productId', '==', productId));
    return collectionData(q, { idField: 'id' }) as Observable<ProductReview[]>;
  }

  getReviewsByUser(userId: string): Observable<ProductReview[]> {
    const q = query(this.reviewsCollection, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<ProductReview[]>;
  }

  async getUserReviewForProduct(productId: string, userId: string): Promise<ProductReview | null> {
    try {
      const q = query(
        this.reviewsCollection,
        where('productId', '==', productId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as ProductReview;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async updateReview(reviewId: string, updates: ProductReviewUpdateRequest): Promise<void> {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const reviewDocRef = doc(this.firestore, 'productReviews', reviewId);
      await updateDoc(reviewDocRef, updatedData);
    } catch (error) {
      throw error;
    }
  }

  async deleteReview(reviewId: string): Promise<void> {
    try {
      const reviewDocRef = doc(this.firestore, 'productReviews', reviewId);
      await deleteDoc(reviewDocRef);
    } catch (error) {
      throw error;
    }
  }

  getAverageRating(productId: string): Observable<number> {
    return this.getReviewsByProduct(productId).pipe(
      map(reviews => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return Math.round((sum / reviews.length) * 10) / 10; // Arredonda para 1 casa decimal
      })
    );
  }

  getReviewCount(productId: string): Observable<number> {
    return this.getReviewsByProduct(productId).pipe(
      map(reviews => reviews.length)
    );
  }
}
