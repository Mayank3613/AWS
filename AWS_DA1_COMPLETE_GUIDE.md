# AWS DA1 Assignment: Customer Report & Insight System
## Complete Implementation & Deployment Guide with Amazon AWS RDS

This document contains the complete step-by-step documentation for completing **DA1 (Digital Assignment 1)** on **Amazon Web Services (AWS)** using **Amazon EC2** for application hosting and **Amazon RDS (Relational Database Service - PostgreSQL / MySQL)** for managed cloud database storage.

---

## 📑 Table of Contents
1. [Architecture Overview (Amazon EC2 + Amazon RDS)](#1-architecture-overview-amazon-ec2--amazon-rds)
2. [Task 1: EC2 Instance Creation & SSH Access](#task-1-ec2-instance-creation--ssh-access)
3. [Task 2: Amazon AWS RDS Database Provisioning](#task-2-amazon-aws-rds-database-provisioning)
4. [Task 3: Deploying Full-Stack Application on EC2 with RDS](#task-3-deploying-full-stack-application-on-ec2-with-rds)
5. [Task 4: Policy & Access Rights for End Users / Consumers (AWS IAM)](#task-4-policy--access-rights-for-end-users--consumers-aws-iam)
6. [Task 5: Security Hardening & Storage Size Expansion (EBS & RDS)](#task-5-security-hardening--storage-size-expansion-ebs--rds)
7. [Task 6: Viewing & Querying Database Data in AWS](#task-6-viewing--querying-database-data-in-aws)
8. [Automated Scripts Reference](#automated-scripts-reference)
9. [DA1 Viva / Oral Exam Q&A](#da1-viva--oral-exam-qa)

---

## 1. Architecture Overview (Amazon EC2 + Amazon RDS)

```
+-----------------------------------------------------------------------------------------------+
|                                          AWS CLOUD                                            |
|                                                                                               |
|   +---------------------------------------------------------------------------------------+   |
|   |                               AWS VPC (Default / Custom)                              |   |
|   |                                                                                       |   |
|   |   +---------------------------------------+   +-----------------------------------+   |   |
|   |   |        AMAZON EC2 INSTANCE            |   |          AMAZON AWS RDS           |   |   |
|   |   |    (Ubuntu 24.04 LTS - t2/t3.micro)   |   |   (PostgreSQL 16 - db.t3.micro)   |   |   |
|   |   |         IP: 3.110.108.245              |   |                                   |   |   |
|   |   |                                       |   |                                   |   |   |
|   |   |   +-------------------------------+   |   |   +---------------------------+   |   |   |
|   |   |   |       NGINX REVERSE PROXY     |   |   |   |  Managed Relational DB    |   |   |   |
|   |   |   |       (Port 80 / Port 443)    |   |   |   |   (Port 5432 / SSL)       |   |   |   |
|   |   |   +---------------+---------------+   |   |   +-------------+-------------+   |   |   |
|   |   |                   |                   |   |                 ^                 |   |   |
|   |   |         +---------+---------+         |   |                 |                 |   |   |
|   |   |         |                   |         |   |                 |                 |   |   |
|   |   |         v                   v         |   |                 |                 |   |   |
|   |   |   +-----------+   +---------------+   |   |                 |                 |   |   |
|   |   |   |   REACT   |   |  NODE/EXPRESS |   |   |                 |                 |   |   |
|   |   |   | FRONTEND  |   |   API (PM2)   |---+---|----(SSL Query)--+                 |   |   |
|   |   |   +-----------+   +---------------+   |   |                                   |   |   |
|   |   +---------------------------------------+   |   +---------------------------+   |   |   |
|   |                                               |   |    20 GB RDS Storage      |   |   |   |
|   |                                               |   |  & Automated Snapshots    |   |   |   |
|   |                                               |   +---------------------------+   |   |   |
|   |                                               +-----------------------------------+   |   |
|   +---------------------------------------------------------------------------------------+   |
|                                                                                               |
|             +-------------------------------+   +-------------------------------+             |
|             |        AWS EBS STORAGE        |   |         AWS S3 BUCKET         |             |
|             |    Root Volume (20GB - gp3)   |   |     (Automated DB Backups)    |             |
|             +-------------------------------+   +-------------------------------+             |
+-----------------------------------------------------------------------------------------------+
```

### AWS Free Tier Allowance Breakdown
| AWS Service | Free Tier Allowance | Our Project Usage | Cost |
| :--- | :--- | :--- | :--- |
| **Amazon EC2** | 750 hours/month of `t2.micro` or `t3.micro` | 1 instance (`t3.micro` - Mumbai) | **$0.00** |
| **Amazon RDS** | 750 hours/month of `db.t3.micro` / `db.t4g.micro` | 1 database instance (PostgreSQL) | **$0.00** |
| **RDS Storage** | 20 GB/month of General Purpose (SSD) storage | 20 GB gp3 storage | **$0.00** |
| **Amazon EBS** | 30 GB/month of General Purpose SSD (gp2/gp3) | 20 GB gp3 Root Volume | **$0.00** |
| **Amazon S3** | 5 GB standard storage, 2,000 PUT requests | RDS backup dumps (~30 MB) | **$0.00** |
| **AWS IAM** | Always Free | Least-Privilege Policies & Roles | **$0.00** |
| **Security Groups** | Always Free | Dedicated EC2 & RDS Security Groups | **$0.00** |

---

## Task 1: EC2 Instance Creation & SSH Access

### Step 1.1: Launching the EC2 Instance in AWS Console
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **EC2** and navigate to the **EC2 Dashboard**.
3. Region: **Mumbai (`ap-south-1`)** or **N. Virginia (`us-east-1`)**.
4. Click **Launch Instance** and configure:
   - **Name**: `Customer-Report-System-Server`
   - **AMI**: Select **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** (Free tier eligible).
   - **Instance type**: `t3.micro` (1 vCPU, 1 GiB RAM).
   - **Key pair**:
     - Name: `customer-report-key` | Type: `RSA` | Format: `.pem`.
   - **Network settings**:
     - Auto-assign Public IP: `Enable`.
     - Security Group: `customer-report-ec2-sg`.
     - Inbound Rules:
       1. **SSH (Port 22)**: Source: `0.0.0.0/0` (or `My IP`).
       2. **HTTP (Port 80)**: Source: `0.0.0.0/0`.
       3. **HTTPS (Port 443)**: Source: `0.0.0.0/0`.
   - **Storage**: `20 GiB` gp3.
5. Click **Launch Instance**.
6. Assigned Public IP: **`3.110.108.245`**.

---

### Step 1.2: Connecting via SSH

#### macOS / Linux Terminal
```bash
cd ~/Downloads
chmod 400 customer-report-key.pem
ssh -i customer-report-key.pem ubuntu@3.110.108.245
```

#### Windows PowerShell
```powershell
cd $HOME\Downloads
icacls.exe customer-report-key.pem /inheritance:r /grant:r "$($env:username):(R)"
ssh -i customer-report-key.pem ubuntu@3.110.108.245
```

#### EC2 Instance Connect (Directly in Browser)
In AWS Console, select instance > click **Connect** > tab **EC2 Instance Connect** > click **Connect**.

---

## Task 2: Amazon AWS RDS Database Provisioning

### Step 2.1: Creating Amazon RDS PostgreSQL Database in AWS Console
1. In AWS Management Console, open **Amazon RDS Console**.
2. Click **Databases** > **Create database**.
3. Configuration:
   - **Method**: `Standard create`
   - **Engine**: `PostgreSQL 16`
   - **Template**: `Free tier`
   - **DB instance identifier**: `customer-report-rds`
   - **Master username**: `postgres`
   - **Master password**: `password123`
   - **DB instance class**: `db.t3.micro` (1 vCPU, 1 GiB RAM)
   - **Allocated storage**: `20 GiB` gp3
   - **Public access**: `Yes`
   - **VPC Security Group**: `customer-report-rds-sg`
   - **Database port**: `5432`
   - **Initial database name**: `customer_report_system`
4. Click **Create database** and wait until status becomes **`Available`**.

---

### Step 2.2: Configure RDS Security Group for EC2 Connection
1. In the RDS Console, click on `customer-report-rds`.
2. Under **Connectivity & security**, click **VPC security groups** (`customer-report-rds-sg`).
3. Click **Inbound rules** > **Edit inbound rules**:
   - **Type**: `PostgreSQL` (Port `5432`)
   - **Source**: `customer-report-ec2-sg` (or `0.0.0.0/0`)
4. Save rules and copy the **Endpoint**:
   `customer-report-rds.c50048ee6ua4.ap-south-1.rds.amazonaws.com`

---

## Task 3: Deploying Full-Stack Application on EC2 with RDS

### Step 3.1: Clone Project to EC2
```bash
cd /home/ubuntu
git clone https://github.com/Mayank3613/AWS.git Customer-Report-System-AWS
cd Customer-Report-System-AWS
```

---

### Step 3.2: Run Automated Server Setup
```bash
chmod +x aws/scripts/*.sh
./aws/scripts/setup-ec2.sh
```

---

### Step 3.3: Configure Amazon RDS Environment Variables
Edit `/home/ubuntu/Customer-Report-System-AWS/.env`:
```env
PORT=5000
NODE_ENV=production

# Amazon AWS RDS Configuration
DB_HOST=customer-report-rds.c50048ee6ua4.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=customer_report_system
DB_USER=postgres
DB_PASSWORD=password123
DB_DIALECT=postgres
DB_SSL=true

JWT_SECRET=super_secret_jwt_key_aws_customer_report_2026
CORS_ORIGIN=*
SERVE_STATIC=true
```

---

### Step 3.4: Seed RDS Database & Deploy
```bash
./aws/scripts/deploy.sh
```

---

### Step 3.5: Configure PM2 Auto-Start on Boot / Reboots
```bash
pm2 startup systemd
# Run the sudo env PATH=... command printed by PM2
pm2 save
```

---

### Step 3.6: Verification & Live Testing
1. **Web Application**:
   [http://3.110.108.245/login](http://3.110.108.245/login)
2. **Health Check Endpoint**:
   [http://3.110.108.245/api/health](http://3.110.108.245/api/health)
   ```json
   {
     "status": "OK",
     "service": "Customer Report System API",
     "databaseEngine": "Amazon AWS RDS (PostgreSQL/MySQL)",
     "databaseHost": "customer-report-rds.c50048ee6ua4.ap-south-1.rds.amazonaws.com",
     "databaseStatus": "Connected (Amazon RDS)",
     "environment": "production"
   }
   ```
3. **Login Accounts**:
   - **Admin**: `admin@example.com` / `password123`
   - **Manager**: `manager@example.com` / `password123`
   - **Staff**: `staff@example.com` / `password123`

---

## Task 4: Policy & Access Rights for End Users / Consumers (AWS IAM)

### Step 4.1: Custom Least-Privilege IAM Policy for Consumers/Auditors
1. Go to **AWS Console > IAM > Policies > Create policy**.
2. Select **JSON** and paste [`aws/iam-policies/enduser-consumer-policy.json`](./aws/iam-policies/enduser-consumer-policy.json):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowConsumerReadOnlyEC2AndRDSStatus",
         "Effect": "Allow",
         "Action": [
           "ec2:DescribeInstances",
           "ec2:DescribeInstanceStatus",
           "ec2:DescribeSecurityGroups",
           "rds:DescribeDBInstances",
           "rds:DescribeDBClusters",
           "rds:DescribeDBSnapshots"
         ],
         "Resource": "*"
       },
       {
         "Sid": "AllowConsumerCloudWatchMetricsView",
         "Effect": "Allow",
         "Action": [
           "cloudwatch:GetMetricData",
           "cloudwatch:GetMetricStatistics",
           "cloudwatch:ListMetrics"
         ],
         "Resource": "*"
       },
       {
         "Sid": "DenyDestructiveActions",
         "Effect": "Deny",
         "Action": [
           "ec2:TerminateInstances",
           "ec2:StopInstances",
           "rds:DeleteDBInstance",
           "rds:StopDBInstance",
           "s3:DeleteObject",
           "iam:*"
         ],
         "Resource": "*"
       }
     ]
   }
   ```
3. Name policy: `CustomerReport-Consumer-ReadOnly-Policy`.

---

## Task 5: Security Hardening & Storage Size Expansion (EBS & RDS)

### Part 5A: Security Hardening
1. **Network Isolation**: Dedicated EC2 and RDS Security Groups.
2. **In-Transit Encryption**: Enforced SSL/TLS on all Sequelize connections (`ssl: { require: true, rejectUnauthorized: false }`).
3. **At-Rest Encryption**: AWS KMS 256-bit encryption for Amazon RDS database storage.

### Part 5B: Storage Size Expansion
1. **EC2 EBS Expansion**: In AWS Console -> EC2 -> Volumes -> Modify Volume -> Increase to `20 GiB`.
2. Run live partition expansion on EC2:
   ```bash
   ./aws/scripts/resize-disk.sh
   ```
3. Verify storage with `df -hT /`.

---

## Task 6: Viewing & Querying Database Data in AWS

### Method 1: In AWS Console (EC2 Instance Connect 1-Click)
1. Open **AWS Management Console** -> **EC2** -> **Instances**.
2. Select `Customer-Report-System-Server` -> Click **Connect** -> **EC2 Instance Connect**.
3. Run the automated table viewer in your browser:
   ```bash
   cd Customer-Report-System-AWS
   node aws/scripts/view-db.js
   ```
   *Displays formatted ASCII tables for `users`, `customers`, `reports`, `interaction_logs`, `insights`, and `audit_logs`.*

### Method 2: In the Amazon RDS Monitoring Console
1. Open **AWS Console** -> **RDS** -> **Databases** -> `customer-report-rds`.
2. Explore **Monitoring tab**:
   - **DB Connections**: Real-time active connection pool telemetry.
   - **Free Storage Space**: Storage usage of the 20 GB allocation.
   - **Read/Write IOPS & Latency**: Query performance metrics.

### Method 3: Direct SQL Client (`psql`)
```bash
psql "postgresql://postgres:password123@customer-report-rds.c50048ee6ua4.ap-south-1.rds.amazonaws.com:5432/customer_report_system"
```
```sql
SELECT name, email, status, "riskScore", "healthScore", ltv, mrr FROM customers;
```

---

## Automated Scripts Reference

| Script Path | Purpose | Execution Command |
| :--- | :--- | :--- |
| `aws/scripts/setup-ec2.sh` | Provisions Node 20, PostgreSQL tools, Nginx, PM2 & 2GB Swap | `./aws/scripts/setup-ec2.sh` |
| `aws/scripts/deploy.sh` | Builds frontend, cleans Nginx, seeds RDS, launches PM2 | `./aws/scripts/deploy.sh` |
| `aws/scripts/populate-data.js` | Appends new enterprise clients & reports to Amazon RDS | `node aws/scripts/populate-data.js` |
| `aws/scripts/view-db.js` | Connects to RDS and outputs all table rows in terminal | `node aws/scripts/view-db.js` |
| `aws/scripts/debug-fix.sh` | Automated Nginx reset, reverse proxy fix & diagnostic | `./aws/scripts/debug-fix.sh` |
| `aws/scripts/backup-rds.sh` | Dumps Amazon RDS PostgreSQL & uploads snapshot to S3 | `./aws/scripts/backup-rds.sh` |
| `aws/scripts/restore-rds.sh` | Restores SQL backup dump to Amazon RDS instance | `./aws/scripts/restore-rds.sh <file>` |
| `aws/scripts/resize-disk.sh` | Resizes Linux partition & filesystem after EBS expansion | `./aws/scripts/resize-disk.sh` |

---

## DA1 Viva / Oral Exam Q&A

### Q1: What is Amazon RDS and why did we migrate from local/NoSQL MongoDB to Amazon RDS?
> **Answer**: Amazon Relational Database Service (RDS) is a fully-managed cloud database service that automates provisioning, hardware scaling, patching, automated daily backups, point-in-time recovery, and multi-AZ replication. We migrated to Amazon RDS PostgreSQL because our Customer Report System features strongly relational entities (Users, Customers, Reports, Audit Logs, and Interaction Logs) requiring ACID transactions, foreign key integrity, and enterprise-grade cloud resilience.

### Q2: How does Sequelize ORM connect to Amazon RDS securely?
> **Answer**: Sequelize connects via TCP over Port 5432 using encrypted SSL/TLS (`dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }`). Credentials are securely passed through server environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`), and connection pooling (`max: 10, idle: 10000`) prevents resource exhaustion on the `db.t3.micro` instance.

### Q3: What is the purpose of Nginx in front of Node.js on EC2?
> **Answer**: Nginx acts as a high-performance reverse proxy and web server. It terminates incoming HTTP/HTTPS traffic on ports 80/443, handles client routing, and forwards all requests to Express on localhost port 5000, eliminating CORS issues and hiding backend infrastructure.

### Q4: How is the Principle of Least Privilege enforced on AWS for End Users?
> **Answer**: Through AWS IAM custom policies (`CustomerReport-Consumer-ReadOnly-Policy`), end-users and auditors are granted read-only permissions (`ec2:Describe*`, `rds:Describe*`, `cloudwatch:GetMetric*`) while explicitly denying any destructive capabilities (`ec2:TerminateInstances`, `rds:DeleteDBInstance`, `iam:*`).

### Q5: How do you increase EBS volume storage without causing downtime?
> **Answer**:
> 1. Increase volume size dynamically in the AWS EC2 Console.
> 2. On the live Linux EC2 instance, execute `sudo growpart /dev/xvda 1` to expand the partition table.
> 3. Run `sudo resize2fs /dev/xvda1` (for ext4) to stretch the filesystem to fill the newly available block storage without unmounting or rebooting.
