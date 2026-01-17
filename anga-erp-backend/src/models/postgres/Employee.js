const { DataTypes } = require('sequelize');
const db = require('../../config/database').getPostgreSQL();

const Employee = db.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  department: {
    type: DataTypes.ENUM('hr', 'finance', 'devops', 'marketing', 'development'),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  hireDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'terminated'),
    defaultValue: 'active'
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  address: {
    type: DataTypes.TEXT
  },
  bankDetails: {
    type: DataTypes.JSONB
  },
  taxInfo: {
    type: DataTypes.JSONB
  },
  emergencyContact: {
    type: DataTypes.JSONB
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'employees',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['employee_code']
    },
    {
      fields: ['department']
    },
    {
      fields: ['status']
    }
  ]
});

// Associations
Employee.associate = function(models) {
  Employee.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  Employee.hasMany(models.Invoice, {
    foreignKey: 'createdBy',
    as: 'invoices'
  });
  
  Employee.hasMany(models.Project, {
    foreignKey: 'assignedTo',
    as: 'projects'
  });
};

module.exports = Employee;