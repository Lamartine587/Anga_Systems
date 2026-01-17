const ProjectMeta = require('../models/mongodb/ProjectMeta');
const MaintenanceTicket = require('../models/mongodb/MaintenanceTicket');
const ServerLog = require('../models/mongodb/ServerLog');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');

class DevOpsService {
  // Project Metadata Management
  
  static async createProjectMeta(projectData) {
    try {
      // Check if project meta already exists
      const existingMeta = await ProjectMeta.findOne({ projectId: projectData.projectId });
      
      if (existingMeta) {
        throw new BadRequestError('Project metadata already exists');
      }
      
      const projectMeta = new ProjectMeta(projectData);
      await projectMeta.save();
      
      return projectMeta;
    } catch (error) {
      throw error;
    }
  }
  
  static async getProjectMeta(projectId) {
    try {
      const projectMeta = await ProjectMeta.findOne({ projectId });
      
      if (!projectMeta) {
        throw new NotFoundError('Project metadata not found');
      }
      
      return projectMeta;
    } catch (error) {
      throw error;
    }
  }
  
  static async updateProjectMeta(projectId, updateData) {
    try {
      const projectMeta = await ProjectMeta.findOne({ projectId });
      
      if (!projectMeta) {
        throw new NotFoundError('Project metadata not found');
      }
      
      Object.assign(projectMeta, updateData);
      await projectMeta.save();
      
      return projectMeta;
    } catch (error) {
      throw error;
    }
  }
  
  static async updateDeploymentStatus(projectId, deploymentData) {
    try {
      const projectMeta = await ProjectMeta.findOne({ projectId });
      
      if (!projectMeta) {
        throw new NotFoundError('Project metadata not found');
      }
      
      if (!projectMeta.technicalMetadata.deployment) {
        projectMeta.technicalMetadata.deployment = {};
      }
      
      projectMeta.technicalMetadata.deployment.lastDeployed = new Date();
      projectMeta.technicalMetadata.deployment.deploymentMethod = deploymentData.method || 'manual';
      projectMeta.technicalMetadata.deployment.status = deploymentData.status || 'stable';
      
      if (!projectMeta.technicalMetadata.deployment.deploymentLog) {
        projectMeta.technicalMetadata.deployment.deploymentLog = [];
      }
      
      projectMeta.technicalMetadata.deployment.deploymentLog.push({
        timestamp: new Date(),
        action: deploymentData.action || 'deploy',
        user: deploymentData.user || 'system',
        status: deploymentData.status || 'success',
        message: deploymentData.message || 'Deployment completed'
      });
      
      await projectMeta.save();
      
      return projectMeta;
    } catch (error) {
      throw error;
    }
  }
  
  static async addAlert(projectId, alertData) {
    try {
      const projectMeta = await ProjectMeta.findOne({ projectId });
      
      if (!projectMeta) {
        throw new NotFoundError('Project metadata not found');
      }
      
      if (!projectMeta.alerts) {
        projectMeta.alerts = [];
      }
      
      projectMeta.alerts.push({
        timestamp: new Date(),
        type: alertData.type || 'system',
        severity: alertData.severity || 'warning',
        message: alertData.message,
        resolved: false
      });
      
      await projectMeta.save();
      
      return projectMeta;
    } catch (error) {
      throw error;
    }
  }
  
  // Maintenance Tickets Management
  
  static async createTicket(ticketData) {
    try {
      const ticket = new MaintenanceTicket(ticketData);
      await ticket.save();
      
      return ticket;
    } catch (error) {
      throw error;
    }
  }
  
