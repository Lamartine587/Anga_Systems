# Anga Systems ERP Backend

## 📋 Overview

Anga Systems ERP is a comprehensive Enterprise Resource Planning system designed to consolidate internal operations (HR, Finance, DevOps) with external customer-facing services (Web Development, App Development, IT Maintenance). The system follows a **polyglot persistence architecture** leveraging PostgreSQL for transactional data and MongoDB for operational data.

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────┐
│               CLIENT LAYER                  │
│  Web Browser │ Mobile View │ External APIs │
└─────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────┐
│            APPLICATION LAYER                │
│        Node.js / Express Server             │
│  Auth │ Routing │ Business Logic │ API Gateway│
└─────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────┐
│               DATA LAYER                    │
│      PostgreSQL        │      MongoDB       │
│  • HR Schema          │  • DevOps Schema   │
│  • Finance Schema     │  • Logs Schema     │
│  • CRM Schema         │  • Tickets Schema  │
└─────────────────────────────────────────────┘
```

### Database Strategy
- **PostgreSQL (ACID-compliant)**: Finance, HR, CRM data
- **MongoDB (High-velocity)**: DevOps, maintenance tickets, server logs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- MongoDB 6+
- npm or yarn package manager

### Installation

1. **Clone and Setup**
```bash
git clone <repository-url>
cd anga-erp-backend
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# PostgreSQL setup
sudo -u postgres psql << EOF
CREATE DATABASE anga_erp;
CREATE USER erp_app WITH PASSWORD 'SecurePassword123';
GRANT ALL PRIVILEGES ON DATABASE anga_erp TO erp_app;
ALTER DATABASE anga_erp OWNER TO erp_app;
\q
EOF

# MongoDB will auto-create databases on first connection
```

4. **Start Development Server**
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Using Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

## 📁 Project Structure

```
anga-erp-backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── index.js           # Main config loader
│   │   ├── database.js        # Dual database manager
│   │   └── constants.js       # Application constants
│   │
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   ├── validation.js     # Request validation
│   │   └── errorHandler.js   # Error handling
│   │
│   ├── models/               # Database models
│   │   ├── postgres/        # Sequelize models (PostgreSQL)
│   │   │   ├── User.js
│   │   │   ├── Employee.js
│   │   │   ├── Client.js
│   │   │   ├── Invoice.js
│   │   │   ├── Project.js
│   │   │   └── Lead.js
│   │   │
│   │   └── mongodb/         # Mongoose schemas (MongoDB)
│   │       ├── ProjectMeta.js
│   │       ├── MaintenanceTicket.js
│   │       └── ServerLog.js
│   │
│   ├── services/            # Business logic layer
│   │   ├── AuthService.js
│   │   ├── FinanceService.js
│   │   ├── HRService.js
│   │   ├── DevOpsService.js
│   │   └── EmailService.js
│   │
│   ├── controllers/         # Route controllers
│   │   ├── AuthController.js
│   │   ├── FinanceController.js
│   │   ├── HRController.js
│   │   └── DevOpsController.js
│   │
│   ├── routes/             # API route definitions
│   │   ├── auth.js
│   │   ├── finance.js
│   │   ├── hr.js
│   │   ├── devops.js
│   │   └── marketing.js
│   │
│   ├── utils/              # Utility functions
│   │   ├── logger.js      # Winston logger
│   │   └── helpers.js     # Helper functions
│   │
│   └── app.js             # Main application file
│
├── tests/                  # Test files
├── uploads/               # File uploads directory
├── logs/                  # Application logs
├── public/               # Static frontend files
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies
├── docker-compose.yml    # Docker orchestration
├── Dockerfile           # Container configuration
└── nginx.conf           # Nginx configuration
```

## 🔧 Module Specifications

### 1. Finance & HR Module (PostgreSQL)
**Core Tables:**
- `employees` - Employee management
- `clients` - Client information
- `invoices` - Billing and payments
- `projects` - Project tracking
- `leads` - Marketing and sales leads

**Key Features:**
- Automated invoice generation
- Payroll calculation with tax deductions
- Client portal for invoice viewing
- Financial reporting and analytics

### 2. DevOps & Maintenance Module (MongoDB)
**Core Collections:**
- `ProjectMeta` - Technical project metadata
- `MaintenanceTicket` - Support ticket management
- `ServerLogs` - Real-time server monitoring

**Key Features:**
- Automated server health checks
- Ticket management with SLA tracking
- Real-time monitoring dashboard
- Deployment history and rollback

### 3. Authentication & Security
- JWT-based authentication
- Role-based access control (Admin, Manager, Employee, Client)
- Password encryption with bcrypt
- Rate limiting and brute force protection

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register        # User registration
POST   /api/auth/login           # User login
POST   /api/auth/refresh-token   # Token refresh
GET    /api/auth/profile         # User profile
```

### Finance Module
```
GET    /api/finance/invoices          # List invoices
POST   /api/finance/invoices          # Create invoice
GET    /api/finance/invoices/:id      # Invoice details
PUT    /api/finance/invoices/:id      # Update invoice
POST   /api/finance/invoices/:id/pay  # Process payment
GET    /api/finance/reports/sales     # Sales reports
```

### HR Module
```
GET    /api/hr/employees          # List employees
POST   /api/hr/employees          # Create employee
GET    /api/hr/payroll/:month     # Monthly payroll
GET    /api/hr/stats/employees    # Employee statistics
```

