export interface Category {
  id?: string;
  name: string;
  description?: string;
  icon: string; // Ícone Material Design
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  productCount?: number; // Contador de produtos nesta categoria
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  icon: string;
  isActive?: boolean;
}

export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}
