export interface ProductReview {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string; // URL da foto de perfil do usuário
  rating: number; // 1-5 estrelas
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewCreateRequest {
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string; // URL da foto de perfil do usuário
  rating: number;
  comment: string;
}

export interface ProductReviewUpdateRequest {
  rating?: number;
  comment?: string;
}
