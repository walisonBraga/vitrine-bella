export interface Product {
  imageUrl: string | null;
  images?: string[]; // Array de URLs de imagens adicionais
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
  // Informações técnicas
  technicalInfo?: {
    brand?: string;
    model?: string;
    composition?: string;
    size?: string;
    weight?: string;
    warranty?: string;
    manufacturer?: string;
    specifications?: { [key: string]: string };
    careInstructions?: string[];
    packageContents?: string[];
    // Campos específicos por categoria
    processor?: string;
    ram?: string;
    storage?: string;
    screenSize?: string;
    resolution?: string;
    operatingSystem?: string;
    battery?: string;
    connectivity?: string;
    camera?: string;
    color?: string;
    material?: string;
    dimensions?: string;
    powerConsumption?: string;
    frequency?: string;
    channels?: string;
    audioFormat?: string;
    videoFormat?: string;
    ports?: string;
    accessories?: string;
  };
  // Garantia Estendida
  extendedWarranty?: {
    isAvailable: boolean;
    options: {
      months: number;
      price: number;
      description: string;
      installmentPrice?: number;
      installmentMonths?: number;
    }[];
  };
}

export interface ProductCreateRequest {
  imageUrl: string | null;
  images?: string[];
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
  technicalInfo?: {
    brand?: string;
    model?: string;
    composition?: string;
    size?: string;
    weight?: string;
    warranty?: string;
    manufacturer?: string;
    specifications?: { [key: string]: string };
    careInstructions?: string[];
    packageContents?: string[];
    // Campos específicos por categoria
    processor?: string;
    ram?: string;
    storage?: string;
    screenSize?: string;
    resolution?: string;
    operatingSystem?: string;
    battery?: string;
    connectivity?: string;
    camera?: string;
    color?: string;
    material?: string;
    dimensions?: string;
    powerConsumption?: string;
    frequency?: string;
    channels?: string;
    audioFormat?: string;
    videoFormat?: string;
    ports?: string;
    accessories?: string;
  };
  // Garantia Estendida
  extendedWarranty?: {
    isAvailable: boolean;
    options: {
      months: number;
      price: number;
      description: string;
      installmentPrice?: number;
      installmentMonths?: number;
    }[];
  };
}

export interface ProductUpdateRequest {
  imageUrl?: string | null;
  images?: string[];
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
  technicalInfo?: {
    brand?: string;
    model?: string;
    composition?: string;
    size?: string;
    weight?: string;
    warranty?: string;
    manufacturer?: string;
    specifications?: { [key: string]: string };
    careInstructions?: string[];
    packageContents?: string[];
    // Campos específicos por categoria
    processor?: string;
    ram?: string;
    storage?: string;
    screenSize?: string;
    resolution?: string;
    operatingSystem?: string;
    battery?: string;
    connectivity?: string;
    camera?: string;
    color?: string;
    material?: string;
    dimensions?: string;
    powerConsumption?: string;
    frequency?: string;
    channels?: string;
    audioFormat?: string;
    videoFormat?: string;
    ports?: string;
    accessories?: string;
  };
  // Garantia Estendida
  extendedWarranty?: {
    isAvailable: boolean;
    options: {
      months: number;
      price: number;
      description: string;
      installmentPrice?: number;
      installmentMonths?: number;
    }[];
  };
}
