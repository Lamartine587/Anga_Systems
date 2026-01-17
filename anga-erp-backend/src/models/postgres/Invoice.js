const { DataTypes } = require('sequelize');
const db = require('../../config/database').getPostgreSQL();

const Invoice = db.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
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
  projectId: {
    type: DataTypes.UUID,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'KES'
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'paid', 'overdue', 'cancelled', 'partially_paid'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('mpesa', 'bank_transfer', 'card', 'cash')
  },
  paymentDate: {
    type: DataTypes.DATEONLY
  },
  paymentReference: {
    type: DataTypes.STRING(100)
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 16.0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
}, {
  tableName: 'invoices',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['invoice_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['due_date']
    },
    {
      fields: ['client_id']
    }
  ],
  hooks: {
    beforeValidate: (invoice) => {
      // Auto-generate invoice number if not provided
      if (!invoice.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        invoice.invoiceNumber = `INV-${year}${month}-${random}`;
      }
      
      // Calculate totals if not set
      if (invoice.amount && invoice.taxAmount === undefined) {
        invoice.taxAmount = (invoice.amount * (invoice.taxRate || 16.0)) / 100;
        invoice.totalAmount = invoice.amount + invoice.taxAmount - (invoice.discount || 0);
      }
    }
  }
});

// Associations
Invoice.associate = function(models) {
  Invoice.belongsTo(models.Client, {
    foreignKey: 'clientId',
    as: 'client'
  });
  
  Invoice.belongsTo(models.Project, {
    foreignKey: 'projectId',
    as: 'project'
  });
  
  Invoice.belongsTo(models.Employee, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
};

module.exports = Invoice;