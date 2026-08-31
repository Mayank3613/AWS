const { sequelize } = require('../config/db');
const User = require('./User');
const Customer = require('./Customer');
const Report = require('./Report');
const InteractionLog = require('./InteractionLog');
const Insight = require('./Insight');
const AuditLog = require('./AuditLog');

// 1. User <-> Customer Associations
User.hasMany(Customer, { foreignKey: 'assignedTo', as: 'customers' });
Customer.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });

// 2. User <-> Report Associations
User.hasMany(Report, { foreignKey: 'assignedTo', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });

// 3. Customer <-> Report Associations (Cascade Delete)
Customer.hasMany(Report, { foreignKey: 'customerId', as: 'reports', onDelete: 'CASCADE' });
Report.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// 4. Customer <-> InteractionLog Associations (Cascade Delete)
Customer.hasMany(InteractionLog, { foreignKey: 'customerId', as: 'interactions', onDelete: 'CASCADE' });
InteractionLog.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// 5. User <-> InteractionLog Associations
User.hasMany(InteractionLog, { foreignKey: 'userId', as: 'interactions' });
InteractionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 6. Customer <-> Insight Associations (Cascade Delete)
Customer.hasOne(Insight, { foreignKey: 'customerId', as: 'insight', onDelete: 'CASCADE' });
Insight.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// 7. User <-> AuditLog Associations
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Customer,
  Report,
  InteractionLog,
  Insight,
  AuditLog
};
