const Report = require('../models/Report');
const Customer = require('../models/Customer');
const Insight = require('../models/Insight');
const { logAudit } = require('./auditController');

const getReports = async (req, res) => {
    try {
        const { startDate, endDate, status, priority, customerId } = req.query;
        let query = {};

        if (req.user && req.user.role === 'staff') {
            query.assignedTo = req.user._id;
        }
        
        if (customerId) query.customerId = customerId;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            query.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.createdAt = { $lte: new Date(endDate) };
        }

        const reports = await Report.find(query).populate('customerId', 'name email').sort('-createdAt');
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createReport = async (req, res) => {
    try {
        const { customerId, title, description, status, priority, customerName } = req.body;

        const report = await Report.create({
            customerId,
            title,
            description,
            status,
            priority,
            customerName,
            assignedTo: req.user._id,
            staffName: req.user.name
        });

        await Customer.findByIdAndUpdate(customerId, { lastActivity: Date.now() });
        await logAudit(req.user._id, 'Create Report', `Created report "${title}" for customer ${customerName}.`);

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const generateInsights = async (req, res) => {
    try {
        const customers = await Customer.find();
        const insights = [];

        for (const customer of customers) {
            const openReports = await Report.countDocuments({
                customerId: customer._id,
                status: { $ne: 'Resolved' }
            });

            const criticalReports = await Report.countDocuments({
                customerId: customer._id,
                priority: 'Critical',
                status: { $ne: 'Resolved' }
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
            }
            else if (customer.healthScore < 70 || openReports >= 3) {
                riskScore = 'High';
                riskFactors.push(`High Open Ticket Count: ${openReports}`);
                if (customer.healthScore < 70) riskFactors.push(`Low Health Score: ${customer.healthScore}`);
                recommendation = `High Risk detected due to ${openReports} open reports and health score of ${customer.healthScore}. Schedule a customer success call this week.`;
            }
            else if (daysInactive > 30 || openReports >= 1) {
                riskScore = 'Medium';
                if (daysInactive > 30) {
                    riskFactors.push(`Inactivity: No engagement for ${daysInactive} days`);
                    recommendation = `Customer inactive for ${daysInactive} days. Send a "We Miss You" campaign or product update newsletter.`;
                } else {
                    riskFactors.push(`${openReports} Open Report(s) pending`);
                    recommendation = `Monitoring required. ${openReports} open report(s) pending. Ensure support team follows up.`;
                }
            }
            else if (customer.healthScore > 90 && customer.ltv > 5000000) {
                riskFactors.push('Strong Platform Adoption');
                riskFactors.push('High Lifetime Value');
                recommendation = `Prime candidate for upsell. High health (${customer.healthScore}) and LTV. Propose premium feature expansion.`;
            } else {
                riskFactors.push('Stable Usage Patterns');
                riskFactors.push('No Open Critical Issues');
            }

            customer.riskScore = riskScore;
            await customer.save();

            let insight = await Insight.findOne({ customerId: customer._id });
            if (insight) {
                insight.riskScore = riskScore;
                insight.recommendation = recommendation;
                insight.riskFactors = riskFactors;
                insight.generatedAt = Date.now();
                await insight.save();
            } else {
                insight = await Insight.create({
                    customerId: customer._id,
                    riskScore,
                    recommendation,
                    riskFactors
                });
            }
            insights.push(insight);
        }

        res.status(200).json(insights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInsights = async (req, res) => {
    try {
        const insights = await Insight.find().populate('customerId', 'name email riskScore');
        res.status(200).json(insights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const oldStatus = report.status;
        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (req.body.status && req.body.status !== oldStatus) {
            await logAudit(req.user._id, 'Update Report', `Changed report "${report.title}" status from ${oldStatus} to ${req.body.status}.`);
        }

        res.status(200).json(updatedReport);
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
