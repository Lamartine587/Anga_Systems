const { Op } = require('sequelize');
const { Employee, User } = require('../models/postgres');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');

class HRService {
  static async createEmployee(employeeData) {
    try {
      // Check if employee code already exists
      const existingEmployee = await Employee.findOne({
        where: { employeeCode: employeeData.employeeCode }
      });
      
      if (existingEmployee) {
        throw new BadRequestError('Employee code already exists');
      }
      
      // Check if email already exists
      const existingEmail = await Employee.findOne({
        where: { email: employeeData.email }
      });
      
      if (existingEmail) {
        throw new BadRequestError('Email already registered');
      }
      
      // Create employee
      const employee = await Employee.create(employeeData);
      
      // Create user account for employee
      const username = employeeData.email.split('@')[0];
      const password = Math.random().toString(36).slice(-8); // Generate random password
      
      const user = await User.create({
        username,
        email: employeeData.email,
        password,
        firstName: employeeData.fullName.split(' ')[0],
        lastName: employeeData.fullName.split(' ').slice(1).join(' '),
        role: 'employee',
        department: employeeData.department
      });
      
      // Link employee to user
      await employee.update({ userId: user.id });
      
      // Send welcome email with credentials
      // emailService.sendWelcomeEmail(employee.email, username, password);
      
      return await employee.reload({
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role', 'isActive']
        }]
      });
    } catch (error) {
      throw error;
    }
  }
  
  static async getEmployee(id) {
    try {
      const employee = await Employee.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }]
      });
      
      if (!employee) {
        throw new NotFoundError('Employee not found');
      }
      
      return employee;
    } catch (error) {
      throw error;
    }
  }
  
  static async getEmployees(filters = {}, pagination = {}) {
    try {
      const {
        department,
        status,
        search,
        minSalary,
        maxSalary
      } = filters;
      
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = pagination;
      
      const offset = (page - 1) * limit;
      
      const where = {};
      
      if (department) where.department = department;
      if (status) where.status = status;
      
      if (minSalary || maxSalary) {
        where.salary = {};
        if (minSalary) where.salary[Op.gte] = minSalary;
        if (maxSalary) where.salary[Op.lte] = maxSalary;
      }
      
      if (search) {
        where[Op.or] = [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { employeeCode: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const { count, rows } = await Employee.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role', 'isActive', 'lastLogin']
        }],
        order: [[sortBy, sortOrder]],
        limit,
        offset,
        distinct: true
      });
      
      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async updateEmployee(id, updateData) {
    try {
      const employee = await Employee.findByPk(id);
      
      if (!employee) {
        throw new NotFoundError('Employee not found');
      }
      
      // Don't allow updating employee code
      if (updateData.employeeCode && updateData.employeeCode !== employee.employeeCode) {
        throw new BadRequestError('Cannot change employee code');
      }
      
      await employee.update(updateData);
      
      // Update corresponding user if email changed
      if (updateData.email && updateData.email !== employee.email) {
        const user = await User.findByPk(employee.userId);
        if (user) {
          await user.update({ email: updateData.email });
        }
      }
      
      return await employee.reload({
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }]
      });
    } catch (error) {
      throw error;
    }
  }
  
  static async deleteEmployee(id) {
    try {
      const employee = await Employee.findByPk(id);
      
      if (!employee) {
        throw new NotFoundError('Employee not found');
      }
      
      // Soft delete - mark as terminated
      await employee.update({
        status: 'terminated',
        terminationDate: new Date()
      });
      
      // Deactivate user account
      if (employee.userId) {
        const user = await User.findByPk(employee.userId);
        if (user) {
          await user.update({ isActive: false });
        }
      }
      
      return { message: 'Employee terminated successfully' };
    } catch (error) {
      throw error;
    }
  }
  
  static async calculatePayroll(month, year) {
    try {
      const period = new Date(year, month - 1, 1);
      const nextPeriod = new Date(year, month, 1);
      
      // Get all active employees
      const employees = await Employee.findAll({
        where: {
          status: 'active',
          hireDate: { [Op.lte]: period }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        }]
      });
      
      const payroll = [];
      
      for (const employee of employees) {
        // Calculate basic salary
        let basicSalary = parseFloat(employee.salary);
        
        // Calculate deductions
        const deductions = this.calculateDeductions(basicSalary);
        
        // Calculate allowances
        const allowances = this.calculateAllowances(employee);
        
        // Calculate net salary
        const grossSalary = basicSalary + allowances.total;
        const totalDeductions = deductions.total;
        const netSalary = grossSalary - totalDeductions;
        
        payroll.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employee.fullName,
          department: employee.department,
          position: employee.role,
          period: `${month}/${year}`,
          basicSalary,
          allowances,
          deductions,
          grossSalary,
          totalDeductions,
          netSalary,
          status: 'pending',
          bankDetails: employee.bankDetails
        });
      }
      
      return payroll;
    } catch (error) {
      throw error;
    }
  }
  
  static calculateDeductions(salary) {
    // Kenyan tax brackets (simplified)
    let tax = 0;
    
    if (salary <= 24000) {
      tax = salary * 0.1;
    } else if (salary <= 32333) {
      tax = 2400 + (salary - 24000) * 0.25;
    } else {
      tax = 4483.25 + (salary - 32333) * 0.3;
    }
    
    // NHIF and NSSF calculations
    const nhif = Math.min(salary * 0.015, 1700); // Max 1700
    const nssf = Math.min(salary * 0.06, 1080); // Tier I max
    
    return {
      tax: parseFloat(tax.toFixed(2)),
      nhif: parseFloat(nhif.toFixed(2)),
      nssf: parseFloat(nssf.toFixed(2)),
      total: parseFloat((tax + nhif + nssf).toFixed(2))
    };
  }
  
  static calculateAllowances(employee) {
    const allowances = {
      housing: 0,
      transport: 0,
      medical: 0,
      other: 0,
      total: 0
    };
    
    // Example allowance calculation based on role/department
    if (employee.department === 'management') {
      allowances.housing = 20000;
      allowances.transport = 15000;
    } else if (employee.department === 'development') {
      allowances.transport = 8000;
      allowances.medical = 5000;
    }
    
    allowances.total = allowances.housing + allowances.transport + allowances.medical + allowances.other;
    
    return allowances;
  }
  
  static async generatePayrollReport(month, year) {
    try {
      const payroll = await this.calculatePayroll(month, year);
      
      // Calculate totals
      const totals = payroll.reduce((acc, item) => {
        acc.totalBasic += item.basicSalary;
        acc.totalAllowances += item.allowances.total;
        acc.totalDeductions += item.totalDeductions;
        acc.totalNet += item.netSalary;
        acc.employeeCount++;
        return acc;
      }, {
        totalBasic: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeeCount: 0
      });
      
      return {
        period: `${month}/${year}`,
        generatedAt: new Date(),
        payroll,
        totals,
        summary: {
          averageSalary: totals.totalNet / totals.employeeCount,
          highestSalary: Math.max(...payroll.map(p => p.netSalary)),
          lowestSalary: Math.min(...payroll.map(p => p.netSalary))
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async getEmployeeStats() {
    try {
      // Get employee count by department
      const byDepartment = await Employee.findAll({
        attributes: [
          'department',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['department'],
        raw: true
      });
      
      // Get employee count by status
      const byStatus = await Employee.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });
      
      // Get hiring trends
      const hiringTrends = await Employee.findAll({
        attributes: [
          [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('hireDate')), 'month'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          hireDate: { [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        },
        group: ['month'],
        order: [['month', 'ASC']],
        raw: true
      });
      
      // Calculate turnover rate
      const totalEmployees = await Employee.count();
      const terminatedEmployees = await Employee.count({
        where: { status: 'terminated' }
      });
      
      const turnoverRate = totalEmployees > 0 ? (terminatedEmployees / totalEmployees) * 100 : 0;
      
      return {
        byDepartment,
        byStatus,
        hiringTrends,
        totals: {
          totalEmployees,
          activeEmployees: await Employee.count({ where: { status: 'active' } }),
          terminatedEmployees,
          turnoverRate: parseFloat(turnoverRate.toFixed(2))
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = HRService;