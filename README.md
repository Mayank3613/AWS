# 🚀 Smart Customer Report & Insight System (AWS Edition)

A full-stack enterprise customer management, reporting, and automated risk scoring application configured for **100% AWS Free Tier deployment** (EC2, Nginx, PM2, MongoDB on EBS, and IAM Policies).

---

## 📂 AWS Project Structure

```
Customer-Report-System-AWS/
├── aws/
│   ├── iam-policies/
│   │   ├── ec2-instance-role.json       # IAM role policy for EC2 (CloudWatch & S3 access)
│   │   ├── enduser-consumer-policy.json # Least-privilege IAM policy for End-Users / Auditors
│   │   └── s3-backup-policy.json        # S3 Bucket security policy
│   ├── nginx/
│   │   └── customer-report.conf         # Production Nginx reverse proxy & SPA config
│   ├── pm2/
│   │   └── ecosystem.config.js          # PM2 Process Manager configuration
│   └── scripts/
│       ├── setup-ec2.sh                 # Automates Node.js 20, MongoDB, Nginx, PM2, & Swap
│       ├── deploy.sh                    # One-command build & deployment script
│       ├── resize-disk.sh               # Live EBS volume & filesystem expansion
│       ├── backup-db-to-s3.sh           # Dumps MongoDB & uploads to AWS S3
│       └── restore-db.sh                # Restores MongoDB from backup archive
├── client/                              # React.js Frontend
│   ├── public/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── config/
│   └── db.js                            # Resilient MongoDB connector (Local / Atlas)
├── controllers/                         # Express controllers
├── middleware/                          # JWT & RBAC Auth middleware
├── models/                              # Mongoose models (User, Customer, Report, etc.)
├── routes/                              # REST API route handlers
├── utils/                               # Helper utilities (cron jobs, email)
├── .env.example                         # Environment variable template
├── .env.production                      # Production environment template
├── AWS_DA1_COMPLETE_GUIDE.md            # Comprehensive Step-by-Step DA1 Submission Guide
├── package.json                         # Root package.json with AWS scripts
├── seed.js                              # Database seeder for instant test data
└── server.js                            # Express server with CORS & health check
```

---

## ⚡ Quick Start on AWS EC2

### 1. Provision EC2 Environment (Run once on new EC2 instance)
```bash
chmod +x aws/scripts/*.sh
./aws/scripts/setup-ec2.sh
```

### 2. Deploy Full Application (Frontend + Backend + Database)
```bash
./aws/scripts/deploy.sh
```

### 3. Open in Browser
```
http://<YOUR_EC2_PUBLIC_IP>
```

- **Health Check Endpoint**: `http://<YOUR_EC2_PUBLIC_IP>/api/health`
- **Default Admin Login**: `admin@example.com` / `password123`

---

## 📖 Complete Assignment Documentation
For the complete step-by-step submission guide covering all 4 DA1 tasks, refer to:
👉 **[`AWS_DA1_COMPLETE_GUIDE.md`](./AWS_DA1_COMPLETE_GUIDE.md)**
