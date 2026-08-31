const dotenv = require('dotenv');
dotenv.config();

const { User, Customer, Report, InteractionLog, Insight, AuditLog, sequelize } = require('../../models');

const displayDatabaseData = async () => {
  try {
    await sequelize.authenticate();
    console.log('\n========================================================================');
    console.log(`🗄️  LIVE AMAZON AWS RDS DATABASE VIEWER`);
    console.log(`🌐 Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log('========================================================================\n');

    // 1. Users Table
    console.log('👥 [TABLE: users]');
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'phone', 'createdAt'],
      raw: true
    });
    console.table(users);

    // 2. Customers Table
    console.log('\n🏢 [TABLE: customers]');
    const customers = await Customer.findAll({
      attributes: ['id', 'name', 'email', 'status', 'riskScore', 'healthScore', 'ltv', 'mrr', 'segment'],
      raw: true
    });
    console.table(customers);

    // 3. Reports Table
    console.log('\n📋 [TABLE: reports]');
    const reports = await Report.findAll({
      attributes: ['id', 'title', 'status', 'priority', 'customerName', 'staffName'],
      raw: true
    });
    console.table(reports);

    // 4. Interaction Logs Table
    console.log('\n📞 [TABLE: interaction_logs]');
    const interactions = await InteractionLog.findAll({
      attributes: ['id', 'customerId', 'type', 'rating', 'notes'],
      raw: true
    });
    console.table(interactions);

    // 5. Smart Insights Table
    console.log('\n💡 [TABLE: insights]');
    const insights = await Insight.findAll({
      attributes: ['id', 'customerId', 'riskScore', 'recommendation'],
      raw: true
    });
    console.table(insights);

    // 6. Audit Logs Table
    console.log('\n🔒 [TABLE: audit_logs]');
    const auditLogs = await AuditLog.findAll({
      attributes: ['id', 'action', 'details', 'performedBy', 'role', 'createdAt'],
      raw: true
    });
    console.table(auditLogs);

    console.log('\n========================================================================');
    console.log('✅ End of Database Output');
    console.log('========================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching data from RDS:', error.message);
    process.exit(1);
  }
};

displayDatabaseData();
