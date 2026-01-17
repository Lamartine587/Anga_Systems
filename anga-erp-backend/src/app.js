const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const database = require('./config/database');
const logger = require('./utils/logger');
const { ErrorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finance');
const hrRoutes = require('./routes/hr');
const devopsRoutes = require('./routes/devops');
const marketingRoutes = require('./routes/marketing');

class App {
  constructor() {
    this.app = express();
    this.port = config.port;
    
    this.initializeMiddlewares();
    this.initializeDatabase();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }
  
  initializeMiddlewares() {
    // Security headers
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.env === 'production' 
        ? ['https://angasystems.com', 'https://www.angasystems.com']
        : ['http://localhost:3000', 'http://localhost:8080'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.window * 60 * 1000,
      max: config.rateLimit.max,
      message: {
        success: false,
        error: 'Too many requests, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    
    this.app.use(limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Compression
    this.app.use(compression());
    
    // Logging
    this.app.use(morgan('combined', { stream: logger.stream }));
    
    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info({
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }
  
  async initializeDatabase() {
    try {
      await database.connectAll();
      logger.info('Database connections established');
    } catch (error) {
      logger.error('Failed to connect to databases:', error);
      process.exit(1);
    }
  }
  
  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: database.connected ? 'connected' : 'disconnected'
      });
    });
    
    // API Routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/finance', financeRoutes);
    this.app.use('/api/hr', hrRoutes);
    this.app.use('/api/devops', devopsRoutes);
    this.app.use('/api/marketing', marketingRoutes);
    
    // Serve frontend for production
    if (config.env === 'production') {
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
      });
    }
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });
  }
  
  initializeErrorHandling() {
    this.app.use(ErrorHandler.handleError);
  }
  
  start() {
    const server = this.app.listen(this.port, () => {
      logger.info(`
        🚀 Server running in ${config.env} mode
        📍 Port: ${this.port}
        ⏰ Started at: ${new Date().toISOString()}
        🔗 Health check: http://localhost:${this.port}/health
      `);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await database.disconnect();
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await database.disconnect();
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
    return server;
  }
}

// Start the application
const app = new App();
module.exports = app.start();