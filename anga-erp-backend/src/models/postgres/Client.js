const { DataTypes } = require('sequelize');
const db = require('../../config/database').getPostgreSQL();

const Client = db.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clientCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING(100)
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING(100)
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: 'Kenya'
  },
  serviceTier: {
    type: DataTypes.ENUM('basic', 'standard', 'premium', 'enterprise'),
    defaultValue: 'standard'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  paymentTerms: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  additionalInfo: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'clients',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['client_code']
    },
    {
      fields: ['status']
    },
    {
      fields: ['service_tier']
    }
  ]
});

// Associations
Client.associate = function(models) {
  Client.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  Client.hasMany(models.Invoice, {
    foreignKey: 'clientId',
    as: 'invoices'
  });
  
  Client.hasMany(models.Project, {
    foreignKey: 'clientId',
    as: 'projects'
  });
};

module.exports = Client;