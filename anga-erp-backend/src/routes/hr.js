const express = require('express');
const router = express.Router();
const HRController = require('../controllers/HRController');
const { ValidationMiddleware, schemas } = require('../middleware/validation');
const AuthMiddleware = require('../middleware/auth');
const { ErrorHandler } = require('../middleware/errorHandler');

// All HR routes require authentication
router.use(AuthMiddleware.authenticate);

// Employee routes
router.post(
  '/employees',
  AuthMiddleware.authorize('admin', 'manager'),
  ValidationMiddleware.validate(schemas.createEmployee),
  ErrorHandler.asyncHandler(HRController.createEmployee)
);

router.get(
  '/employees',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(HRController.getEmployees)
);

router.get(
  '/employees/:id',
  AuthMiddleware.authorize('admin', 'manager', 'employee'),
  ErrorHandler.asyncHandler(HRController.getEmployee)
);

router.put(
  '/employees/:id',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(HRController.updateEmployee)
);

router.delete(
  '/employees/:id',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(HRController.deleteEmployee)
);

// Payroll routes
router.get(
  '/payroll',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(HRController.generatePayroll)
);

router.get(
  '/payroll/report',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(HRController.getPayrollReport)
);

router.get(
  '/payroll/export',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(HRController.exportPayroll)
);

// Stats and analytics
router.get(
  '/stats/employees',
  AuthMiddleware.authorize('admin', 'manager'),
  ErrorHandler.asyncHandler(HRController.getEmployeeStats)
);

// Employee self-service routes
router.get(
  '/my-profile',
  AuthMiddleware.authorize('employee'),
  ErrorHandler.asyncHandler(HRController.getEmployee)
);

router.get(
  '/my-payroll',
  AuthMiddleware.authorize('employee'),
  ErrorHandler.asyncHandler(HRController.getPayrollReport)
);

module.exports = router;