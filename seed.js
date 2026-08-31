const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Report = require('./models/Report');
const AuditLog = require('./models/AuditLog');

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/customer_report_system';

const seedData = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log(` Connected to MongoDB: ${mongoURI}`);

    // Clear existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Report.deleteMany({});
    await AuditLog.deleteMany({});
    console.log(' Cleared existing database collections.');

    // 1. Create Default Users (Admin, Manager, Staff)
    const admin = await User.create({
      name: 'AWS Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      phone: '+1 800-555-0199'
    });

    const manager = await User.create({
      name: 'Sarah Connor (Manager)',
      email: 'manager@example.com',
      password: 'password123',
      role: 'manager',
      phone: '+1 800-555-0155'
    });

    const staff = await User.create({
      name: 'John Doe (Staff)',
      email: 'staff@example.com',
      password: 'password123',
      role: 'staff',
      phone: '+1 800-555-0122'
    });

    console.log(' Created Default Users:');
    console.log('   - Admin:   admin@example.com   / password123 (Role: admin)');
    console.log('   - Manager: manager@example.com / password123 (Role: manager)');
    console.log('   - Staff:   staff@example.com   / password123 (Role: staff)');

    // 2. Create Sample Customers
    const customer1 = await Customer.create({
      name: 'Acme Corporation',
      email: 'contact@acmecorp.com',
      contact: '+1 555-0101',
      status: 'Active',
      riskScore: 'Low',
      healthScore: 92,
      ltv: 12500,
      mrr: 1200,
      segment: 'VIP',
      clv: 25000,
      pendingPayments: 0,
      assignedTo: staff._id
    });

    const customer2 = await Customer.create({
      name: 'Globex Tech Solutions',
      email: 'support@globex.io',
      contact: '+1 555-0102',
      status: 'Active',
      riskScore: 'Medium',
      healthScore: 68,
      ltv: 8400,
      mrr: 750,
      segment: 'Standard',
      clv: 14000,
      pendingPayments: 750,
      assignedTo: staff._id
    });

    const customer3 = await Customer.create({
      name: 'Initech Systems',
      email: 'billing@initech.net',
      contact: '+1 555-0103',
      status: 'On Hold',
      riskScore: 'High',
      healthScore: 42,
      ltv: 3200,
      mrr: 300,
      segment: 'Regular',
      clv: 5000,
      pendingPayments: 1200,
      assignedTo: manager._id
    });

    console.log(' Created 3 Sample Customers.');

    // 3. Create Sample Reports
    await Report.create({
      customerId: customer3._id,
      customerName: customer3.name,
      title: 'Payment Gateway Integration Failure',
      description: 'API response timeout encountered during nightly recurring billing cycle.',
      status: 'Open',
      priority: 'Critical',
      assignedTo: staff._id,
      staffName: staff.name
    });

    await Report.create({
      customerId: customer2._id,
      customerName: customer2.name,
      title: 'Slow Dashboard Loading in EU Region',
      description: 'Client noticed increased latency when fetching monthly report exports.',
      status: 'In Progress',
      priority: 'Medium',
      assignedTo: manager._id,
      staffName: manager.name
    });

    await Report.create({
      customerId: customer1._id,
      customerName: customer1.name,
      title: 'Custom Field Addition Request',
      description: 'Customer requested additional telemetry metrics in reporting export.',
      status: 'Resolved',
      priority: 'Low',
      assignedTo: staff._id,
      staffName: staff.name
    });

    console.log(' Created 3 Sample Complaint / Insight Reports.');

    // 4. Create Initial Audit Log
    await AuditLog.create({
      action: 'SYSTEM_SEED',
      details: 'Initial database seeding on AWS EC2 environment.',
      performedBy: admin.name,
      role: admin.role
    });

    console.log('\n Database Seeding Complete!');
    console.log('=============================================');
    console.log('You can now log in to the application using:');
    console.log('Email:    admin@example.com');
    console.log('Password: password123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
