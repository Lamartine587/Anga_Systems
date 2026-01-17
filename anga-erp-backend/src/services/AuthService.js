const bcrypt = require('bcryptjs');
const { User } = require('../models/postgres/User');
const { Employee } = require('../models/postgres/Employee');
const { Client } = require('../models/postgres/Client');
const AuthMiddleware = require('../middleware/auth');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const config = require('../config');
const emailService = require('./EmailService');

class AuthService {
  static async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: userData.email },
            { username: userData.username }
          ]
        }
      });
      
      if (existingUser) {
        throw new BadRequestError('User with this email or username already exists');
      }
      
      // Create user
      const user = await User.create(userData);
      
      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user.id, type: 'email_verification' },
        config.jwt.secret,
        { expiresIn: '24h' }
      );
      
      // Send verification email
      await emailService.sendVerificationEmail(user.email, verificationToken);
      
      // Generate auth tokens
      const tokens = AuthMiddleware.generateTokens(user);
      
      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async login(email, password) {
    try {
      const user = await User.findOne({
        where: { email }
      });
      
      if (!user) {
        throw new BadRequestError('Invalid credentials');
      }
      
      if (!user.isActive) {
        throw new BadRequestError('Account is deactivated');
      }
      
      const isValidPassword = await user.validatePassword(password);
      
      if (!isValidPassword) {
        throw new BadRequestError('Invalid credentials');
      }
      
      // Update last login
      await user.update({ lastLogin: new Date() });
      
      // Generate tokens
      const tokens = AuthMiddleware.generateTokens(user);
      
      // Get additional user data based on role
      let profile = null;
      
      if (user.role === 'employee') {
        profile = await Employee.findOne({
          where: { userId: user.id },
          attributes: { exclude: ['userId'] }
        });
      } else if (user.role === 'client') {
        profile = await Client.findOne({
          where: { userId: user.id },
          attributes: { exclude: ['userId'] }
        });
      }
      
      return {
        user: {
          ...user.toJSON(),
          profile
        },
        tokens
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async getProfile(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      let profile = null;
      
      if (user.role === 'employee') {
        profile = await Employee.findOne({
          where: { userId: user.id }
        });
      } else if (user.role === 'client') {
        profile = await Client.findOne({
          where: { userId: user.id }
        });
      }
      
      return {
        ...user.toJSON(),
        profile
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async updateProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Don't allow role or email updates via this endpoint
      if (updateData.role || updateData.email) {
        throw new BadRequestError('Cannot update role or email');
      }
      
      // Update password separately if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, config.bcrypt.saltRounds);
      }
      
      await user.update(updateData);
      
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }
  
  static async verifyEmail(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (decoded.type !== 'email_verification') {
        throw new BadRequestError('Invalid token type');
      }
      
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      if (user.emailVerified) {
        return { message: 'Email already verified' };
      }
      
      await user.update({ emailVerified: true });
      
      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new BadRequestError('Invalid or expired verification token');
    }
  }
  
  static async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Don't reveal that user doesn't exist
        return { message: 'If an account exists, a reset email will be sent' };
      }
      
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );
      
      await emailService.sendPasswordResetEmail(user.email, resetToken);
      
      return { message: 'Password reset email sent' };
    } catch (error) {
      throw error;
    }
  }
  
  static async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (decoded.type !== 'password_reset') {
        throw new BadRequestError('Invalid token type');
      }
      
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
      
      await user.update({ password: hashedPassword });
      
      // Invalidate all existing tokens by updating password
      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new BadRequestError('Invalid or expired reset token');
    }
  }
}

module.exports = AuthService;