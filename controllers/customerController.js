const { Customer, Report, Insight, InteractionLog } = require('../models');
const { logAudit } = require('./auditController');

const getCustomers = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user && req.user.role === 'staff') {
      whereClause.assignedTo = req.user.id;
    }

    const customers = await Customer.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    let { name, email, contact, status, segment, ltv, mrr, clv, healthScore } = req.body;

    if (!name || !email || !contact) {
      return res.status(400).json({ message: 'Please add all required customer fields' });
    }

    // Auto-calculate missing financial metrics based on MRR (approx 24 mo lifespan)
    mrr = parseFloat(mrr) || 0;
    clv = parseFloat(clv) || (mrr * 24);
    ltv = parseFloat(ltv) || (clv * 0.8);
    healthScore = healthScore !== undefined ? parseInt(healthScore) : 100;

    const customer = await Customer.create({
      name,
      email,
      contact,
      status: status || 'Active',
      segment: segment || 'Regular',
      ltv,
      mrr,
      clv,
      healthScore,
      assignedTo: req.user ? req.user.id : null
    });

    await logAudit(
      req.user ? req.user.id : null,
      'Create Customer',
      `Created customer profile for ${name} on Amazon RDS.`,
      req.user ? req.user.name : 'System',
      req.user ? req.user.role : 'admin'
    );

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let updateData = { ...req.body };

    // Auto-calculate CLV/LTV if MRR changed
    if (updateData.mrr !== undefined && updateData.clv === undefined) {
      updateData.mrr = parseFloat(updateData.mrr) || 0;
      updateData.clv = updateData.mrr * 24;
      updateData.ltv = updateData.clv * 0.8;
    }

    await customer.update(updateData);

    await logAudit(
      req.user ? req.user.id : null,
      'Update Customer',
      `Updated profile details for customer ${customer.name}.`,
      req.user ? req.user.name : 'System',
      req.user ? req.user.role : 'admin'
    );

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customerName = customer.name;

    // Delete associated records
    await Report.destroy({ where: { customerId: customer.id } });
    await Insight.destroy({ where: { customerId: customer.id } });
    await InteractionLog.destroy({ where: { customerId: customer.id } });
    await customer.destroy();

    await logAudit(
      req.user ? req.user.id : null,
      'Delete Customer',
      `Deleted customer profile: ${customerName}. Associated reports, insights, and logs also removed.`,
      req.user ? req.user.name : 'System',
      req.user ? req.user.role : 'admin'
    );

    res.status(200).json({ id: req.params.id, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
