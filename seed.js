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

    // =========================================================================
    // 1. Create Default Users (Admin, Manager, Staff)
    // =========================================================================
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

    const staff1 = await User.create({
      name: 'John Doe (Staff Lead)',
      email: 'staff@example.com',
      password: 'password123',
      role: 'staff',
      phone: '+1 800-555-0122'
    });

    const staff2 = await User.create({
      name: 'Alex Vance (Customer Success)',
      email: 'alex@example.com',
      password: 'password123',
      role: 'staff',
      phone: '+1 800-555-0133'
    });

    console.log('👥 Created Default Users:');
    console.log('   - Admin:   admin@example.com   / password123 (Role: admin)');
    console.log('   - Manager: manager@example.com / password123 (Role: manager)');
    console.log('   - Staff:   staff@example.com   / password123 (Role: staff)');
    console.log('   - Staff:   alex@example.com    / password123 (Role: staff)');

    // =========================================================================
    // 2. Create 12 Diverse Enterprise Clients
    // =========================================================================
    const customers = await Customer.bulkCreate([
      {
        name: 'Stark Industries',
        email: 'procurement@starkindustries.com',
        contact: '+1 212-555-0188',
        status: 'Active',
        riskScore: 'Low',
        healthScore: 98,
        ltv: 68000,
        mrr: 5500,
        segment: 'VIP',
        clv: 120000,
        pendingPayments: 0,
        assignedTo: staff1.id
      },
      {
        name: 'Wayne Enterprises',
        email: 'enterprise@waynecorp.com',
        contact: '+1 609-555-0144',
        status: 'Active',
        riskScore: 'Low',
        healthScore: 96,
        ltv: 45000,
        mrr: 3800,
        segment: 'VIP',
        clv: 95000,
        pendingPayments: 0,
        assignedTo: manager.id
      },
      {
        name: 'Massive Dynamic',
        email: 'support@massivedynamic.io',
        contact: '+1 617-555-0177',
        status: 'Active',
        riskScore: 'Low',
        healthScore: 94,
        ltv: 52000,
        mrr: 4200,
        segment: 'VIP',
        clv: 110000,
        pendingPayments: 0,
        assignedTo: staff2.id
      },
      {
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
        assignedTo: staff1.id
      },
      {
        name: 'Hooli Cloud Inc',
        email: 'accounts@hooli.xyz',
        contact: '+1 650-555-0166',
        status: 'Active',
        riskScore: 'Low',
        healthScore: 88,
        ltv: 32000,
        mrr: 2900,
        segment: 'VIP',
        clv: 60000,
        pendingPayments: 0,
        assignedTo: manager.id
      },
      {
        name: 'Pied Piper Compression',
        email: 'richard@piedpiper.com',
        contact: '+1 650-555-0155',
        status: 'Active',
        riskScore: 'Low',
        healthScore: 84,
        ltv: 18500,
        mrr: 1600,
        segment: 'Standard',
        clv: 38000,
        pendingPayments: 0,
        assignedTo: staff2.id
      },
      {
        name: 'Los Pollos Hermanos Logistics',
        email: 'supply@lospollos.biz',
        contact: '+1 505-555-0199',
        status: 'Active',
        riskScore: 'Medium',
        healthScore: 79,
        ltv: 14200,
        mrr: 1150,
        segment: 'Standard',
        clv: 28000,
        pendingPayments: 450,
        assignedTo: staff1.id
      },
      {
        name: 'Cyberdyne Systems',
        email: 'telemetry@cyberdyne.ai',
        contact: '+1 408-555-0122',
        status: 'Active',
        riskScore: 'Medium',
        healthScore: 75,
        ltv: 15000,
        mrr: 1400,
        segment: 'Standard',
        clv: 30000,
        pendingPayments: 650,
        assignedTo: staff2.id
      },
      {
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
        assignedTo: staff1.id
      },
      {
        name: 'Dunder Mifflin Paper Co',
        email: 'billing@dundermifflin.com',
        contact: '+1 570-555-0133',
        status: 'Active',
        riskScore: 'Medium',
        healthScore: 62,
        ltv: 4800,
        mrr: 450,
        segment: 'Regular',
        clv: 9000,
        pendingPayments: 450,
        assignedTo: staff2.id
      },
      {
        name: 'Umbrella Pharmaceuticals',
        email: 'security@umbrellacorp.net',
        contact: '+1 312-555-0111',
        status: 'On Hold',
        riskScore: 'High',
        healthScore: 55,
        ltv: 9200,
        mrr: 850,
        segment: 'Regular',
        clv: 16000,
        pendingPayments: 1800,
        assignedTo: manager.id
      },
      {
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
      }
    ], { returning: true });

    console.log(`🏢 Created ${customers.length} Diverse Enterprise Customers on Amazon RDS.`);

    // Map customers by name for easy foreign key linking
    const customerMap = {};
    customers.forEach(c => { customerMap[c.name] = c; });

    // =========================================================================
    // 3. Create 15 Comprehensive Complaint & Insight Reports
    // =========================================================================
    const reportsData = [
      {
        customerId: customerMap['Initech Systems'].id,
        customerName: 'Initech Systems',
        title: 'Payment Gateway Integration Failure - Recurring Webhook Timeouts',
        description: 'Nightly automated billing cycle API encountered 504 Gateway Timeouts on Stripe webhook endpoints.',
        status: 'Open',
        priority: 'Critical',
        assignedTo: staff1.id,
        staffName: staff1.name
      },
      {
        customerId: customerMap['Umbrella Pharmaceuticals'].id,
        customerName: 'Umbrella Pharmaceuticals',
        title: 'Zero-Day Vulnerability Remediation & Compliance Verification',
        description: 'Security audit flagged CVE-2026-8812 in authentication sub-modules. Immediate isolation required.',
        status: 'In Progress',
        priority: 'Critical',
        assignedTo: manager.id,
        staffName: manager.name
      },
      {
        customerId: customerMap['Stark Industries'].id,
        customerName: 'Stark Industries',
        title: 'PostgreSQL Connection Pool Optimization on Amazon RDS',
        description: 'High-frequency telemetry queries saturated active connection pool during peak testing hours.',
        status: 'Resolved',
        priority: 'Critical',
        assignedTo: staff2.id,
        staffName: staff2.name
      },
      {
        customerId: customerMap['Globex Tech Solutions'].id,
        customerName: 'Globex Tech Solutions',
        title: 'High Latency Encountered During Morning Batch Export to AWS S3',
        description: 'ETL export job experienced 800ms higher latency when transferring multi-gigabyte CSV archives.',
        status: 'Open',
        priority: 'High',
        assignedTo: staff1.id,
        staffName: staff1.name
      },
      {
        customerId: customerMap['Hooli Cloud Inc'].id,
        customerName: 'Hooli Cloud Inc',
        title: 'Automated Invoice Generation Discrepancy for Multi-Currency VIPs',
        description: 'Currency conversion rounding issue identified in EUR/GBP recurring subscription invoices.',
        status: 'In Progress',
        priority: 'High',
        assignedTo: manager.id,
        staffName: manager.name
      },
      {
        customerId: customerMap['Wayne Enterprises'].id,
        customerName: 'Wayne Enterprises',
        title: 'Cross-Region Database Read Replica Lag in ap-south-1',
        description: 'Async replication delay reached 4.2 seconds during heavy write bursts. Resolved via IOPS tuning.',
        status: 'Resolved',
        priority: 'High',
        assignedTo: staff1.id,
        staffName: staff1.name
      },
      {
        customerId: customerMap['Cyberdyne Systems'].id,
        customerName: 'Cyberdyne Systems',
        title: 'Slow Dashboard Analytics Query in EU-Central Region',
        description: 'Client noticed high TTFB when aggregating monthly risk distribution cards across 10k entities.',
        status: 'In Progress',
        priority: 'Medium',
        assignedTo: staff2.id,
        staffName: staff2.name
      },
      {
        customerId: customerMap['Pied Piper Compression'].id,
        customerName: 'Pied Piper Compression',
        title: 'Custom CSV Export Field Formatting Inconsistency',
        description: 'Timestamps in generated reports were defaulting to UTC rather than customer configured timezone (PST).',
        status: 'Open',
        priority: 'Medium',
        assignedTo: staff1.id,
        staffName: staff1.name
      },
      {
        customerId: customerMap['Los Pollos Hermanos Logistics'].id,
        customerName: 'Los Pollos Hermanos Logistics',
        title: 'SSO SAML 2.0 Assertion Attribute Mapping Error',
        description: 'Okta identity provider integration required specific Department and Role claim claims mapping.',
        status: 'Resolved',
        priority: 'Medium',
        assignedTo: manager.id,
        staffName: manager.name
      },
      {
        customerId: customerMap['Massive Dynamic'].id,
        customerName: 'Massive Dynamic',
        title: 'Dark Mode High-Contrast Accessibility Enhancement Request',
        description: 'UX team requested WCAG AAA compliance improvements for data visualization charts in night mode.',
        status: 'Open',
        priority: 'Low',
        assignedTo: staff2.id,
        staffName: staff2.name
      },
      {
        customerId: customerMap['Acme Corporation'].id,
        customerName: 'Acme Corporation',
        title: 'Custom Field Addition Request for Annual Tax Reporting',
        description: 'Customer requested additional VAT/GST telemetry metrics in automated quarterly reporting export.',
        status: 'Resolved',
        priority: 'Low',
        assignedTo: staff1.id,
        staffName: staff1.name
      },
      {
        customerId: customerMap['Dunder Mifflin Paper Co'].id,
        customerName: 'Dunder Mifflin Paper Co',
        title: 'Email Notification Template Localization for International Branches',
        description: 'Added localized HTML email notification templates for regional European and Asian sales offices.',
        status: 'Resolved',
        priority: 'Low',
        assignedTo: staff2.id,
        staffName: staff2.name
      },
      {
        customerId: customerMap['Initech Systems'].id,
        customerName: 'Initech Systems',
        title: 'Executive Account Review on Overdue Invoices ($1,200)',
        description: 'Formal escalation ticket initiated due to 60-day pending payment threshold exceedance.',
        status: 'In Progress',
        priority: 'High',
        assignedTo: manager.id,
        staffName: manager.name
      },
      {
        customerId: customerMap['Stark Industries'].id,
        customerName: 'Stark Industries',
        title: 'Feature Request: Automated Weekly Risk Trend Digests via AWS SNS',
        description: 'Executive stakeholders requested weekly PDF digest deliveries directly to Slack and email.',
        status: 'In Progress',
        priority: 'Medium',
        assignedTo: staff1.id,
        staffName: staff1.name
      },
      {
        customerId: customerMap['Wayne Enterprises'].id,
        customerName: 'Wayne Enterprises',
        title: 'Quarterly Security Audit & Penetration Testing Compliance Verification',
        description: 'SOC2 Type II external audit completed with 100% compliance rating and zero critical findings.',
        status: 'Resolved',
        priority: 'Low',
        assignedTo: manager.id,
        staffName: manager.name
      }
    ];

    await Report.bulkCreate(reportsData);
    console.log(`📋 Created ${reportsData.length} Realistic Complaint & Insight Reports on Amazon RDS.`);

    // =========================================================================
    // 4. Create Detailed Interaction Logs
    // =========================================================================
    await InteractionLog.bulkCreate([
      {
        customerId: customerMap['Stark Industries'].id,
        userId: staff1.id,
        type: 'Call',
        notes: 'Executive Q3 Business Review. Client expressed top-tier satisfaction with RDS uptime & query speeds.',
        rating: 5
      },
      {
        customerId: customerMap['Wayne Enterprises'].id,
        userId: manager.id,
        type: 'Meeting',
        notes: 'Architecture review call for upcoming multi-region failover testing in ap-south-1.',
        rating: 5
      },
      {
        customerId: customerMap['Initech Systems'].id,
        userId: manager.id,
        type: 'Email',
        notes: 'Sent formal finance department notification regarding pending billing reconciliation ($1,200).',
        rating: 2
      },
      {
        customerId: customerMap['Umbrella Pharmaceuticals'].id,
        userId: staff2.id,
        type: 'Call',
        notes: 'Security patch compliance check-in. Discussed timeline for next vulnerability scan cycle.',
        rating: 3
      },
      {
        customerId: customerMap['Globex Tech Solutions'].id,
        userId: staff1.id,
        type: 'Note',
        notes: 'Assisted DevOps team with S3 bucket policy integration for automated CSV backup export.',
        rating: 4
      }
    ]);

    // =========================================================================
    // 5. Create AI Smart Insights
    // =========================================================================
    await Insight.bulkCreate([
      {
        customerId: customerMap['Initech Systems'].id,
        riskScore: 'High',
        riskFactors: ['Critical Health Score: 42', 'Overdue Balance: $1,200', '1 Unresolved Critical Report'],
        recommendation: 'URGENT: Immediate executive intervention required to prevent customer churn.'
      },
      {
        customerId: customerMap['Umbrella Pharmaceuticals'].id,
        riskScore: 'High',
        riskFactors: ['Sub-optimal Health Score: 55', 'Overdue Balance: $1,800', 'Active Security Remediation Ticket'],
        recommendation: 'Schedule account reconciliation meeting with Finance & Compliance Directors.'
      },
      {
        customerId: customerMap['Globex Tech Solutions'].id,
        riskScore: 'Medium',
        riskFactors: ['Health Score: 68', 'Pending Invoices: $750', 'Open High Priority Latency Ticket'],
        recommendation: 'Optimize S3 export batch schedules to avoid morning peak traffic periods.'
      },
      {
        customerId: customerMap['Stark Industries'].id,
        riskScore: 'Low',
        riskFactors: ['Exceptional Health Score: 98', 'Zero Outstanding Balance', 'All Critical Tickets Resolved'],
        recommendation: 'Target for Tier-1 Enterprise contract expansion and multi-year commitment.'
      }
    ]);

    // =========================================================================
    // 6. Create Initial Audit Logs
    // =========================================================================
    await AuditLog.bulkCreate([
      {
        userId: admin.id,
        action: 'SYSTEM_SEED_EXPANDED_RDS',
        details: 'Expanded enterprise database schema loaded on Amazon RDS (12 Clients, 15 Reports, 5 Interactions, 4 Insights).',
        performedBy: admin.name,
        role: admin.role
      },
      {
        userId: admin.id,
        action: 'SECURITY_AUDIT_VERIFIED',
        details: 'PostgreSQL SSL encryption verified with Amazon AWS RDS Managed Infrastructure.',
        performedBy: admin.name,
        role: admin.role
      }
    ]);

    console.log('\n========================================================================');
    console.log('🎉 Amazon AWS RDS Expanded Seeding Complete!');
    console.log('========================================================================');
    console.log('📊 Statistics Loaded:');
    console.log(`   - 👥 Users:        4 (Admin, Manager, 2 Staff)`);
    console.log(`   - 🏢 Customers:    ${customers.length} Enterprise Accounts (Stark, Wayne, Hooli, Acme, etc.)`);
    console.log(`   - 📋 Reports:      ${reportsData.length} Tickets (Critical, High, Medium, Low)`);
    console.log(`   - 💡 Smart Insights: 4 AI Risk Assessments`);
    console.log(`   - 🔒 Audit Trails:   2 Initial System Logs`);
    console.log('\n🔑 Login credentials:');
    console.log('   Email:    admin@example.com');
    console.log('   Password: password123');
    console.log('========================================================================\n');

    process.exit(0);
  } catch (error) {
    console.log('\n========================================================================');
    console.log('❌ Could not connect to Amazon RDS Database');
    console.log(`Error Message: ${error.message}`);
    console.log('========================================================================\n');
    process.exit(1);
  }
};

seedData();
