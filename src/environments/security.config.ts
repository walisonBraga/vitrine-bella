// Configuração de ambiente seguro
export const secureEnvironment = {
  // Configurações de segurança
  security: {
    // Timeout de sessão em minutos
    sessionTimeout: 30,
    
    // Máximo de tentativas de login
    maxLoginAttempts: 5,
    
    // Duração do bloqueio em minutos
    lockoutDuration: 15,
    
    // Configurações de senha
    password: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    
    // Headers de segurança
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    }
  },
  
  // Configurações LGPD
  lgpd: {
    // Versão da política de privacidade
    privacyPolicyVersion: '1.0',
    
    // Período de retenção padrão em dias
    defaultRetentionPeriod: 365,
    
    // Tipos de consentimento
    consentTypes: ['necessary', 'marketing', 'analytics', 'all'],
    
    // Direitos do titular
    dataSubjectRights: ['access', 'rectification', 'erasure', 'portability', 'restriction']
  },
  
  // Configurações de rate limiting
  rateLimit: {
    // Limite geral (requests por 15 minutos)
    general: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    
    // Limite para login (tentativas por 15 minutos)
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5
    },
    
    // Limite para API (requests por minuto)
    api: {
      windowMs: 60 * 1000,
      max: 60
    }
  },
  
  // Configurações de validação
  validation: {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 254
    },
    
    password: {
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/
    },
    
    phone: {
      pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
    },
    
    cpf: {
      pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
    },
    
    cnpj: {
      pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    }
  },
  
  // Configurações de logging
  logging: {
    // Níveis de log
    levels: ['error', 'warn', 'info', 'debug'],
    
    // Formato de log
    format: 'json',
    
    // Retenção de logs em dias
    retentionDays: 30,
    
    // Logs sensíveis (não devem ser logados)
    sensitiveFields: ['password', 'token', 'secret', 'key', 'cpf', 'cnpj']
  },
  
  // Configurações de criptografia
  encryption: {
    // Algoritmo de hash para senhas
    passwordHash: 'bcrypt',
    
    // Rounds para bcrypt
    bcryptRounds: 12,
    
    // Algoritmo para criptografia de dados
    dataEncryption: 'aes-256-gcm',
    
    // Chave para criptografia (deve ser definida em variável de ambiente)
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  },
  
  // Configurações de monitoramento
  monitoring: {
    // Intervalo de verificação de saúde em ms
    healthCheckInterval: 60000,
    
    // Timeout para requisições em ms
    requestTimeout: 30000,
    
    // Limite de memória em MB
    memoryLimit: 512,
    
    // Limite de CPU em %
    cpuLimit: 80
  },
  
  // Configurações de backup
  backup: {
    // Frequência de backup
    frequency: 'daily',
    
    // Retenção de backups em dias
    retentionDays: 30,
    
    // Compressão de backups
    compression: true,
    
    // Criptografia de backups
    encryption: true
  }
};

// Função para validar configurações
export function validateSecurityConfig() {
  const errors: string[] = [];
  
  // Valida configurações críticas
  if (secureEnvironment.security.sessionTimeout < 5) {
    errors.push('Session timeout deve ser pelo menos 5 minutos');
  }
  
  if (secureEnvironment.security.maxLoginAttempts < 3) {
    errors.push('Máximo de tentativas de login deve ser pelo menos 3');
  }
  
  if (secureEnvironment.security.password.minLength < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (secureEnvironment.encryption.encryptionKey === 'default-key-change-in-production') {
    errors.push('Chave de criptografia deve ser alterada em produção');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configurações de segurança inválidas: ${errors.join(', ')}`);
  }
  
  return true;
}

// Função para obter configuração por ambiente
export function getEnvironmentConfig(env: 'development' | 'production' | 'test') {
  const baseConfig = secureEnvironment;
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        security: {
          ...baseConfig.security,
          sessionTimeout: 60, // Mais tempo em desenvolvimento
          maxLoginAttempts: 10 // Mais tentativas em desenvolvimento
        },
        logging: {
          ...baseConfig.logging,
          levels: ['error', 'warn', 'info', 'debug'] // Todos os níveis em desenvolvimento
        }
      };
      
    case 'production':
      return {
        ...baseConfig,
        security: {
          ...baseConfig.security,
          sessionTimeout: 30, // Configuração padrão
          maxLoginAttempts: 5 // Configuração padrão
        },
        logging: {
          ...baseConfig.logging,
          levels: ['error', 'warn'] // Apenas erros e avisos em produção
        }
      };
      
    case 'test':
      return {
        ...baseConfig,
        security: {
          ...baseConfig.security,
          sessionTimeout: 5, // Sessões curtas para testes
          maxLoginAttempts: 3 // Poucas tentativas para testes
        },
        logging: {
          ...baseConfig.logging,
          levels: ['error'] // Apenas erros em testes
        }
      };
      
    default:
      return baseConfig;
  }
}
