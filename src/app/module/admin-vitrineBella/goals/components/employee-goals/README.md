# Página de Metas para Funcionários

## Como Funciona

A página de metas para funcionários permite que cada funcionário visualize apenas suas próprias metas usando um código de acesso único.

### Acesso por Código

1. **Código de Acesso**: Os primeiros 10 caracteres do UID do funcionário
2. **URL de Acesso**: `/admin/employee-goals?code=ABC1234567`
3. **Acesso Direto**: Digite o código no formulário da página

### Funcionalidades

#### Para Funcionários:
- ✅ **Visualizar apenas suas metas**
- ✅ **Filtrar por mês e ano**
- ✅ **Ver dados de meses anteriores**
- ✅ **Acompanhar progresso das metas**
- ✅ **Calcular comissões**
- ✅ **Ver posição no ranking**
- ✅ **Acompanhar dias restantes**

#### Informações Exibidas:
- 📊 **Progresso da meta** com barra visual
- 💰 **Valor da meta** vs **vendas atuais**
- 📈 **Percentual de comissão**
- 💵 **Valor da comissão** calculado
- 🏆 **Posição no ranking** do mês
- 📅 **Dias restantes** para o fim do mês

### Como Usar

#### 1. Para Administradores:
```typescript
// Ao criar uma meta, o accessCode é automaticamente definido
const goalData = {
  userId: 'ABC1234567890XYZ', // UID completo do funcionário
  accessCode: 'ABC1234567',   // Primeiros 10 caracteres
  // ... outros dados
};
```

#### 2. Para Funcionários:
```
URL: https://seusite.com/admin/employee-goals?code=ABC1234567
```

#### 3. Exemplo de Uso:
```html
<!-- Link direto para funcionário -->
<a href="/admin/employee-goals?code=ABC1234567">
  Ver Minhas Metas
</a>
```

### Segurança

- ✅ **Acesso restrito** apenas às próprias metas
- ✅ **Código único** por funcionário
- ✅ **Sem autenticação** necessária (apenas código)
- ✅ **Dados isolados** por funcionário

### Responsividade

- 📱 **Mobile-first** design
- 💻 **Desktop** otimizado
- 🎨 **Interface moderna** e intuitiva

### Exemplo de Interface

```
┌─────────────────────────────────────┐
│           Minhas Metas              │
├─────────────────────────────────────┤
│ João Silva - joao@empresa.com       │
│ Posição: 2º lugar                    │
│ Vendas: R$ 15.000,00                 │
│ Comissão: R$ 750,00                  │
│ Atingimento: 75%                     │
├─────────────────────────────────────┤
│ [Janeiro ▼] [2024 ▼]                │
│ 15 dias restantes                    │
├─────────────────────────────────────┤
│ Meta: R$ 20.000,00                   │
│ Vendas: R$ 15.000,00                 │
│ Progresso: ████████░░ 75%            │
│ Comissão: 5%                         │
│ Ganho: R$ 750,00                     │
└─────────────────────────────────────┘
```

### Integração com Sistema Existente

A página se integra perfeitamente com:
- ✅ **GoalService** existente
- ✅ **Firebase** para dados
- ✅ **Sistema de ranking** atual
- ✅ **Cálculo de comissões** automático
- ✅ **Fechamento de mês** automático

### Benefícios

1. **Para Funcionários**:
   - Acesso fácil às suas metas
   - Transparência total
   - Motivação com ranking
   - Acompanhamento em tempo real

2. **Para Administradores**:
   - Menos perguntas dos funcionários
   - Sistema autônomo
   - Dados seguros e isolados
   - Interface profissional

3. **Para a Empresa**:
   - Maior engajamento
   - Transparência nas metas
   - Sistema escalável
   - Redução de overhead
