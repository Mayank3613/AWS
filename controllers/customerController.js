const Customer = require('../models/Customer');
const Report = require('../models/Report');
const Insight = require('../models/Insight');
const { logAudit } = require('./auditController');

const getCustomers = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role === 'staff') {
            query.assignedTo = req.user._id;
        }
        const customers = await Customer.find(query);
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCustomer = async (req, res) => {
    try {
        let { name, email, contact, status, segment, ltv, mrr, clv, healthScore } = req.body;

        if (!name || !email || !contact) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Auto-calculate missing financial metrics based on MRR (approx 24 mo lifespan)
        mrr = mrr || 0;
        clv = clv || (mrr * 24);
        ltv = ltv || (clv * 0.8);

        const customer = await Customer.create({
            name,
            email,
            contact,
            status,
            segment,
            ltv,
            mrr,
            clv,
            healthScore,
            assignedTo: req.user._id
        });

        await logAudit(req.user._id, 'Create Customer', `Created a new customer profile for ${name}.`);
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        let updateData = { ...req.body };
        
        // If MRR is updated but not CLV, auto-calculate CLV
        if (updateData.mrr !== undefined && updateData.clv === undefined) {
            updateData.clv = updateData.mrr * 24;
            updateData.ltv = updateData.clv * 0.8;
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        await logAudit(req.user._id, 'Update Customer', `Updated profile details for customer ${updatedCustomer.name}.`);
        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Cascade delete: Remove all reports and insights for this customer
        await Report.deleteMany({ customerId: customer._id });
        await Insight.deleteMany({ customerId: customer._id });
        await customer.deleteOne();

        await logAudit(req.user._id, 'Delete Customer', `Deleted customer profile: ${customer.name}. Associated reports and insights also removed.`);

        res.status(200).json({ id: req.params.id });
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
