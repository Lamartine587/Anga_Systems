const { DataTypes } = require('sequelize');
const db = require('../../config/database').getPostgreSQL();

const Project = db.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  projectCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  projectName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  projectType: {
    type: DataTypes.ENUM('web', 'app', 'maintenance', 'consulting'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  startDate: {
    type: DataTypes.DATEONLY
  },
  endDate: {
    type: DataTypes.DATEONLY
  },
  estimatedHours: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
    defaultValue: 'planning'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.UUID,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['project_code']
    },
    {
      fields: ['status']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['project_type']
    }
  ]
});

// Associations
Project.associate = function(models) {
  Project.belongsTo(models.Client, {
    foreignKey: 'clientId',
    as: 'client'
  });
  
  Project.belongsTo(models.Employee, {
    foreignKey: 'assignedTo',
    as: 'assignedEmployee'
  });
  
  Project.hasMany(models.Invoice, {
    foreignKey: 'projectId',
    as: 'invoices'
  });
};

module.exports = Project;