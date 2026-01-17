const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models/postgres/User');

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        
        // Verify user still exists and is active
        const user = await User.findByPk(decoded.userId);
        
        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            error: 'User account is inactive or deleted'
          });
        }
        
        // Update last login
        await user.update({ lastLogin: new Date() });
        
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  static authorize(...roles) {
    return (req, res, next) => {
      if (!req.userRole) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      if (!roles.includes(req.userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      next();
    };
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
      
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      const user = await User.findByPk(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }
      
      // Generate new tokens
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      const newRefreshToken = jwt.sign(
        { userId: user.id, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );
      
      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          user: user.toJSON()
        }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  }

  static generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
    
    return { accessToken, refreshToken };
  }
}

module.exports = AuthMiddleware;