const AuthService = require('../services/AuthService');
const { ValidationMiddleware, schemas } = require('../middleware/validation');
const { ErrorHandler } = require('../middleware/errorHandler');

class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await AuthService.login(email, password);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getProfile(req, res, next) {
    try {
      const profile = await AuthService.getProfile(req.userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async updateProfile(req, res, next) {
    try {
      const updatedProfile = await AuthService.updateProfile(req.userId, req.body);
      
      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token required'
        });
      }
      
      // This would be handled by the AuthMiddleware.refreshToken
      // For now, return success
      res.json({
        success: true,
        message: 'Token refreshed'
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Verification token required'
        });
      }
      
      const result = await AuthService.verifyEmail(token);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      
      const result = await AuthService.requestPasswordReset(email);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      
      const result = await AuthService.resetPassword(token, password);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async logout(req, res, next) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // For enhanced security, you might want to implement a token blacklist
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;