const { Op } = require('sequelize');
const { Invoice, Client, Project, Employee } = require('../models/postgres');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');

class FinanceService {
  static async createInvoice(invoiceData, createdBy) {
    try {
      // Verify client exists
      const client = await Client.findByPk(invoiceData.clientId);
      if (!client) {
        throw new NotFoundError('Client not found');
      }
      
      // Verify project exists if provided
      if (invoiceData.projectId) {
        const project = await Project.findByPk(invoiceData.projectId);
        if (!project) {
          throw new NotFoundError('Project not found');
        }
      }
      
      // Calculate totals
      let subtotal = 0;
      const items = invoiceData.items.map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        
        return {
          ...item,
          total: itemTotal
        };
      });
      
      const taxRate = invoiceData.taxRate || 16.0;
      const taxAmount = (subtotal * taxRate) / 100;
      const discount = invoiceData.discount || 0;
      const totalAmount = subtotal + taxAmount - discount;
      
      // Create invoice
      const invoice = await Invoice.create({
        ...invoiceData,
        items,
        amount: subtotal,
        taxAmount,
        totalAmount,
        taxRate,
        discount,
        createdBy,
        status: 'pending'
      });
      
      // Populate relationships
      await invoice.reload({
        include: [
          { model: Client, as: 'client' },
          { model: Project, as: 'project' },
          { model: Employee, as: 'creator' }
        ]
      });
      
