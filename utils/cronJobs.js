const cron = require('node-cron');
const { Op } = require('sequelize');
const { Customer, Report } = require('../models');
const sendEmail = require('./sendEmail');

const initCronJobs = () => {
  // Run every day at 8:00 AM to check for high pending payments
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily Amazon RDS automation tasks...');
    try {
      const customersWithPending = await Customer.findAll({
        where: {
          pendingPayments: {
            [Op.gt]: 1000
          }
        }
      });

      for (const cust of customersWithPending) {
        console.log(`[RDS Cron Alert] Customer ${cust.name} has overdue payments: $${cust.pendingPayments}`);
      }
    } catch (error) {
      console.error('Error in daily cron job:', error.message);
    }
  });

  // Run every Friday at 5:00 PM to summarize weekly activity
  cron.schedule('0 17 * * 5', async () => {
    console.log('Running weekly summary report task...');
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newReports = await Report.count({
        where: {
          createdAt: {
            [Op.gte]: sevenDaysAgo
          }
        }
      });

      if (process.env.ADMIN_EMAIL) {
        await sendEmail({
          email: process.env.ADMIN_EMAIL,
          subject: 'Weekly Customer Report System Summary (Amazon RDS)',
          message: `Weekly Summary:\n\nNew Reports this week: ${newReports}\nLogin to the dashboard to see full analytics.`
        });
      }
    } catch (error) {
      console.error('Error in weekly cron job:', error.message);
    }
  });
};

module.exports = initCronJobs;
