const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const config = require('./index');

class DatabaseManager {
  constructor() {
    this.postgres = null;
    this.mongodb = null;
    this.connected = false;
  }

  async connectPostgreSQL() {
    try {
      this.postgres = new Sequelize({
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        username: config.postgres.user,
        password: config.postgres.password,
        dialect: config.postgres.dialect,
        logging: config.postgres.logging,
        pool: config.postgres.pool,
        dialectOptions: {
          ssl: config.env === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      });

      await this.postgres.authenticate();
      console.log('✅ PostgreSQL connection established successfully.');
      
      // Sync models (use with caution in production)
      if (config.env === 'development') {
        await this.syncModels();
      }
      
      return this.postgres;
    } catch (error) {
      console.error('❌ Unable to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async connectMongoDB() {
    try {
      await mongoose.connect(config.mongodb.uri, {
        ...config.mongodb.options,
        dbName: config.mongodb.dbName
      });
      
      this.mongodb = mongoose.connection;
      
      this.mongodb.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });
      
      this.mongodb.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });
      
      this.mongodb.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });
      
      console.log('✅ MongoDB connection established successfully.');
      return this.mongodb;
    } catch (error) {
      console.error('❌ Unable to connect to MongoDB:', error);
      throw error;
    }
  }

  async connectAll() {
    try {
      await this.connectPostgreSQL();
      await this.connectMongoDB();
      this.connected = true;
      console.log('✅ All database connections established');
    } catch (error) {
      console.error('❌ Failed to connect to databases:', error);
      throw error;
    }
  }

  async syncModels() {
    try {
      // Import models
      require('../models/postgres/Employee');
      require('../models/postgres/Client');
      require('../models/postgres/Invoice');
      require('../models/postgres/Project');
      require('../models/postgres/Lead');
      require('../models/postgres/User');
      
      await this.postgres.sync({ alter: true });
      console.log('✅ PostgreSQL models synchronized');
    } catch (error) {
      console.error('❌ Error syncing models:', error);
    }
  }

  async disconnect() {
    try {
      if (this.postgres) {
        await this.postgres.close();
        console.log('✅ PostgreSQL connection closed');
      }
      
      if (this.mongodb) {
        await mongoose.disconnect();
        console.log('✅ MongoDB connection closed');
      }
      
      this.connected = false;
    } catch (error) {
      console.error('❌ Error disconnecting databases:', error);
    }
  }

  getPostgreSQL() {
    if (!this.postgres) {
      throw new Error('PostgreSQL not connected');
    }
    return this.postgres;
  }

  getMongoDB() {
    if (!this.mongodb) {
      throw new Error('MongoDB not connected');
    }
    return this.mongodb;
  }
}

module.exports = new DatabaseManager();