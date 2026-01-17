const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { ValidationMiddleware, schemas } = require('../middleware/validation');
const AuthMiddleware = require('../middleware/auth');
const { ErrorHandler } = require('../middleware/errorHandler');

// Public routes
router.post(
  '/register',
  ValidationMiddleware.validate(schemas.register),
  ErrorHandler.asyncHandler(AuthController.register)
);

router.post(
  '/login',
  ValidationMiddleware.validate(schemas.login),
  ErrorHandler.asyncHandler(AuthController.login)
);

router.post(
  '/refresh-token',
  ErrorHandler.asyncHandler(AuthController.refreshToken)
);

router.get(
  '/verify-email',
  ErrorHandler.asyncHandler(AuthController.verifyEmail)
);

router.post(
  '/request-password-reset',
  ErrorHandler.asyncHandler(AuthController.requestPasswordReset)
);

router.post(
  '/reset-password',
  ErrorHandler.asyncHandler(AuthController.resetPassword)
);

// Protected routes
router.get(
  '/profile',
  AuthMiddleware.authenticate,
  ErrorHandler.asyncHandler(AuthController.getProfile)
);

router.put(
  '/profile',
  AuthMiddleware.authenticate,
  ErrorHandler.asyncHandler(AuthController.updateProfile)
);

router.post(
  '/logout',
  AuthMiddleware.authenticate,
  ErrorHandler.asyncHandler(AuthController.logout)
);

module.exports = router;