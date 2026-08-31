# 🚀 Smart Customer Report & Insight System (AWS Edition)

A full-stack enterprise customer management, reporting, and automated risk scoring application configured for **Amazon AWS EC2 & Amazon AWS RDS (PostgreSQL / MySQL)** under the **AWS Free Tier**.

---

## 📂 AWS Project Structure

```
Customer-Report-System-AWS/
├── aws/
│   ├── iam-policies/
│   │   ├── ec2-instance-role.json       # IAM role policy for EC2 (CloudWatch & S3 RDS backups)
│   │   ├── enduser-consumer-policy.json # Least-privilege IAM policy for End-Users / Auditors
│   │   └── s3-backup-policy.json        # S3 Bucket security policy
│   ├── nginx/
│   │   └── customer-report.conf         # Production Nginx reverse proxy & SPA config
│   ├── pm2/
│   │   └── ecosystem.config.js          # PM2 Process Manager configuration
│   └── scripts/
│       ├── setup-ec2.sh                 # Automates Node.js 20, PostgreSQL tools, Nginx, PM2, & Swap
│       ├── deploy.sh                    # One-command build & deployment script
│       ├── resize-disk.sh               # Live EBS volume & filesystem expansion
│       ├── backup-rds.sh                # Dumps Amazon RDS database & uploads to AWS S3
│       └── restore-rds.sh               # Restores Amazon RDS database from backup dump
├── client/                              # React.js Frontend
├── config/
│   └── db.js                            # Sequelize connection manager for Amazon AWS RDS
├── controllers/                         # Express controllers (Sequelize SQL queries)
├── middleware/                          # JWT & RBAC Auth middleware
├── models/                              # Relational Sequelize models (User, Customer, Report, Insight, AuditLog)
├── routes/                              # REST API route handlers
├── utils/                               # Helper utilities (cron jobs, email)
├── .env.example                         # Environment variable template with Amazon RDS settings
├── .env.production                      # Production environment template
├── AWS_DA1_COMPLETE_GUIDE.md            # Comprehensive Step-by-Step DA1 Submission Guide
├── package.json                         # Root package.json with Sequelize & AWS scripts
├── seed.js                              # Database seeder for Amazon RDS
└── server.js                            # Express server with RDS health check (/api/health)
```

---

## ⚡ Quick Start with Amazon AWS RDS

### 1. Provision EC2 Server (One-time)
```bash
chmod +x aws/scripts/*.sh
./aws/scripts/setup-ec2.sh
```

### 2. Configure Amazon RDS Endpoint in `.env`
```bash
cp .env.production .env
# Edit .env and enter your Amazon RDS DB_HOST, DB_USER, and DB_PASSWORD
```

### 3. Deploy & Seed RDS Database
```bash
./aws/scripts/deploy.sh
```

### 4. Access Live Application
- **Web App**: `http://<YOUR_EC2_PUBLIC_IP>`
- **RDS Health Check**: `http://<YOUR_EC2_PUBLIC_IP>/api/health`
- **Default Admin Login**: `admin@example.com` / `password123`

---

## 📖 Complete Assignment Submission Report
For the complete step-by-step submission guide covering all DA1 tasks, refer to:
👉 **[`AWS_DA1_COMPLETE_GUIDE.md`](./AWS_DA1_COMPLETE_GUIDE.md)**
