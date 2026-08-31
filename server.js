const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { sequelize, connectDB } = require('./config/db');
const initCronJobs = require('./utils/cronJobs');

// Load environment variables
dotenv.config();

// Connect to Amazon AWS RDS Database
connectDB();

// Initialize Cron Jobs
initCronJobs();

const app = express();

// Configure CORS for AWS EC2 / RDS / Multiple Origins
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// AWS CloudWatch / Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Disconnected';
  try {
    await sequelize.authenticate();
    dbStatus = 'Connected (Amazon RDS)';
  } catch (err) {
    dbStatus = 'Error: ' + err.message;
  }

  res.status(200).json({
    status: 'OK',
    service: 'Customer Report System API',
    databaseEngine: 'Amazon AWS RDS (PostgreSQL/MySQL)',
    databaseHost: process.env.DB_HOST || 'localhost',
    databaseStatus: dbStatus,
    environment: process.env.NODE_ENV || 'production',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/interactions', require('./routes/interactionRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// Serve Frontend Static Build (React Single Page Application)
const clientBuildPath = path.join(__dirname, 'client', 'build');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = parseInt(process.env.PORT, 10) || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Customer Report System Active`);
  console.log(`📡 Listening on: 0.0.0.0:${PORT}`);
  console.log(`🗄️ Database: Amazon AWS RDS (${process.env.DB_HOST || 'localhost'})`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await sequelize.close();
      console.log('Amazon RDS connection closed.');
    } catch (e) {
      console.error('Error closing database:', e.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
