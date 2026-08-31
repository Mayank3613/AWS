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

const isPlaceholderHost = dbHost.includes('xxxxxx') || dbHost.includes('c7y') || !dbHost;

// SSL Configuration for Amazon AWS RDS
const useSSL = process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && !isPlaceholderHost && dbHost !== 'localhost' && dbHost !== '127.0.0.1');

const dialectOptions = useSSL
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false // Compatible with AWS RDS SSL certificates
      }
    }
  : {};

// Initialize Sequelize Connection to AWS RDS
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect,
  dialectOptions: dialectOptions,
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  if (isPlaceholderHost) {
    console.log(`⚠️ Notice: DB_HOST is set to template placeholder ("${dbHost}").`);
    console.log(`👉 Please update /home/ubuntu/Customer-Report-System-AWS/.env with your real Amazon RDS endpoint.`);
    return;
  }

  try {
    await sequelize.authenticate();
    console.log(`✅ Amazon AWS RDS Connected Successfully!`);
    console.log(`🌐 Host: ${dbHost}:${dbPort}`);
    console.log(`📦 Database: ${dbName} (Engine: ${dbDialect.toUpperCase()})`);
    console.log(`🔒 SSL Encryption: ${useSSL ? 'Enabled' : 'Disabled'}`);

    // Synchronize models with AWS RDS database tables
    await sequelize.sync({ alter: false });
    console.log(`🔄 Relational Database Schema Synchronized.`);
  } catch (error) {
    console.error(`❌ Amazon AWS RDS Connection Notice: ${error.message}`);
    console.error(`💡 Tip: Verify DB_HOST, DB_USER, DB_PASSWORD, and RDS Security Group inbound rule on port ${dbPort}.`);
  }
};

module.exports = { sequelize, connectDB };