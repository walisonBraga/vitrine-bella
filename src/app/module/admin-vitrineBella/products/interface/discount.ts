export interface Discount {
  id?: string;
  productId: string;
  productName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // Percentual (0-100) ou valor fixo em R$
  originalPrice: number;
  discountedPrice: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface DiscountCreateRequest {
  productId: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface DiscountUpdateRequest {
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  description?: string;
}
