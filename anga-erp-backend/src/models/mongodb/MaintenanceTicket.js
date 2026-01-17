const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UpdateSchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  user: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  description: String,
  attachments: [String],
  internalNote: Boolean,
  timeSpent: Number // in minutes
});

const ResolutionSchema = new Schema({
  resolvedAt: Date,
  resolvedBy: String,
  solution: String,
  rootCause: String,
  preventiveMeasures: String,
  attachments: [String]
});

const MetricsSchema = new Schema({
  timeToFirstResponse: Number, // in minutes
  timeToResolution: Number, // in minutes
  customerSatisfaction: Number, // 1-5
  feedback: String
});

const MaintenanceTicketSchema = new Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  projectId: {
    type: String,
    required: true,
    index: true
  },
  clientId: {
    type: String,
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['bug', 'feature', 'maintenance', 'security', 'performance', 'other'],
    default: 'bug'
  },
  title: {
    type: String,
    required: true
  },
  issueDescription: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'on_hold'],
    default: 'open'
  },
  reportedBy: {
    type: String,
    required: true
  },
  reportedEmail: String,
  assignedTo: String,
  timeEstimate: Number, // in hours
  actualTime: Number, // in hours
  updates: [UpdateSchema],
  resolution: ResolutionSchema,
  metrics: MetricsSchema,
  tags: [String],
  relatedTickets: [String],
  scheduledFor: Date,
  dueDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate ticket ID
MaintenanceTicketSchema.pre('save', function(next) {
  if (!this.ticketId) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.ticketId = `TKT-${dateStr}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Create indexes
MaintenanceTicketSchema.index({ ticketId: 1 }, { unique: true });
MaintenanceTicketSchema.index({ projectId: 1, status: 1 });
MaintenanceTicketSchema.index({ clientId: 1 });
MaintenanceTicketSchema.index({ priority: 1 });
MaintenanceTicketSchema.index({ status: 1 });
MaintenanceTicketSchema.index({ assignedTo: 1 });
MaintenanceTicketSchema.index({ createdAt: -1 });
MaintenanceTicketSchema.index({ dueDate: 1 });

module.exports = mongoose.model('MaintenanceTicket', MaintenanceTicketSchema);