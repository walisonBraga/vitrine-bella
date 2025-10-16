export interface Sale {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  discount?: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  userId: string; // ID do vendedor
}

export interface SaleItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SaleForm {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SaleItem[];
  discount?: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix';
}
