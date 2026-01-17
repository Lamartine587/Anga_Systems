const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServerLogSchema = new Schema({
  logId: {
    type: String,
    required: true,
    index: true
  },
  projectId: {
    type: String,
    required: true,
    index: true
  },
  serverId: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  logType: {
    type: String,
    enum: ['access', 'error', 'performance', 'security', 'application', 'system'],
    default: 'access'
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  source: String,
  message: {
    type: String,
    required: true
  },
  metadata: Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  endpoint: String,
  responseTime: Number,
  statusCode: Number,
  method: String,
  userId: String,
  sessionId: String,
  indexedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'projectId',
    granularity: 'hours'
  },
  expireAfterSeconds: 30 * 24 * 60 * 60 // 30 days TTL
});

// Pre-save hook to generate log ID
ServerLogSchema.pre('save', function(next) {
  if (!this.logId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    this.logId = `LOG-${timestamp}-${random}`;
  }
  next();
});

// Create indexes for efficient querying
ServerLogSchema.index({ projectId: 1, timestamp: -1 });
ServerLogSchema.index({ logType: 1, severity: 1 });
ServerLogSchema.index({ severity: 1, timestamp: -1 });
ServerLogSchema.index({ timestamp: -1 });
ServerLogSchema.index({ 'metadata.action': 1 });

module.exports = mongoose.model('ServerLog', ServerLogSchema);