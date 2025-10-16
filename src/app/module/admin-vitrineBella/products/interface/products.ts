export interface Product {
  imageUrl: string | null;
  id: string;
  productName: string;
  description: string;
  price: number;
  isActive: boolean;
  stock: number;
  category: string; // ID da categoria
  categoryName?: string; // Nome da categoria para exibição
  createdAt?: string;
  updatedAt?: string;
  // Campos de desconto
  hasDiscount?: boolean;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  originalPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountDescription?: string;
}

export interface ProductCreateRequest {
  imageUrl: string | null;
  productName: string;
  description: string;
  price: number;
  isActive?: boolean;
  stock: number;
  category: string;
  hasDiscount?: boolean;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  originalPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountDescription?: string;
}

export interface ProductUpdateRequest {
  imageUrl?: string | null;
  productName?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
  stock?: number;
  category?: string;
  hasDiscount?: boolean;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  originalPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountDescription?: string;
}
