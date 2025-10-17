# Sistema de Garantia Estendida - Vitrine Bella

## 📋 Visão Geral

O sistema de Garantia Estendida permite que os administradores configurem opções de garantia adicional para produtos, oferecendo diferentes períodos (12, 24, 36 meses) com preços e parcelamentos personalizados.

## 🏗️ Estrutura de Dados

### Interface Product (atualizada)
```typescript
interface Product {
  // ... outros campos
  extendedWarranty?: {
    isAvailable: boolean;
    options: {
      months: number;
      price: number;
      description: string;
      installmentPrice?: number;
      installmentMonths?: number;
    }[];
    defaultOption?: number; // meses da opção padrão
  };
}
```

### Exemplo de Dados Salvos no Firebase
```json
{
  "id": "produto123",
  "productName": "Smartphone XYZ",
  "price": 1200.00,
  "extendedWarranty": {
    "isAvailable": true,
    "options": [
      {
        "months": 12,
        "price": 76.80,
        "description": "12 Meses de Garantia Estendida Vitrine Bella",
        "installmentPrice": 7.68,
        "installmentMonths": 10
      },
      {
        "months": 24,
        "price": 153.60,
        "description": "24 Meses de Garantia Estendida Vitrine Bella",
        "installmentPrice": 15.36,
        "installmentMonths": 10
      },
      {
        "months": 36,
        "price": 230.40,
        "description": "36 Meses de Garantia Estendida Vitrine Bella",
        "installmentPrice": 23.04,
        "installmentMonths": 10
      }
    ],
    "defaultOption": 12
  }
}
```

## 🎯 Como Usar

### 1. Criar/Editar Produto
1. Acesse o painel administrativo
2. Vá em "Produtos" → "Cadastrar Novo Produto" ou "Editar Produto"
3. Role até a seção "Garantia Estendida"
4. Clique no ícone de expansão para abrir a seção

### 2. Configurar Garantia
1. **Ativar Garantia**: Marque "Oferecer Garantia Estendida para este produto"
2. **Configurar Opções**: Para cada período (12, 24, 36 meses):
   - Marque o checkbox para ativar
   - Defina o preço total
   - Configure o valor do parcelamento (opcional)
   - Personalize a descrição
3. **Opção Padrão**: Escolha qual opção será selecionada por padrão no carrinho

### 3. Salvar no Firebase
- Os dados são automaticamente salvos no Firebase quando você clica em "Salvar"
- A estrutura `extendedWarranty` é incluída no documento do produto

## 💡 Funcionalidades Implementadas

### ✅ No Modal de Produto
- ✅ Seção expansível "Garantia Estendida"
- ✅ Checkbox para ativar/desativar garantia
- ✅ 3 opções de período (12, 24, 36 meses)
- ✅ Campos para preço e parcelamento
- ✅ Descrição personalizável
- ✅ Seleção de opção padrão
- ✅ Validação de formulário
- ✅ Salvamento no Firebase

### ✅ Interface de Dados
- ✅ Interface `Product` atualizada
- ✅ Interfaces `ProductCreateRequest` e `ProductUpdateRequest` atualizadas
- ✅ Método `buildExtendedWarranty()` para processar dados
- ✅ Integração com método `onSubmit()`

### ✅ Estilos CSS
- ✅ Design responsivo
- ✅ Seção destacada com fundo cinza claro
- ✅ Cards individuais para cada opção
- ✅ Ícones e cores consistentes
- ✅ Animações suaves

## 🔧 Métodos Principais

### `toggleExtendedWarranty()`
```typescript
toggleExtendedWarranty(): void {
  this.showExtendedWarranty = !this.showExtendedWarranty;
}
```

### `buildExtendedWarranty()`
```typescript
buildExtendedWarranty(): any {
  const formData = this.productForm.value;
  
  if (!formData.extendedWarrantyAvailable) {
    return undefined;
  }

  const options = [];
  
  // Processa cada opção (12, 24, 36 meses)
  // Retorna objeto estruturado para salvar no Firebase
}
```

## 📱 Próximos Passos

### Para Implementar no Frontend (Carrinho/Checkout)
1. **Exibir opções de garantia** no carrinho
2. **Calcular preços** incluindo garantia selecionada
3. **Salvar seleção** do usuário
4. **Integrar com checkout** para cobrança

### Exemplo de Uso no Carrinho
```typescript
// No componente do carrinho
if (product.extendedWarranty?.isAvailable) {
  const selectedWarranty = product.extendedWarranty.options
    .find(option => option.months === product.extendedWarranty.defaultOption);
  
  if (selectedWarranty) {
    totalPrice += selectedWarranty.price;
  }
}
```

## 🎨 Design System

### Cores
- **Primária**: `#ff6b35` (laranja)
- **Fundo**: `#f8f9fa` (cinza claro)
- **Borda**: `#e9ecef` (cinza médio)

### Ícones
- **Garantia**: `security`
- **Dinheiro**: `attach_money`
- **Cartão**: `credit_card`
- **Estrela**: `star`

## 🚀 Benefícios

1. **Flexibilidade**: Configure diferentes períodos e preços
2. **Parcelamento**: Ofereça opções de pagamento
3. **Padronização**: Descrições consistentes
4. **Integração**: Salva diretamente no Firebase
5. **UX**: Interface intuitiva e responsiva

---

**Status**: ✅ Implementado e Funcional
**Próximo**: Integração com carrinho e checkout
