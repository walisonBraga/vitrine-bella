# Vitrine Bella - E-commerce Seguro

## 🛡️ Segurança Implementada

Este projeto foi completamente reforçado com medidas de segurança avançadas e conformidade com a LGPD (Lei Geral de Proteção de Dados).

### ✅ Funcionalidades de Segurança

- **Autenticação Forte**: Validação de senhas complexas, proteção contra força bruta
- **Conformidade LGPD**: Gerenciamento completo de dados pessoais e consentimentos
- **Headers de Segurança**: CSP, HSTS, X-Frame-Options e outros headers de proteção
- **Rate Limiting**: Proteção contra spam e ataques DDoS
- **Monitoramento de Sessão**: Detecção de inatividade e timeout automático
- **Validação Rigorosa**: Sanitização de entrada e prevenção de XSS/Injection
- **Logs de Auditoria**: Registro completo de ações de segurança
- **Criptografia**: Proteção de dados sensíveis

### 🔧 Configuração Rápida

1. **Instalar dependências**:
```bash
npm install
```

2. **Configurar variáveis de ambiente**:
```bash
# Criar arquivo .env
FIREBASE_API_KEY=sua-api-key-aqui
FIREBASE_AUTH_DOMAIN=seu-domain.firebaseapp.com
FIREBASE_PROJECT_ID=seu-project-id
ENCRYPTION_KEY=sua-chave-super-secreta
NODE_ENV=production
```

3. **Executar em desenvolvimento**:
```bash
npm start
```

4. **Build para produção**:
```bash
npm run build
```

### 📋 Documentação de Segurança

- [Guia de Implementação](SECURITY_IMPLEMENTATION_GUIDE.md)
- [Política de Privacidade](PRIVACY_POLICY.md)
- [Termos de Uso](TERMS_OF_SERVICE.md)

### 🚨 Ações Críticas Necessárias

1. **Mover chaves Firebase para variáveis de ambiente**
2. **Configurar regras de segurança do Firestore**
3. **Implementar backup automático**
4. **Configurar monitoramento em produção**

### 🔐 Componentes de Segurança

- `SecurityService`: Serviço principal de segurança
- `LGPDComplianceService`: Conformidade com LGPD
- `SecurityInterceptor`: Interceptor HTTP com headers de segurança
- `LGPDConsentComponent`: Componente de consentimento
- `DataManagementComponent`: Gerenciamento de dados pessoais

### 📊 Monitoramento

O sistema inclui logs de segurança para:
- Tentativas de login falhadas
- Acessos não autorizados
- Alterações em dados pessoais
- Atividades suspeitas

### 🆘 Suporte de Segurança

- **E-mail**: security@vitrinebella.com.br
- **DPO**: dpo@vitrinebella.com.br
- **Telefone**: (11) 99999-9999

---

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

---

**⚠️ IMPORTANTE**: Este projeto implementa medidas de segurança avançadas. Certifique-se de seguir todas as recomendações do guia de implementação antes de colocar em produção.