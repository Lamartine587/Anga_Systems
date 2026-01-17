const Joi = require('joi');

class ValidationMiddleware {
  static validate(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }
      
      req.body = value;
      next();
    };
  }
}

// Validation Schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'manager', 'employee', 'client')
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  // Employee schemas
  createEmployee: Joi.object({
    employeeCode: Joi.string().min(3).max(20).required(),
    fullName: Joi.string().min(5).max(100).required(),
    email: Joi.string().email().required(),
    department: Joi.string().valid('hr', 'finance', 'devops', 'marketing', 'development').required(),
    role: Joi.string().min(2).max(50).required(),
    salary: Joi.number().min(0).required(),
    hireDate: Joi.date().required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    address: Joi.string().optional()
  }),
  
  // Client schemas
  createClient: Joi.object({
    companyName: Joi.string().min(2).max(200).required(),
    contactPerson: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    country: Joi.string().optional(),
    serviceTier: Joi.string().valid('basic', 'standard', 'premium', 'enterprise').optional(),
    creditLimit: Joi.number().min(0).optional(),
    paymentTerms: Joi.number().min(0).optional()
  }),
  
  // Invoice schemas
  createInvoice: Joi.object({
    clientId: Joi.string().uuid().required(),
    projectId: Joi.string().uuid().optional(),
    items: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        unitPrice: Joi.number().min(0).required(),
        taxRate: Joi.number().min(0).max(100).optional()
      })
    ).min(1).required(),
    issueDate: Joi.date().required(),
    dueDate: Joi.date().min(Joi.ref('issueDate')).required(),
    currency: Joi.string().length(3).optional(),
    notes: Joi.string().optional(),
    discount: Joi.number().min(0).optional()
  }),
  
  // Project schemas
  createProject: Joi.object({
    clientId: Joi.string().uuid().required(),
    projectName: Joi.string().min(3).max(200).required(),
    projectType: Joi.string().valid('web', 'app', 'maintenance', 'consulting').required(),
    description: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    estimatedHours: Joi.number().min(0).optional(),
    budget: Joi.number().min(0).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    assignedTo: Joi.string().uuid().optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),
  
  // Lead schemas
  createLead: Joi.object({
    fullName: Joi.string().min(5).max(100).required(),
    companyName: Joi.string().optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    serviceInterest: Joi.array().items(Joi.string()).optional(),
    message: Joi.string().optional(),
    budgetRange: Joi.string().valid('under_50k', '50k_100k', '100k_500k', '500k_1m', 'over_1m').optional(),
    leadSource: Joi.string().valid('website', 'referral', 'social', 'email', 'phone', 'event').optional()
  }),
  
  // Payment schemas
  processPayment: Joi.object({
    invoiceId: Joi.string().uuid().required(),
    amount: Joi.number().min(0.01).required(),
    paymentMethod: Joi.string().valid('mpesa', 'bank_transfer', 'card', 'cash').required(),
    paymentReference: Joi.string().optional(),
    notes: Joi.string().optional()
  }),
  
  // Ticket schemas (MongoDB)
  createTicket: Joi.object({
    projectId: Joi.string().required(),
    priority: Joi.string().valid('critical', 'high', 'medium', 'low').optional(),
    category: Joi.string().valid('bug', 'feature', 'maintenance', 'security', 'performance', 'other').optional(),
    title: Joi.string().min(5).max(200).required(),
    issueDescription: Joi.string().min(10).required(),
    reportedBy: Joi.string().optional(),
    reportedEmail: Joi.string().email().optional(),
    assignedTo: Joi.string().optional(),
    timeEstimate: Joi.number().min(0).optional(),
    dueDate: Joi.date().optional()
  })
};

module.exports = {
  ValidationMiddleware,
  schemas
};