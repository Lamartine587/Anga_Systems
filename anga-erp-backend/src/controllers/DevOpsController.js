const DevOpsService = require('../services/DevOpsService');
const { ErrorHandler } = require('../middleware/errorHandler');

class DevOpsController {
  // Project Metadata endpoints
  static async createProjectMeta(req, res, next) {
    try {
      const projectMeta = await DevOpsService.createProjectMeta(req.body);
      
      res.status(201).json({
        success: true,
        data: projectMeta
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getProjectMeta(req, res, next) {
    try {
      const projectMeta = await DevOpsService.getProjectMeta(req.params.projectId);
      
      res.json({
        success: true,
        data: projectMeta
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async updateProjectMeta(req, res, next) {
    try {
      const projectMeta = await DevOpsService.updateProjectMeta(req.params.projectId, req.body);
      
      res.json({
        success: true,
        data: projectMeta
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async updateDeploymentStatus(req, res, next) {
    try {
      const projectMeta = await DevOpsService.updateDeploymentStatus(req.params.projectId, req.body);
      
      res.json({
        success: true,
        data: projectMeta
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Maintenance Tickets endpoints
  static async createTicket(req, res, next) {
    try {
      const ticket = await DevOpsService.createTicket(req.body);
      
      res.status(201).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getTicket(req, res, next) {
    try {
      const ticket = await DevOpsService.getTicket(req.params.ticketId);
      
      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getTickets(req, res, next) {
    try {
      const filters = {
        projectId: req.query.projectId,
        clientId: req.query.clientId,
        status: req.query.status,
        priority: req.query.priority,
        category: req.query.category,
        assignedTo: req.query.assignedTo,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search
      };
      
      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: parseInt(req.query.sortOrder) || -1
      };
      
      const result = await DevOpsService.getTickets(filters, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async updateTicket(req, res, next) {
    try {
      const ticket = await DevOpsService.updateTicket(
        req.params.ticketId,
        req.body,
        req.userId
      );
      
      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async addTicketUpdate(req, res, next) {
    try {
      const ticket = await DevOpsService.addTicketUpdate(
        req.params.ticketId,
        req.body,
        req.userId
      );
      
      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async resolveTicket(req, res, next) {
    try {
      const ticket = await DevOpsService.resolveTicket(
        req.params.ticketId,
        req.body,
        req.userId
      );
      
      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getTicketStats(req, res, next) {
    try {
      const stats = await DevOpsService.getTicketStats(req.query.projectId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Server Logs endpoints
  static async createLog(req, res, next) {
    try {
      const log = await DevOpsService.createLog(req.body);
      
      res.status(201).json({
        success: true,
        data: log
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getLogs(req, res, next) {
    try {
      const filters = {
        projectId: req.query.projectId,
        logType: req.query.logType,
        severity: req.query.severity,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search
      };
      
      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 50,
        sortBy: req.query.sortBy || 'timestamp',
        sortOrder: parseInt(req.query.sortOrder) || -1
      };
      
      const result = await DevOpsService.getLogs(filters, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getLogStats(req, res, next) {
    try {
      const stats = await DevOpsService.getLogStats(
        req.params.projectId,
        req.query.timeRange
      );
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Monitoring endpoints
  static async performHealthCheck(req, res, next) {
    try {
      const result = await DevOpsService.performHealthCheck(req.params.projectId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getDashboardData(req, res, next) {
    try {
      const dashboardData = await DevOpsService.getDashboardData();
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DevOpsController;