### DevOps Module
```
GET    /api/devops/tickets         # List maintenance tickets
POST   /api/devops/tickets         # Create ticket
PUT    /api/devops/tickets/:id     # Update ticket
GET    /api/devops/dashboard       # Monitoring dashboard
POST   /api/devops/logs            # Add server logs
```

### Marketing Module
```
POST   /api/marketing/leads       # Capture leads
GET    /api/marketing/analytics   # Website analytics
PUT    /api/marketing/leads/:id   # Update lead status
```

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Application
NODE_ENV=development
PORT=3000

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=anga_erp
PG_USER=erp_app
PG_PASSWORD=your_password

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=anga_devops

# Security
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=8h
ENCRYPTION_KEY=32_byte_key_for_encryption

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Database Configuration
The system uses a custom `DatabaseManager` class to handle dual database connections:

```javascript
// Example usage
const database = require('./src/config/database');

async function initialize() {
  await database.connectAll();
  const models = database.getModels();
  const postgres = database.getPostgreSQL();
  const mongodb = database.getMongoDB();
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test suite
npm test -- tests/auth.test.js

# Run integration tests
npm run test:integration
```

**Test Coverage Requirements:**
- Minimum 80% line coverage for core business logic
- 100% coverage for security-critical functions
- Integration tests for all API endpoints

## 🚢 Deployment

### Production Deployment with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor application
pm2 monit

# Setup startup script
pm2 startup
pm2 save
```

### Docker Deployment
```bash
# Build and run
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

### Nginx Configuration
The project includes optimized nginx configuration for:
- SSL/TLS termination
- Load balancing
- Static file serving
- Gzip compression
- Security headers

## 🔒 Security Features

1. **Authentication & Authorization**
   - JWT tokens with refresh mechanism
   - Role-based access control (RBAC)
   - Session management

2. **Data Protection**
   - SQL injection prevention (parameterized queries)
   - XSS protection (Content Security Policy)
   - Input validation with Joi
   - Data encryption at rest and in transit

3. **API Security**
   - Rate limiting (100 requests/15 minutes)
   - CORS configuration
   - Helmet.js security headers
   - Request sanitization

## 📊 Monitoring & Logging

### Logging Configuration
- Winston logger with multiple transports
- Structured JSON logging in production
- File rotation (5MB max, 5 files)
- Morgan HTTP request logging

### Health Checks
```
GET /health
Response:
{
  "status": "healthy",
  "timestamp": "2023-10-26T10:30:00Z",
  "uptime": 12345.67,
  "database": "connected",
  "version": "1.0.0"
}
```

### Performance Monitoring
- Database query optimization
- Response time tracking
- Memory usage monitoring
- Error rate tracking

## 🛠️ Development

### Code Style & Linting
```bash
# Check code style
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Migrations
```bash
# Create migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npm run migrate

# Rollback migration
npx sequelize-cli db:migrate:undo
```

### Common Issues & Solutions

#### 1. PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
PGPASSWORD='your_password' psql -h localhost -p 5432 -U erp_app -d anga_erp -c "SELECT 1;"

# Reset password
sudo -u postgres psql -c "ALTER USER erp_app WITH PASSWORD 'new_password';"
```

#### 2. Circular Dependency Fix
If you encounter "PostgreSQL not connected" errors, models are loading before the database connection. Fix by updating model files to lazy-load the connection:

```javascript
// Instead of:
const db = require('../../config/database').getPostgreSQL();

// Use:
let dbInstance = null;
function getDB() {
  if (!dbInstance) {
    dbInstance = require('../../config/database').getPostgreSQL();
  }
  return dbInstance;
}
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- PostgreSQL indexes
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_employees_department ON employees(department);

-- MongoDB indexes
db.ProjectMeta.createIndex({ projectId: 1 }, { unique: true });
db.MaintenanceTicket.createIndex({ ticketId: 1 }, { unique: true });
db.ServerLogs.createIndex({ timestamp: -1 });
```

### Application Optimization
- Connection pooling (PostgreSQL: max 20, min 5)
- Query optimization with EXPLAIN
- Caching with Redis (future implementation)
- CDN for static assets

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Workflow
```
Feature Request → Issue Creation → Branch Development → 
Code Review → Testing → Merge → Deployment
```

## 📄 License

This project is proprietary and confidential. All rights reserved by Anga Systems.

## 🆘 Support

For technical support:
- **Email**: tech@angasystems.com
- **Slack**: #erp-backend-support
- **Documentation**: [https://docs.angasystems.com/erp](https://docs.angasystems.com/erp)

### Emergency Contact
- **Infrastructure Issues**: infra@angasystems.com
- **Security Issues**: security@angasystems.com
- **Database Issues**: dba@angasystems.com

---

## 🎯 Success Metrics

- **Operational**: 40% reduction in manual data reconciliation
- **Reliability**: 99.5% system availability during business hours
- **Performance**: Sub-2-second response time for core transactions
- **Data Integrity**: Zero data loss in financial transactions

## 🔄 Changelog

### Version 1.1.0 (Current)
- Dual database architecture implementation
- Complete module specifications
- Security hardening
- Docker deployment support

### Version 1.0.0
- Initial ERP system architecture
- Core module definitions
- Basic API structure
- Documentation framework

---

**Last Updated**: January 17th, 2026  
**Version**: 1.1.0  
**Status**: Approved for Implementation  
**Author**: Technical Architecture Team, Anga Systems
