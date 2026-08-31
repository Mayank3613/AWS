const { Op, fn, col, literal } = require('sequelize');
const { Customer, Report, sequelize } = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.count();

    const activeComplaints = await Report.count({
      where: {
        status: { [Op.in]: ['Open', 'In Progress'] }
      }
    });

    const highRiskCustomers = await Customer.count({
      where: {
        riskScore: 'High'
      }
    });

    const totalMRR = (await Customer.sum('mrr')) || 0;
    const totalPendingPayments = (await Customer.sum('pendingPayments')) || 0;

    // Risk Distribution for Charts
    const rawRiskDist = await Customer.findAll({
      attributes: [
        'riskScore',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['riskScore'],
      raw: true
    });

    const riskDistribution = rawRiskDist.map((item) => ({
      _id: item.riskScore || 'Low',
      count: parseInt(item.count) || 0
    }));

    // Report Status Distribution for Charts
    const rawReportDist = await Report.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const reportStatusDistribution = rawReportDist.map((item) => ({
      _id: item.status || 'Open',
      count: parseInt(item.count) || 0
    }));

    // Monthly Sales & Customer Trend
    const allCustomers = await Customer.findAll({
      attributes: ['createdAt', 'mrr'],
      order: [['createdAt', 'ASC']],
      raw: true
    });

    const trendMap = {};
    allCustomers.forEach((c) => {
      const date = new Date(c.createdAt);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!trendMap[key]) {
        trendMap[key] = {
          _id: { month, year },
          mrrAdded: 0,
          customersAdded: 0
        };
      }
      trendMap[key].mrrAdded += parseFloat(c.mrr) || 0;
      trendMap[key].customersAdded += 1;
    });

    const monthlySalesTrend = Object.values(trendMap);

    res.status(200).json({
      totalCustomers,
      activeComplaints,
      highRiskCustomers,
      totalMRR,
      totalPendingPayments,
      riskDistribution,
      reportStatusDistribution,
      monthlySalesTrend
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Error calculating dashboard analytics on Amazon RDS' });
  }
};

module.exports = {
  getDashboardStats
};
