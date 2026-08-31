// ==============================================================================
// PM2 Process Manager Configuration for Customer Report System
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'customer-report-api',
      script: 'server.js',
      cwd: '/home/ubuntu/Customer-Report-System-AWS',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '450M',
      restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
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
