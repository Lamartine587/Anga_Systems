const express = require('express');
const router = express.Router();
const FinanceController = require('../controllers/FinanceController');
const { ValidationMiddleware, schemas } = require('../middleware/validation');
const AuthMiddleware = require('../middleware/auth');
const { ErrorHandler } = require('../middleware/errorHandler');

// All finance routes require authentication
router.use(AuthMiddleware.authenticate);

// Invoice routes
router.post(
  '/invoices',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ValidationMiddleware.validate(schemas.createInvoice),
  ErrorHandler.asyncHandler(FinanceController.createInvoice)
);

router.get(
  '/invoices',
  AuthMiddleware.authorize('admin', 'manager', 'employee', 'client'),
  ErrorHandler.asyncHandler(FinanceController.getInvoices)
);

router.get(
  '/invoices/:id',
  AuthMiddleware.authorize('admin', 'manager', 'employee', 'client'),
  ErrorHandler.asyncHandler(FinanceController.getInvoice)
);

router.put(
  '/invoices/:id',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(FinanceController.updateInvoice)
);

router.delete(
  '/invoices/:id',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(FinanceController.deleteInvoice)
);

router.post(
  '/invoices/:id/pay',
  AuthMiddleware.authorize('admin', 'manager', 'client'),
  ValidationMiddleware.validate(schemas.processPayment),
  ErrorHandler.asyncHandler(FinanceController.processPayment)
);

router.get(
  '/invoices/:id/download',
  AuthMiddleware.authorize('admin', 'manager', 'employee', 'client'),
  ErrorHandler.asyncHandler(FinanceController.downloadInvoice)
);

// Reports routes
router.get(
  '/reports/sales',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(FinanceController.getFinancialReports)
);

router.get(
  '/reports/expenses',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(FinanceController.getFinancialReports)
);

// Client-specific routes
router.get(
  '/client/invoices',
  AuthMiddleware.authorize('client'),
  ErrorHandler.asyncHandler(FinanceController.getInvoices)
);

router.get(
  '/client/invoices/:id',
  AuthMiddleware.authorize('client'),
  ErrorHandler.asyncHandler(FinanceController.getInvoice)
);

router.post(
  '/client/invoices/:id/pay',
  AuthMiddleware.authorize('client'),
  ErrorHandler.asyncHandler(FinanceController.processPayment)
);

module.exports = router;