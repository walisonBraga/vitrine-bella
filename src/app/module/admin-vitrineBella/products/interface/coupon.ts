export interface Coupon {
  id?: string;
  code: string;
  name: string;
  description?: string;
  discountPercentage: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  applicableProducts?: string[]; // IDs dos produtos
  applicableCategories?: string[]; // Categorias aplicáveis
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CouponCreateRequest {
  code: string;
  name: string;
  description?: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export interface CouponValidationResult {
  isValid: boolean;
  discountAmount: number;
  message?: string;
}
