const express = require('express');
const router = express.Router();
const DevOpsController = require('../controllers/DevOpsController');
const { ValidationMiddleware, schemas } = require('../middleware/validation');
const AuthMiddleware = require('../middleware/auth');
const { ErrorHandler } = require('../middleware/errorHandler');

// All DevOps routes require authentication
router.use(AuthMiddleware.authenticate);

// Project Metadata routes
router.post(
  '/projects/meta',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.createProjectMeta)
);

router.get(
  '/projects/meta/:projectId',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.getProjectMeta)
);

router.put(
  '/projects/meta/:projectId',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.updateProjectMeta)
);

router.post(
  '/projects/meta/:projectId/deploy',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.updateDeploymentStatus)
);

// Maintenance Tickets routes
router.post(
  '/tickets',
  AuthMiddleware.authorize('admin', 'manager', 'employee', 'client'),
  ValidationMiddleware.validate(schemas.createTicket),
  ErrorHandler.asyncHandler(DevOpsController.createTicket)
);

router.get(
  '/tickets',
  AuthMiddleware.authorize('admin', 'manager', 'employee', 'client'),
  ErrorHandler.asyncHandler(DevOpsController.getTickets)
);

router.get(
  '/tickets/:ticketId',
  AuthMiddleware.authorize('admin', 'manager', 'employee', 'client'),
  ErrorHandler.asyncHandler(DevOpsController.getTicket)
);

router.put(
  '/tickets/:ticketId',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.updateTicket)
);

router.post(
  '/tickets/:ticketId/updates',
  AuthMiddleware.authorize('admin', 'manager', 'employee', 'client'),
  ErrorHandler.asyncHandler(DevOpsController.addTicketUpdate)
);

router.post(
  '/tickets/:ticketId/resolve',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.resolveTicket)
);

router.get(
  '/tickets/stats',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.getTicketStats)
);

// Server Logs routes
router.post(
  '/logs',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.createLog)
);

router.get(
  '/logs',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.getLogs)
);

router.get(
  '/logs/:projectId/stats',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.getLogStats)
);

// Monitoring routes
router.post(
  '/monitoring/:projectId/health-check',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.performHealthCheck)
);

router.get(
  '/dashboard',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(DevOpsController.getDashboardData)
);

// Client-specific routes
router.get(
  '/client/tickets',
  AuthMiddleware.authorize('client'),
  ErrorHandler.asyncHandler(DevOpsController.getTickets)
);

router.post(
  '/client/tickets',
  AuthMiddleware.authorize('client'),
  ValidationMiddleware.validate(schemas.createTicket),
  ErrorHandler.asyncHandler(DevOpsController.createTicket)
);

router.get(
  '/client/tickets/:ticketId',
  AuthMiddleware.authorize('client'),
  ErrorHandler.asyncHandler(DevOpsController.getTicket)
);

router.post(
  '/client/tickets/:ticketId/updates',
  AuthMiddleware.authorize('client'),
  ErrorHandler.asyncHandler(DevOpsController.addTicketUpdate)
);

module.exports = router;