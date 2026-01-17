const HRService = require('../services/HRService');
const { ErrorHandler } = require('../middleware/errorHandler');

class HRController {
  static async createEmployee(req, res, next) {
    try {
      const employee = await HRService.createEmployee(req.body);
      
      res.status(201).json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getEmployee(req, res, next) {
    try {
      const employee = await HRService.getEmployee(req.params.id);
      
      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getEmployees(req, res, next) {
    try {
      const filters = {
        department: req.query.department,
        status: req.query.status,
        search: req.query.search,
        minSalary: req.query.minSalary,
        maxSalary: req.query.maxSalary
      };
      
      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'DESC'
      };
      
      const result = await HRService.getEmployees(filters, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async updateEmployee(req, res, next) {
    try {
      const employee = await HRService.updateEmployee(req.params.id, req.body);
      
      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async deleteEmployee(req, res, next) {
    try {
      const result = await HRService.deleteEmployee(req.params.id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async generatePayroll(req, res, next) {
    try {
      const { month, year } = req.query;
      
      if (!month || !year) {
        return res.status(400).json({
          success: false,
          error: 'Month and year are required'
        });
      }
      
      const payroll = await HRService.calculatePayroll(parseInt(month), parseInt(year));
      
      res.json({
        success: true,
        data: payroll
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getPayrollReport(req, res, next) {
    try {
      const { month, year } = req.query;
      
      if (!month || !year) {
        return res.status(400).json({
          success: false,
          error: 'Month and year are required'
        });
      }
      
      const report = await HRService.generatePayrollReport(parseInt(month), parseInt(year));
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getEmployeeStats(req, res, next) {
    try {
      const stats = await HRService.getEmployeeStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async exportPayroll(req, res, next) {
    try {
      const { month, year } = req.query;
      
      if (!month || !year) {
        return res.status(400).json({
          success: false,
          error: 'Month and year are required'
        });
      }
      
      const report = await HRService.generatePayrollReport(parseInt(month), parseInt(year));
      
      // Generate CSV or Excel file
      // For now, return JSON
      res.json({
        success: true,
        data: report,
        downloadUrl: `/api/hr/payroll/export?month=${month}&year=${year}&format=csv`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = HRController;