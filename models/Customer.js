const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Banned', 'On Hold'),
    defaultValue: 'Active'
  },
  riskScore: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Low'
  },
  healthScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: {
      min: 0,
      max: 100
    }
  },
  ltv: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  mrr: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  clv: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  segment: {
    type: DataTypes.ENUM('VIP', 'Regular', 'Standard', 'Premium', 'Inactive'),
    defaultValue: 'Regular'
  },
  pendingPayments: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'customers'
});

Customer.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = Customer;
