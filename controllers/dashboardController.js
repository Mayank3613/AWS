const Customer = require('../models/Customer');
const Report = require('../models/Report');

const getDashboardStats = async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();

        const activeComplaints = await Report.countDocuments({
            status: { $in: ['Open', 'In Progress'] }
        });

        const highRiskCustomers = await Customer.countDocuments({
            riskScore: 'High'
        });

        const mrrResult = await Customer.aggregate([
            {
                $group: {
                    _id: null,
                    totalMRR: { $sum: "$mrr" }
                }
            }
        ]);
        const totalMRR = mrrResult.length > 0 ? mrrResult[0].totalMRR : 0;

        const pendingPaymentResult = await Customer.aggregate([
            {
                $group: {
                    _id: null,
                    totalPending: { $sum: "$pendingPayments" }
                }
            }
        ]);
        const totalPendingPayments = pendingPaymentResult.length > 0 ? pendingPaymentResult[0].totalPending : 0;

        const riskDistribution = await Customer.aggregate([
            {
                $group: {
                    _id: "$riskScore",
                    count: { $sum: 1 }
                }
            }
        ]);

        const reportStatusDistribution = await Report.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Sales trend based on createdAt month
        const monthlySalesTrend = await Customer.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    mrrAdded: { $sum: "$mrr" },
                    customersAdded: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

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
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getDashboardStats
};
