import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

export function configureSecurity(app: express.Application) {
  // Configuração de segurança com Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.firebase.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Configuração CORS
  app.use(cors({
    origin: process.env['NODE_ENV'] === 'production' 
      ? ['https://vitrine-bella.firebaseapp.com', 'https://vitrine-bella.web.app']
      : ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
    message: {
      error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // Rate limiting mais restritivo para login
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas de login por IP por janela
    message: {
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: 15 * 60
    },
    skipSuccessfulRequests: true
  });

  app.use('/api/auth', loginLimiter);

  // Headers de segurança adicionais
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // Log de requisições suspeitas
  app.use((req, res, next) => {
    const suspiciousPatterns = [
      /\.\./,  // Path traversal
      /<script/i,  // XSS
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript injection
      /on\w+\s*=/i  // Event handlers
    ];

    const url = req.url.toLowerCase();
    const userAgent = req.get('User-Agent') || '';

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(userAgent)) {
        // Requisição suspeita detectada - log silencioso
        break;
      }
    }

    next();
  });

  // Middleware para validar dados de entrada
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      // Verifica se o JSON é válido
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }));

  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Middleware para sanitizar dados
  app.use((req, res, next) => {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '')
          .trim();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      
      return obj;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }
    
    if (req.query) {
      req.query = sanitize(req.query);
    }

    next();
  });
}

// Função para validar dados de entrada específicos
export function validateInput(data: any, schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field in schema) {
    const rules = schema[field];
    const value = data[field];

    if (rules.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field} é obrigatório`);
      continue;
    }

    if (value && rules.type) {
      if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} deve ser um email válido`);
      }
      
      if (rules.type === 'password' && value.length < 8) {
        errors.push(`${field} deve ter pelo menos 8 caracteres`);
      }
      
      if (rules.type === 'phone' && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value)) {
        errors.push(`${field} deve estar no formato (XX) XXXXX-XXXX`);
      }
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${field} deve ter no máximo ${rules.maxLength} caracteres`);
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      errors.push(`${field} deve ter no mínimo ${rules.minLength} caracteres`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Esquemas de validação comuns
export const validationSchemas = {
  user: {
    email: { required: true, type: 'email', maxLength: 254 },
    password: { required: true, type: 'password', minLength: 8 },
    name: { required: true, maxLength: 100 },
    phone: { type: 'phone' }
  },
  
  product: {
    name: { required: true, maxLength: 200 },
    description: { maxLength: 1000 },
    price: { required: true, type: 'number' },
    category: { required: true, maxLength: 50 }
  }
};
