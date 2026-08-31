const cron = require('node-cron');
const sendEmail = require('./sendEmail');
const Customer = require('../models/Customer');
const Report = require('../models/Report');

const initCronJobs = () => {
    // Run every day at 8:00 AM to check for inactive customers or overdue pending payments
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily automation tasks...');
        try {
            // Find customers with overdue pending payments (> 10,000 for demonstration)
            const customersWithPending = await Customer.find({ pendingPayments: { $gt: 10000 } });
            
            for (const cust of customersWithPending) {
                // In production, we would email the customer. Here we just log or send an alert to admins.
                console.log(`Alert: Customer ${cust.name} has overdue payments of ${cust.pendingPayments}.`);
                /*
                await sendEmail({
                    email: cust.email,
                    subject: 'Overdue Payment Reminder',
                    message: `Dear ${cust.name}, you have a pending payment of ${cust.pendingPayments}. Please clear it at your earliest convenience.`
                });
                */
            }
        } catch (error) {
            console.error('Error in daily cron job:', error);
        }
    });

    // Run every Friday at 5:00 PM to send weekly summary
    cron.schedule('0 17 * * 5', async () => {
        console.log('Running weekly summary report task...');
        try {
            const newReports = await Report.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });

            // Send to a predefined admin email (replace with actual admin email)
            if (process.env.ADMIN_EMAIL) {
                await sendEmail({
                    email: process.env.ADMIN_EMAIL,
                    subject: 'Weekly System Summary',
                    message: `Weekly Summary:\n\nNew Reports this week: ${newReports}\nLogin to the dashboard to see full analytics.`
                });
            }
        } catch (error) {
            console.error('Error in weekly cron job:', error);
        }
    });
};

module.exports = initCronJobs;
