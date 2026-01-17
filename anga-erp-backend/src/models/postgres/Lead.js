const { DataTypes } = require('sequelize');
const db = require('../../config/database').getPostgreSQL();

const Lead = db.define('Lead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  leadSource: {
    type: DataTypes.ENUM('website', 'referral', 'social', 'email', 'phone', 'event'),
    allowNull: false,
    defaultValue: 'website'
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING(200)
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
  serviceInterest: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  message: {
    type: DataTypes.TEXT
  },
  budgetRange: {
    type: DataTypes.ENUM('under_50k', '50k_100k', '100k_500k', '500k_1m', 'over_1m')
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'),
    defaultValue: 'new'
  },
  assignedTo: {
    type: DataTypes.UUID,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  followUpDate: {
    type: DataTypes.DATEONLY
  },
  conversionDate: {
    type: DataTypes.DATEONLY
  },
  convertedToClient: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  convertedClientId: {
    type: DataTypes.UUID,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'leads',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['lead_source']
    },
    {
      fields: ['email']
    },
    {
      fields: ['assigned_to']
    }
  ]
});

// Associations
Lead.associate = function(models) {
  Lead.belongsTo(models.Employee, {
    foreignKey: 'assignedTo',
    as: 'assignedEmployee'
  });
  
  Lead.belongsTo(models.Client, {
    foreignKey: 'convertedClientId',
    as: 'client'
  });
};

module.exports = Lead;