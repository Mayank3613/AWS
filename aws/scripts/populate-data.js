const dotenv = require('dotenv');

dotenv.config();

const { sequelize, User, Customer, Report, InteractionLog, Insight, AuditLog } = require('../../models');

const populateExtraData = async () => {
  try {
    await sequelize.authenticate();
    console.log('📡 Connected to Amazon RDS Database.');

    // Fetch existing users
    const admin = await User.findOne({ where: { role: 'admin' } });
    const staff = await User.findOne({ where: { role: 'staff' } });
    const manager = await User.findOne({ where: { role: 'manager' } });

    const staffId = staff ? staff.id : (admin ? admin.id : null);
    const managerId = manager ? manager.id : (admin ? admin.id : null);
    const staffName = staff ? staff.name : 'Staff Member';
    const managerName = manager ? manager.name : 'Manager';

    console.log('🚀 Adding New Enterprise Clients & Reports to Amazon RDS...');

    // 1. Create Extra Clients
    const newClients = [
      {
        name: 'Cyberdyne AI Systems',
        email: 'ops@cyberdyne.ai',
        contact: '+1 408-555-0991',
        status: 'Active',
        riskScore: 'Medium',
        healthScore: 78,
        ltv: 24000,
        mrr: 2100,
        segment: 'Standard',
        clv: 48000,
        pendingPayments: 450,
        assignedTo: staffId
      },
      {
        name: 'Omni Consumer Products (OCP)',
        email: 'contracts@ocp.corp',
        contact: '+1 313-555-0744',
        status: 'Active',
        riskScore: 'Low',
        healthScore: 91,
        ltv: 58000,
        mrr: 4900,
        segment: 'VIP',
        clv: 130000,
        pendingPayments: 0,
        assignedTo: managerId
      },
      {
        name: 'Weyland-Yutani Corp',
        email: 'procurement@weyland.space',
        contact: '+1 800-555-0888',
        status: 'Active',
        riskScore: 'Low',
        healthScore: 97,
        ltv: 85000,
        mrr: 7200,
        segment: 'VIP',
        clv: 190000,
        pendingPayments: 0,
        assignedTo: staffId
      },
      {
        name: 'Soylent Nutrition Inc',
        email: 'supply@soylent.bio',
        contact: '+1 212-555-0322',
        status: 'On Hold',
        riskScore: 'High',
        healthScore: 38,
        ltv: 4100,
        mrr: 350,
        segment: 'Regular',
        clv: 6500,
        pendingPayments: 1450,
        assignedTo: managerId
      }
    ];

    for (const client of newClients) {
      const [cust, created] = await Customer.findOrCreate({
        where: { name: client.name },
        defaults: client
      });

      if (created) {
        console.log(`   ✅ Added Client: ${cust.name} (${cust.segment}, Health: ${cust.healthScore})`);
      } else {
        console.log(`   ℹ️ Client already exists: ${cust.name}`);
      }

      // Add report for this client
      await Report.create({
        customerId: cust.id,
        customerName: cust.name,
        title: `Telemetry Audit & Health Optimization Ticket for ${cust.name}`,
        description: `Automated health scoring verification performed on Amazon RDS. Risk Level: ${cust.riskScore}.`,
        status: cust.healthScore > 80 ? 'Resolved' : (cust.healthScore > 50 ? 'In Progress' : 'Open'),
        priority: cust.healthScore < 50 ? 'Critical' : (cust.healthScore < 75 ? 'Medium' : 'Low'),
        assignedTo: cust.healthScore < 50 ? managerId : staffId,
        staffName: cust.healthScore < 50 ? managerName : staffName
      });
    }

    if (admin) {
      await AuditLog.create({
        userId: admin.id,
        action: 'POPULATE_ENTERPRISE_CLIENTS',
        details: 'Added batch of new enterprise clients and complaint reports to Amazon RDS.',
        performedBy: admin.name,
        role: admin.role
      });
    }

    console.log('\n🎉 Successfully populated additional clients and reports into Amazon RDS!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating data:', error.message);
    process.exit(1);
  }
};

populateExtraData();