  static async getTicket(ticketId) {
    try {
      const ticket = await MaintenanceTicket.findOne({ ticketId });
      
      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }
      
      return ticket;
    } catch (error) {
      throw error;
    }
  }
  
  static async getTickets(filters = {}, pagination = {}) {
    try {
      const {
        projectId,
        clientId,
        status,
        priority,
        category,
        assignedTo,
        startDate,
        endDate,
        search
      } = filters;
      
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = -1
      } = pagination;
      
      const query = {};
      
      if (projectId) query.projectId = projectId;
      if (clientId) query.clientId = clientId;
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (assignedTo) query.assignedTo = assignedTo;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      if (search) {
        query.$or = [
          { ticketId: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { issueDescription: { $regex: search, $options: 'i' } }
        ];
      }
      
      const total = await MaintenanceTicket.countDocuments(query);
      const tickets = await MaintenanceTicket.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      
      return {
        data: tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async updateTicket(ticketId, updateData, userId) {
    try {
      const ticket = await MaintenanceTicket.findOne({ ticketId });
      
      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }
      
      // Add update to history
      if (!ticket.updates) {
        ticket.updates = [];
      }
      
      ticket.updates.push({
        timestamp: new Date(),
        user: userId,
        action: 'update',
        description: updateData.updateDescription || 'Ticket updated'
      });
      
      // Update ticket fields
      Object.keys(updateData).forEach(key => {
        if (key !== 'updateDescription' && key !== 'userId') {
          ticket[key] = updateData[key];
        }
      });
      
      await ticket.save();
      
      return ticket;
    } catch (error) {
      throw error;
    }
  }
  
  static async addTicketUpdate(ticketId, updateData, userId) {
    try {
      const ticket = await MaintenanceTicket.findOne({ ticketId });
      
      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }
      
      if (!ticket.updates) {
        ticket.updates = [];
      }
      
      ticket.updates.push({
        timestamp: new Date(),
        user: userId,
        action: updateData.action || 'comment',
        description: updateData.description,
        attachments: updateData.attachments || [],
        timeSpent: updateData.timeSpent,
        internalNote: updateData.internalNote || false
      });
      
      // Update status if provided
      if (updateData.status) {
        ticket.status = updateData.status;
      }
      
      // Update time tracking
      if (updateData.timeSpent) {
        ticket.actualTime = (ticket.actualTime || 0) + updateData.timeSpent;
      }
      
      await ticket.save();
      
      return ticket;
    } catch (error) {
      throw error;
    }
  }
  
  static async resolveTicket(ticketId, resolutionData, userId) {
    try {
      const ticket = await MaintenanceTicket.findOne({ ticketId });
      
      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }
      
      ticket.status = 'resolved';
      ticket.resolution = {
        resolvedAt: new Date(),
        resolvedBy: userId,
        solution: resolutionData.solution,
        rootCause: resolutionData.rootCause,
        preventiveMeasures: resolutionData.preventiveMeasures,
        attachments: resolutionData.attachments || []
      };
      
      // Calculate metrics
      if (ticket.createdAt) {
        const timeToResolution = new Date() - ticket.createdAt;
        ticket.metrics = {
          timeToResolution: Math.floor(timeToResolution / (1000 * 60)), // in minutes
          ...ticket.metrics
        };
      }
      
      await ticket.save();
      
      return ticket;
    } catch (error) {
      throw error;
    }
  }
  
  static async getTicketStats(projectId = null) {
    try {
      const match = projectId ? { projectId } : {};
      
      const stats = await MaintenanceTicket.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgResolutionTime: { $avg: '$metrics.timeToResolution' }
          }
        }
      ]);
      
      const priorityStats = await MaintenanceTicket.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const categoryStats = await MaintenanceTicket.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Calculate SLA compliance
      const slaStats = await MaintenanceTicket.aggregate([
        { $match: { ...match, status: 'resolved' } },
        {
          $project: {
            slaMet: {
              $cond: {
                if: { $lte: ['$metrics.timeToResolution', 480] }, // 8 hours in minutes
                then: true,
                else: false
              }
            }
          }
        },
        {
          $group: {
            _id: '$slaMet',
            count: { $sum: 1 }
          }
        }
      ]);
      
      return {
        byStatus: stats,
        byPriority: priorityStats,
        byCategory: categoryStats,
        slaCompliance: slaStats
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Server Logs Management
  
  static async createLog(logData) {
    try {
      const log = new ServerLog(logData);
      await log.save();
      
      return log;
    } catch (error) {
      throw error;
    }
  }
  
  static async getLogs(filters = {}, pagination = {}) {
    try {
      const {
        projectId,
        logType,
        severity,
        startDate,
        endDate,
        search
      } = filters;
      
      const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = -1
      } = pagination;
      
      const query = {};
      
      if (projectId) query.projectId = projectId;
      if (logType) query.logType = logType;
      if (severity) query.severity = severity;
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      if (search) {
        query.$or = [
          { message: { $regex: search, $options: 'i' } },
          { source: { $regex: search, $options: 'i' } }
        ];
      }
      
      const total = await ServerLog.countDocuments(query);
      const logs = await ServerLog.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      
      return {
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async getLogStats(projectId, timeRange = '24h') {
    try {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      const match = {
        projectId,
        timestamp: { $gte: startDate, $lte: now }
      };
      
      const stats = await ServerLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              logType: '$logType',
              severity: '$severity'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.logType',
            severities: {
              $push: {
                severity: '$_id.severity',
                count: '$count'
              }
            },
            total: { $sum: '$count' }
          }
        }
      ]);
      
      const errorRate = await ServerLog.aggregate([
        { $match: { ...match, severity: { $in: ['error', 'critical'] } } },
        {
          $group: {
            _id: null,
            errorCount: { $sum: 1 },
            totalCount: { $sum: 1 }
          }
        }
      ]);
      
      const hourlyTrends = await ServerLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' }
            },
            count: { $sum: 1 },
            errors: {
              $sum: {
                $cond: [{ $in: ['$severity', ['error', 'critical']] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      return {
        summary: stats,
        errorRate: errorRate[0] || { errorCount: 0, totalCount: 0 },
        hourlyTrends,
        timeRange: {
          start: startDate,
          end: now
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Monitoring and Alerting
  
  static async performHealthCheck(projectId) {
    try {
      const projectMeta = await ProjectMeta.findOne({ projectId });
      
      if (!projectMeta) {
        throw new NotFoundError('Project metadata not found');
      }
      
      // Simulate health check (in reality, this would ping servers, check services, etc.)
      const healthStatus = {
        timestamp: new Date(),
        checks: {
          database: Math.random() > 0.1 ? 'healthy' : 'unhealthy',
          api: Math.random() > 0.05 ? 'healthy' : 'unhealthy',
          storage: Math.random() > 0.2 ? 'healthy' : 'unhealthy',
          network: Math.random() > 0.1 ? 'healthy' : 'unhealthy'
        },
        uptime: Math.floor(Math.random() * 100),
        responseTime: Math.floor(Math.random() * 500) + 50
      };
      
      // Update monitoring data
      projectMeta.monitoring = {
        ...projectMeta.monitoring,
        uptimeLast24h: healthStatus.uptime,
        averageResponseTime: healthStatus.responseTime,
        metrics: {
          cpu: { current: Math.random() * 100, max: 100, threshold: 80 },
          memory: { current: Math.random() * 100, max: 100, threshold: 85 },
          disk: { current: Math.random() * 100, max: 100, threshold: 90 },
          network: { in: Math.random() * 100, out: Math.random() * 50 }
        }
      };
      
      projectMeta.lastHealthCheck = new Date();
      
      // Check thresholds and create alerts if needed
      if (healthStatus.uptime < 95) {
        await this.addAlert(projectId, {
          type: 'uptime',
          severity: 'warning',
          message: `Uptime dropped to ${healthStatus.uptime}%`
        });
      }
      
      if (healthStatus.responseTime > 1000) {
        await this.addAlert(projectId, {
          type: 'performance',
          severity: 'warning',
          message: `High response time: ${healthStatus.responseTime}ms`
        });
      }
      
      await projectMeta.save();
      
      return {
        projectId,
        status: healthStatus,
        metadata: projectMeta
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async getDashboardData() {
    try {
      // Get recent tickets
      const recentTickets = await MaintenanceTicket.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      // Get active alerts
      const activeAlerts = await ProjectMeta.aggregate([
        { $unwind: '$alerts' },
        { $match: { 'alerts.resolved': false } },
        { $sort: { 'alerts.timestamp': -1 } },
        { $limit: 10 }
      ]);
      
      // Get system health summary
      const allProjects = await ProjectMeta.find({}, 'projectId monitoring lastHealthCheck');
      
      const healthSummary = allProjects.map(project => ({
        projectId: project.projectId,
        lastCheck: project.lastHealthCheck,
        uptime: project.monitoring?.uptimeLast24h || 0,
        status: project.monitoring?.uptimeLast24h > 95 ? 'healthy' : 'degraded'
      }));
      
      // Get log statistics
      const logStats = await ServerLog.aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ]);
      
      return {
        recentTickets,
        activeAlerts,
        healthSummary,
        logStats,
        timestamp: new Date()
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DevOpsService;