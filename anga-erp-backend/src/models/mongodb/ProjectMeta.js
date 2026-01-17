const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositorySchema = new Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['github', 'gitlab', 'bitbucket', 'other'],
    default: 'github'
  },
  branch: {
    type: String,
    default: 'main'
  },
  lastCommit: Date,
  lastCommitMessage: String,
  commitCount: {
    type: Number,
    default: 0
  }
});

const InfrastructureSchema = new Schema({
  serverIP: String,
  hostingProvider: String,
  serverType: {
    type: String,
    enum: ['vps', 'dedicated', 'cloud', 'shared']
  },
  spec: {
    cpu: String,
    ram: String,
    storage: String,
    bandwidth: String
  },
  os: String,
  controlPanel: String,
  domain: String,
  sslEnabled: {
    type: Boolean,
    default: false
  },
  sslExpiry: Date
});

const TechStackSchema = new Schema({
  frontend: [String],
  backend: [String],
  database: [String],
  devOps: [String],
  mobile: [String],
  other: [String]
});

const DeploymentSchema = new Schema({
  lastDeployed: Date,
  deploymentMethod: {
    type: String,
    enum: ['manual', 'ci_cd', 'auto']
  },
  status: {
    type: String,
    enum: ['stable', 'testing', 'failed', 'pending'],
    default: 'stable'
  },
  deploymentLog: [{
    timestamp: Date,
    action: String,
    user: String,
    status: String,
    message: String
  }]
});

const MonitoringSchema = new Schema({
  uptimeLast24h: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  averageResponseTime: {
    type: Number,
    default: 0
  },
  lastIncident: Date,
  incidentCount: {
    type: Number,
    default: 0
  },
  metrics: {
    cpu: {
      current: Number,
      max: Number,
      threshold: Number
    },
    memory: {
      current: Number,
      max: Number,
      threshold: Number
    },
    disk: {
      current: Number,
      max: Number,
      threshold: Number
    },
    network: {
      in: Number,
      out: Number
    }
  }
});

const ProjectMetaSchema = new Schema({
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
  technicalMetadata: {
    repository: RepositorySchema,
    infrastructure: InfrastructureSchema,
    techStack: TechStackSchema,
    deployment: DeploymentSchema,
    databaseInfo: {
      type: {
        type: String,
        enum: ['postgresql', 'mysql', 'mongodb', 'other']
      },
      version: String,
      size: String
    }
  },
  monitoring: MonitoringSchema,
  lastHealthCheck: Date,
  alerts: [{
    timestamp: Date,
    type: String,
    severity: String,
    message: String,
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ProjectMetaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
ProjectMetaSchema.index({ projectId: 1 }, { unique: true });
ProjectMetaSchema.index({ 'monitoring.lastIncident': -1 });
ProjectMetaSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('ProjectMeta', ProjectMetaSchema);