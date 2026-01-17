const express = require('express');
const router = express.Router();
const { Lead } = require('../models/postgres/Lead');
const { Client } = require('../models/postgres/Client');
const { ValidationMiddleware, schemas } = require('../middleware/validation');
const { ErrorHandler } = require('../middleware/errorHandler');
const emailService = require('../services/EmailService');

// Public routes (no authentication required for lead capture)
router.post(
  '/leads',
  ValidationMiddleware.validate(schemas.createLead),
  ErrorHandler.asyncHandler(async (req, res) => {
    try {
      const lead = await Lead.create(req.body);
      
      // Notify sales team
      // emailService.sendNewLeadNotification(lead);
      
      res.status(201).json({
        success: true,
        data: lead,
        message: 'Thank you for your interest! We will contact you soon.'
      });
    } catch (error) {
      throw error;
    }
  })
);

// Protected routes
const AuthMiddleware = require('../middleware/auth');
const MarketingController = require('../controllers/MarketingController');

router.use(AuthMiddleware.authenticate);

router.get(
  '/leads',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(async (req, res) => {
    try {
      const { status, assignedTo, startDate, endDate, page = 1, limit = 20 } = req.query;
      
      const where = {};
      if (status) where.status = status;
      if (assignedTo) where.assignedTo = assignedTo;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }
      
      const { count, rows } = await Lead.findAndCountAll({
        where,
        include: [{
          model: require('../models/postgres/Employee'),
          as: 'assignedEmployee',
          attributes: ['id', 'fullName', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      throw error;
    }
  })
);

router.put(
  '/leads/:id',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(async (req, res) => {
    try {
      const lead = await Lead.findByPk(req.params.id);
      
      if (!lead) {
        throw new ErrorHandler.NotFoundError('Lead not found');
      }
      
      await lead.update(req.body);
      
      // If converting lead to client
      if (req.body.status === 'won' && !lead.convertedToClient) {
        const client = await Client.create({
          companyName: lead.companyName || lead.fullName,
          contactPerson: lead.fullName,
          email: lead.email,
          phone: lead.phone,
          serviceTier: 'standard',
          status: 'active'
        });
        
        await lead.update({
          convertedToClient: true,
          convertedClientId: client.id,
          conversionDate: new Date()
        });
      }
      
      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      throw error;
    }
  })
);

router.get(
  '/analytics',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(async (req, res) => {
    try {
      // Get lead conversion stats
      const leadStats = await Lead.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });
      
      // Get conversion rate
      const totalLeads = await Lead.count();
      const convertedLeads = await Lead.count({ where: { convertedToClient: true } });
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      
      // Get leads by source
      const leadsBySource = await Lead.findAll({
        attributes: [
          'leadSource',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('AVG', Sequelize.literal('CASE WHEN converted_to_client THEN 1 ELSE 0 END')), 'conversionRate']
        ],
        group: ['leadSource'],
        raw: true
      });
      
      // Monthly trends
      const monthlyTrends = await Lead.findAll({
        attributes: [
          [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('createdAt')), 'month'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'leadCount'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN converted_to_client THEN 1 ELSE 0 END')), 'convertedCount']
        ],
        where: {
          createdAt: { [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        },
        group: ['month'],
        order: [['month', 'ASC']],
        raw: true
      });
      
      res.json({
        success: true,
        data: {
          leadStats,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          leadsBySource,
          monthlyTrends,
          totals: {
            totalLeads,
            convertedLeads,
            activeLeads: await Lead.count({ where: { status: 'new' } })
          }
        }
      });
    } catch (error) {
      throw error;
    }
  })
);

module.exports = router;