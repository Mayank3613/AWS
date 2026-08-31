const { Op } = require('sequelize');
const { Report, Customer, Insight } = require('../models');
const { logAudit } = require('./auditController');

const getReports = async (req, res) => {
  try {
    const { startDate, endDate, status, priority, customerId } = req.query;
    let whereClause = {};

    if (req.user && req.user.role === 'staff') {
      whereClause.assignedTo = req.user.id;
    }

    if (customerId) whereClause.customerId = customerId;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.createdAt = { [Op.lte]: new Date(endDate) };
    }

    const reports = await Report.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format output with customerId populated object for React client compatibility
    const formattedReports = reports.map((r) => {
      const json = r.toJSON();
      if (json.customer) {
        json.customerId = {
          _id: json.customer.id,
          id: json.customer.id,
          name: json.customer.name,
          email: json.customer.email
        };
      }
      return json;
    });

    res.status(200).json(formattedReports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReport = async (req, res) => {
  try {
    const { customerId, title, description, status, priority, customerName } = req.body;

    if (!customerId || !title || !description) {
      return res.status(400).json({ message: 'Please provide customerId, title, and description' });
    }

    const report = await Report.create({
      customerId,
      title,
      description,
      status: status || 'Open',
      priority: priority || 'Medium',
      customerName: customerName || 'Unknown Customer',
      assignedTo: req.user ? req.user.id : null,
      staffName: req.user ? req.user.name : 'System'
    });

    // Update customer last activity timestamp
    const customer = await Customer.findByPk(customerId);
    if (customer) {
      await customer.update({ lastActivity: new Date() });
    }

    await logAudit(
      req.user ? req.user.id : null,
      'Create Report',
      `Created report "${title}" for customer ${customerName || customerId} on Amazon RDS.`,
      req.user ? req.user.name : 'System',
      req.user ? req.user.role : 'staff'
    );

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateInsights = async (req, res) => {
  try {
    const customers = await Customer.findAll();
    const insights = [];

    for (const customer of customers) {
      const openReports = await Report.count({
        where: {
          customerId: customer.id,
          status: { [Op.ne]: 'Resolved' }
        }
      });

      const criticalReports = await Report.count({
        where: {
          customerId: customer.id,
          priority: 'Critical',
          status: { [Op.ne]: 'Resolved' }
        }
      });

      const lastActivityDate = customer.lastActivity ? new Date(customer.lastActivity) : new Date();
      const daysInactive = Math.floor((Date.now() - lastActivityDate) / (1000 * 60 * 60 * 24));

      let riskScore = 'Low';
      let recommendation = 'Engagement is healthy. No immediate action required.';
      let riskFactors = [];

      if (customer.healthScore < 50 || criticalReports >= 1) {
        riskScore = 'High';
        let reasons = [];
        if (customer.healthScore < 50) {
          reasons.push(`Health Score is critical (${customer.healthScore}/100)`);
          riskFactors.push(`Critical Health Score: ${customer.healthScore}`);
        }
        if (criticalReports > 0) {
          reasons.push(`${criticalReports} Critical issue(s) unresolved`);
          riskFactors.push(`${criticalReports} Unresolved Critical Report(s)`);
        }
        recommendation = `URGENT: ${reasons.join(' and ')}. Immediate executive intervention required to prevent churn.`;
      } else if (customer.healthScore < 70 || openReports >= 3) {
        riskScore = 'High';
        riskFactors.push(`High Open Ticket Count: ${openReports}`);
        if (customer.healthScore < 70) riskFactors.push(`Low Health Score: ${customer.healthScore}`);
        recommendation = `High Risk detected due to ${openReports} open reports and health score of ${customer.healthScore}. Schedule a customer success call this week.`;
      } else if (daysInactive > 30 || openReports >= 1) {
        riskScore = 'Medium';
        if (daysInactive > 30) {
          riskFactors.push(`Inactivity: No engagement for ${daysInactive} days`);
          recommendation = `Customer inactive for ${daysInactive} days. Send a "We Miss You" campaign or product update newsletter.`;
        } else {
          riskFactors.push(`${openReports} Open Report(s) pending`);
          recommendation = `Monitoring required. ${openReports} open report(s) pending. Ensure support team follows up.`;
        }
      } else if (customer.healthScore > 90 && customer.ltv > 5000000) {
        riskFactors.push('Strong Platform Adoption');
        riskFactors.push('High Lifetime Value');
        recommendation = `Prime candidate for upsell. High health (${customer.healthScore}) and LTV. Propose premium feature expansion.`;
      } else {
        riskFactors.push('Stable Usage Patterns');
        riskFactors.push('No Open Critical Issues');
      }

      await customer.update({ riskScore });

      let insight = await Insight.findOne({ where: { customerId: customer.id } });
      if (insight) {
        await insight.update({
          riskScore,
          recommendation,
          riskFactors,
          generatedAt: new Date()
        });
      } else {
        insight = await Insight.create({
          customerId: customer.id,
          riskScore,
          recommendation,
          riskFactors,
          generatedAt: new Date()
        });
      }

      const insightJson = insight.toJSON();
      insightJson.customerId = {
        _id: customer.id,
        id: customer.id,
        name: customer.name,
        email: customer.email,
        riskScore: customer.riskScore
      };
      insights.push(insightJson);
    }

    res.status(200).json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInsights = async (req, res) => {
  try {
    const insights = await Insight.findAll({
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'riskScore']
        }
      ],
      order: [['generatedAt', 'DESC']]
    });

    const formattedInsights = insights.map((i) => {
      const json = i.toJSON();
      if (json.customer) {
        json.customerId = {
          _id: json.customer.id,
          id: json.customer.id,
          name: json.customer.name,
          email: json.customer.email,
          riskScore: json.customer.riskScore
        };
      }
      return json;
    });

    res.status(200).json(formattedInsights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const oldStatus = report.status;
    await report.update(req.body);

    if (req.body.status && req.body.status !== oldStatus) {
      await logAudit(
        req.user ? req.user.id : null,
        'Update Report',
        `Changed report "${report.title}" status from ${oldStatus} to ${req.body.status}.`,
        req.user ? req.user.name : 'System',
        req.user ? req.user.role : 'staff'
      );
    }

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReports,
  createReport,
  updateReport,
  generateInsights,
  getInsights
};
