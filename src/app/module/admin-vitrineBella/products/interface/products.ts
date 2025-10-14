export interface Product {
  imageUrl: string | null;
  id: string;
  productName: string;
  description: string;
  price: number;
  isActive: boolean;
  stock: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}
