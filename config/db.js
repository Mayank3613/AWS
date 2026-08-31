const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Determine Database Configuration for Amazon AWS RDS
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || (process.env.DB_DIALECT === 'mysql' ? 3306 : 5432);
const dbName = process.env.DB_NAME || 'customer_report_system';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbDialect = process.env.DB_DIALECT || 'postgres'; // 'postgres' or 'mysql'

// SSL Configuration for Amazon AWS RDS
const useSSL = process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && dbHost !== 'localhost' && dbHost !== '127.0.0.1');

const dialectOptions = useSSL
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false // Compatible with AWS RDS SSL root certificates
      }
    }
  : {};

// Initialize Sequelize Connection to AWS RDS
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect,
  dialectOptions: dialectOptions,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Amazon AWS RDS Connected Successfully!`);
    console.log(`🌐 Host: ${dbHost}:${dbPort}`);
    console.log(`📦 Database: ${dbName} (Engine: ${dbDialect.toUpperCase()})`);
    console.log(`🔒 SSL Encryption: ${useSSL ? 'Enabled' : 'Disabled'}`);

    // Synchronize models with AWS RDS database tables
    // In production, sync creates tables if they don't exist without dropping data
    await sequelize.sync({ alter: false });
    console.log(`🔄 Relational Database Schema Synchronized.`);
  } catch (error) {
    console.error(`❌ Amazon AWS RDS Connection Error: ${error.message}`);
    console.error(`💡 Tip: Verify DB_HOST, DB_USER, DB_PASSWORD, and Security Group port 5432/3306 in AWS RDS.`);
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Running in non-production mode, proceeding with connection retry on next request...');
    }
  }
};

module.exports = { sequelize, connectDB };