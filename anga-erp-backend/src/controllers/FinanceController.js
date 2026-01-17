const FinanceService = require('../services/FinanceService');
const { ErrorHandler } = require('../middleware/errorHandler');

class FinanceController {
  static async createInvoice(req, res, next) {
    try {
      const invoice = await FinanceService.createInvoice(req.body, req.userId);
      
      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getInvoice(req, res, next) {
    try {
      const invoice = await FinanceService.getInvoice(req.params.id);
      
      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getInvoices(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        clientId: req.query.clientId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        minAmount: req.query.minAmount,
        maxAmount: req.query.maxAmount,
        search: req.query.search
      };
      
      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'DESC'
      };
      
      const result = await FinanceService.getInvoices(filters, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async updateInvoice(req, res, next) {
    try {
      const invoice = await FinanceService.updateInvoice(req.params.id, req.body, req.userId);
      
      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async deleteInvoice(req, res, next) {
    try {
      const result = await FinanceService.deleteInvoice(req.params.id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async processPayment(req, res, next) {
    try {
      const invoice = await FinanceService.processPayment(req.params.id, req.body, req.userId);
      
      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getFinancialReports(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        groupBy: req.query.groupBy
      };
      
      const reports = await FinanceService.getFinancialReports(filters);
      
      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async downloadInvoice(req, res, next) {
    try {
      const invoice = await FinanceService.getInvoice(req.params.id);
      
      // Generate PDF (would use a library like pdfkit or puppeteer)
      // For now, return JSON
      res.json({
        success: true,
        data: invoice,
        downloadUrl: `/api/finance/invoices/${req.params.id}/pdf`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FinanceController;