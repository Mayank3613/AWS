// ==============================================================================
// PM2 Process Manager Configuration for Customer Report System
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'customer-report-api',
      script: './server.js',
      cwd: '/home/ubuntu/Customer-Report-System-AWS',
      instances: 1, // Single instance suited for t2.micro/t3.micro (1 vCPU, 1GB RAM)
      autorestart: true,
      watch: false,
      max_memory_restart: '450M', // Prevent Out-Of-Memory on 1GB EC2 instance
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      output: './logs/pm2-out.log',
      error: './logs/pm2-err.log',
      merge_logs: true,
      time: true
    }
  ]
};
