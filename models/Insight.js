const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Insight = sequelize.define('Insight', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  riskScore: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Low'
  },
  riskFactors: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  recommendation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'insights'
});

Insight.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = Insight;
