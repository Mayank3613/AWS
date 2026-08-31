const dotenv = require('dotenv');

dotenv.config();

const dbHost = process.env.DB_HOST || '';
const isPlaceholderHost = dbHost.includes('xxxxxx') || dbHost.includes('c7y') || !dbHost;

const seedData = async () => {
  if (isPlaceholderHost) {
    console.log('\n========================================================================');
    console.log('⚠️  ACTION REQUIRED: Set your Amazon RDS Endpoint in .env');
    console.log('========================================================================');
    console.log(`Current DB_HOST: "${dbHost}" (Template Placeholder)`);
    console.log('\nSteps to connect your real Amazon RDS database:');
    console.log('  1. Open AWS Management Console -> Amazon RDS -> Databases.');
    console.log('  2. Click on your database (e.g., customer-report-rds).');
    console.log('  3. Under "Connectivity & security", copy the real "Endpoint".');
    console.log('     (e.g., customer-report-rds.c123456789.us-east-1.rds.amazonaws.com)');
    console.log('  4. Edit your .env file on EC2:');
    console.log('     nano /home/ubuntu/Customer-Report-System-AWS/.env');
    console.log('     DB_HOST=<your-copied-endpoint>');
    console.log('     DB_PASSWORD=<your-rds-master-password>');
    console.log('  5. Re-run: node seed.js');
    console.log('========================================================================\n');
    return;
  }

  try {
    const { sequelize, User, Customer, Report, InteractionLog, Insight, AuditLog } = require('./models');

    console.log(`📡 Connecting to Amazon AWS RDS Database (${dbHost})...`);
    await sequelize.authenticate();
    console.log('✅ Connected to Amazon RDS!');

    // Recreate all tables with fresh relational schema
    console.log('🔄 Re-syncing database schema (force: true)...');
    await sequelize.sync({ force: true });
    console.log('✅ Clean relational schema created on RDS.');

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
      assignedTo: staff.id
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
      assignedTo: staff.id
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
      assignedTo: manager.id
    });

    console.log(' Created 3 Sample Customers on RDS.');

    // 3. Create Sample Reports
    await Report.create({
      customerId: customer3.id,
      customerName: customer3.name,
      title: 'Payment Gateway Integration Failure',
      description: 'API response timeout encountered during nightly recurring billing cycle.',
      status: 'Open',
      priority: 'Critical',
      assignedTo: staff.id,
      staffName: staff.name
    });

    await Report.create({
      customerId: customer2.id,
      customerName: customer2.name,
      title: 'Slow Dashboard Loading in EU Region',
      description: 'Client noticed increased latency when fetching monthly report exports.',
      status: 'In Progress',
      priority: 'Medium',
      assignedTo: manager.id,
      staffName: manager.name
    });

    await Report.create({
      customerId: customer1.id,
      customerName: customer1.name,
      title: 'Custom Field Addition Request',
      description: 'Customer requested additional telemetry metrics in reporting export.',
      status: 'Resolved',
      priority: 'Low',
      assignedTo: staff.id,
      staffName: staff.name
    });

    console.log(' Created 3 Sample Complaint / Insight Reports.');

    // 4. Create Sample Interaction Logs
    await InteractionLog.create({
      customerId: customer1.id,
      userId: staff.id,
      type: 'Call',
      notes: 'Quarterly review call. Client expressed high satisfaction with system uptime.',
      rating: 5
    });

    await InteractionLog.create({
      customerId: customer3.id,
      userId: manager.id,
      type: 'Email',
      notes: 'Sent formal notification regarding pending billing reconciliation.',
      rating: 2
    });

    // 5. Create Initial Insights
    await Insight.create({
      customerId: customer3.id,
      riskScore: 'High',
      riskFactors: ['Critical Health Score: 42', '1 Unresolved Critical Report(s)'],
      recommendation: 'URGENT: Immediate executive intervention required to prevent churn.'
    });

    // 6. Create Initial Audit Log
    await AuditLog.create({
      userId: admin.id,
      action: 'SYSTEM_SEED_RDS',
      details: 'Initial database schema and seed data loaded on Amazon AWS RDS.',
      performedBy: admin.name,
      role: admin.role
    });

    console.log('\n🎉 Amazon AWS RDS Database Seeding Complete!');
    console.log('=============================================');
    console.log('Login credentials:');
    console.log('Email:    admin@example.com');
    console.log('Password: password123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.log('\n========================================================================');
    console.log('❌ Could not connect to Amazon RDS Database');
    console.log(`Error Message: ${error.message}`);
    console.log('\nTroubleshooting Checklist:');
    console.log('  1. Is the RDS DB instance in "Available" status in AWS Console?');
    console.log('  2. Did you copy the exact Endpoint into DB_HOST in .env?');
    console.log('  3. In the RDS Security Group inbound rules, is Port 5432 allowed from your EC2 Security Group?');
    console.log('  4. Is DB_PASSWORD in .env matching the Master Password set during RDS creation?');
    console.log('========================================================================\n');
  }
};

seedData();