      return invoice;
    } catch (error) {
      throw error;
    }
  }
  
  static async getInvoice(id) {
    try {
      const invoice = await Invoice.findByPk(id, {
        include: [
          { model: Client, as: 'client' },
          { model: Project, as: 'project' },
          { model: Employee, as: 'creator' }
        ]
      });
      
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }
      
      return invoice;
    } catch (error) {
      throw error;
    }
  }
  
  static async getInvoices(filters = {}, pagination = {}) {
    try {
      const {
        status,
        clientId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search
      } = filters;
      
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = pagination;
      
      const offset = (page - 1) * limit;
      
      const where = {};
      
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      
      if (startDate || endDate) {
        where.issueDate = {};
        if (startDate) where.issueDate[Op.gte] = startDate;
        if (endDate) where.issueDate[Op.lte] = endDate;
      }
      
      if (minAmount || maxAmount) {
        where.totalAmount = {};
        if (minAmount) where.totalAmount[Op.gte] = minAmount;
        if (maxAmount) where.totalAmount[Op.lte] = maxAmount;
      }
      
      if (search) {
        where[Op.or] = [
          { invoiceNumber: { [Op.iLike]: `%${search}%` } },
          { '$client.companyName$': { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const { count, rows } = await Invoice.findAndCountAll({
        where,
        include: [
          { model: Client, as: 'client', attributes: ['id', 'companyName', 'contactPerson'] },
          { model: Project, as: 'project', attributes: ['id', 'projectName'] }
        ],
        order: [[sortBy, sortOrder]],
        limit,
        offset,
        distinct: true
      });
      
      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async updateInvoice(id, updateData, userId) {
    try {
      const invoice = await Invoice.findByPk(id);
      
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }
      
      // Only allow certain updates based on status
      if (invoice.status === 'paid') {
        throw new BadRequestError('Cannot update a paid invoice');
      }
      
      if (updateData.status === 'paid') {
        // Process payment
        updateData.paymentDate = new Date();
      }
      
      await invoice.update(updateData);
      
      return await invoice.reload({
        include: [
          { model: Client, as: 'client' },
          { model: Project, as: 'project' }
        ]
      });
    } catch (error) {
      throw error;
    }
  }
  
  static async deleteInvoice(id) {
    try {
      const invoice = await Invoice.findByPk(id);
      
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }
      
      // Only allow deletion of draft invoices
      if (invoice.status !== 'draft') {
        throw new BadRequestError('Can only delete draft invoices');
      }
      
      await invoice.destroy();
      
      return { message: 'Invoice deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
  
  static async processPayment(invoiceId, paymentData, processedBy) {
    try {
      const invoice = await Invoice.findByPk(invoiceId);
      
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }
      
      if (invoice.status === 'paid') {
        throw new BadRequestError('Invoice is already paid');
      }
      
      if (paymentData.amount > invoice.totalAmount) {
        throw new BadRequestError('Payment amount exceeds invoice total');
      }
      
      const updateData = {
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        paymentDate: new Date()
      };
      
      if (paymentData.amount === invoice.totalAmount) {
        updateData.status = 'paid';
      } else {
        updateData.status = 'partially_paid';
        // Store partial payment info
        updateData.partialPayments = [
          ...(invoice.partialPayments || []),
          {
            amount: paymentData.amount,
            date: new Date(),
            method: paymentData.paymentMethod,
            reference: paymentData.paymentReference,
            processedBy
          }
        ];
      }
      
      await invoice.update(updateData);
      
      // Record transaction in ledger (would integrate with accounting system)
      await this.recordTransaction({
        type: 'payment_received',
        amount: paymentData.amount,
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        reference: paymentData.paymentReference,
        notes: paymentData.notes
      });
      
      return await invoice.reload({
        include: [{ model: Client, as: 'client' }]
      });
    } catch (error) {
      throw error;
    }
  }
  
  static async getFinancialReports(filters = {}) {
    try {
      const { startDate, endDate, groupBy = 'month' } = filters;
      
      const where = {};
      
      if (startDate || endDate) {
        where.issueDate = {};
        if (startDate) where.issueDate[Op.gte] = startDate;
        if (endDate) where.issueDate[Op.lte] = endDate;
      }
      
      // Get sales summary
      const salesSummary = await Invoice.findAll({
        where: {
          ...where,
          status: { [Op.in]: ['paid', 'partially_paid'] }
        },
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalSales'],
          [Sequelize.fn('SUM', Sequelize.col('taxAmount')), 'totalTax'],
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'invoiceCount']
        ],
        raw: true
      });
      
      // Get sales by status
      const salesByStatus = await Invoice.findAll({
        where,
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'total']
        ],
        group: ['status'],
        raw: true
      });
      
      // Get monthly trends
      let groupByClause;
      switch (groupBy) {
        case 'day':
          groupByClause = Sequelize.fn('DATE', Sequelize.col('issueDate'));
          break;
        case 'month':
          groupByClause = Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('issueDate'));
          break;
        case 'year':
          groupByClause = Sequelize.fn('DATE_TRUNC', 'year', Sequelize.col('issueDate'));
          break;
        default:
          groupByClause = Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('issueDate'));
      }
      
      const monthlyTrends = await Invoice.findAll({
        where: {
          ...where,
          status: { [Op.in]: ['paid', 'partially_paid'] }
        },
        attributes: [
          [groupByClause, 'period'],
          [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'total'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['period'],
        order: [['period', 'ASC']],
        raw: true
      });
      
      // Get top clients
      const topClients = await Invoice.findAll({
        where: {
          ...where,
          status: { [Op.in]: ['paid', 'partially_paid'] }
        },
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName']
        }],
        attributes: [
          'clientId',
          [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalSpent'],
          [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'invoiceCount']
        ],
        group: ['clientId', 'client.id'],
        order: [[Sequelize.literal('totalSpent'), 'DESC']],
        limit: 10,
        raw: true
      });
      
      return {
        salesSummary: salesSummary[0] || {},
        salesByStatus,
        monthlyTrends,
        topClients
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async recordTransaction(transactionData) {
    try {
      // This would connect to an accounting ledger
      // For now, we'll just log it
      console.log('Transaction recorded:', transactionData);
      
      // In a real implementation, this would save to a transactions table
      return { message: 'Transaction recorded' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = FinanceService;