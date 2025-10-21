export interface Sale {
  id: string; // UUID4 gerado
  firebaseDocumentId?: string; // Document ID do Firebase
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCpf?: string; // CPF do cliente para vincular compras
  accessCPF?: string; // CPF como accessCode para localizar a compra do usuário
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
  imageUrl?: string;
}

export interface SaleForm {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCpf?: string;
  accessCPF?: string; // CPF como accessCode para localizar a compra do usuário
  items: SaleItem[];
  discount?: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix';
}

export interface CustomerSaleHistory {
  saleId: string;
  date: Date;
  amount: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}
