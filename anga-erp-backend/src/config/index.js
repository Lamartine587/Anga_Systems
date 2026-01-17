require('dotenv').config();

const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  
  // Databases
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT) || 5432,
    database: process.env.PG_DATABASE || 'anga_erp',
    user: process.env.PG_USER || 'erp_app',
    password: process.env.PG_PASSWORD,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development',
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  },
  
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB || 'anga_devops',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  
  // Security
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },
  
  // Email
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@angasystems.com'
  },
  
  // External Services
  africasTalking: {
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME
  },
  
  // Rate Limiting
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  
  // Uploads
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'],
    uploadDir: 'uploads/'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: 'logs/'
  }
};

// Validate required configuration
const requiredConfig = [
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'PG_PASSWORD'
];

requiredConfig.forEach(key => {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} environment variable is not set`);
  }
});

module.exports = config;