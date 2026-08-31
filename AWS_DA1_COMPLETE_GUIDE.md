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
7. [Automated Scripts Reference](#automated-scripts-reference)
8. [DA1 Viva / Oral Exam Q&A](#da1-viva--oral-exam-qa)

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
|   |   |    (Ubuntu 24.04 LTS - t2.micro)      |   |   (PostgreSQL 16 - db.t3.micro)   |   |   |
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
| **Amazon EC2** | 750 hours/month of `t2.micro` or `t3.micro` | 1 instance (`t2.micro`) | **$0.00** |
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
3. Choose your preferred region: **N. Virginia (`us-east-1`)** or **Mumbai (`ap-south-1`)**.
4. Click **Launch Instance** and configure:
   - **Name**: `Customer-Report-System-Server`
   - **AMI**: Select **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** (Free tier eligible).
   - **Instance type**: `t2.micro` (or `t3.micro` - 1 vCPU, 1 GiB RAM).
   - **Key pair**:
     - Click **Create new key pair**.
     - Name: `customer-report-key` | Type: `RSA` | Format: `.pem`.
     - Click **Create key pair** and save the downloaded file `customer-report-key.pem`.
   - **Network settings**:
     - Auto-assign Public IP: `Enable`.
     - Create Security Group: `customer-report-ec2-sg`.
     - Inbound Rules:
       1. **SSH (Port 22)**: Source: `My IP` (or `0.0.0.0/0`).
       2. **HTTP (Port 80)**: Source: `0.0.0.0/0`.
       3. **HTTPS (Port 443)**: Source: `0.0.0.0/0`.
   - **Storage**: `8 GiB` or `10 GiB` gp3.
5. Click **Launch Instance**.
6. Note the assigned **Public IPv4 address** (e.g., `54.210.120.45`).

---

### Step 1.2: Connecting via SSH

#### macOS / Linux Terminal
```bash
cd ~/Downloads
chmod 400 customer-report-key.pem
ssh -i customer-report-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

#### Windows PowerShell
```powershell
cd $HOME\Downloads
icacls.exe customer-report-key.pem /inheritance:r /grant:r "$($env:username):(R)"
ssh -i customer-report-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

#### EC2 Instance Connect (Browser 1-Click)
In AWS Console, select instance > click **Connect** > tab **EC2 Instance Connect** > click **Connect**.

---

## Task 2: Amazon AWS RDS Database Provisioning

### Step 2.1: Creating Amazon RDS PostgreSQL Database in AWS Console
1. In the AWS Management Console search bar, type **RDS** and open the **Amazon RDS Console**.
2. Click **Databases** > **Create database**.
3. Configure the database creation settings:
   - **Choose a database creation method**: `Standard create`
   - **Engine options**:
     - Engine type: **`PostgreSQL`** (or `MySQL`)
     - Version: `PostgreSQL 16.x` (or latest stable default)
   - **Templates**: Select **`Free tier`** (This automatically selects eligible instance types and configurations).
   - **Settings**:
     - **DB instance identifier**: `customer-report-rds`
     - **Master username**: `postgres`
     - **Master password**: `YourSecureRDSPassword123!` (Choose a strong password and save it)
   - **Instance configuration**:
     - DB instance class: **`db.t3.micro`** or **`db.t4g.micro`** (1 vCPU, 1 GiB RAM - Free Tier).
   - **Storage**:
     - Storage type: `General Purpose SSD (gp3)`
     - Allocated storage: **`20 GiB`** (Included in Free Tier)
     - **Uncheck** *Enable storage autoscaling* (to prevent unexpected scaling beyond free tier).
   - **Connectivity**:
     - Virtual Private Cloud (VPC): Choose **Default VPC** (same VPC as your EC2 instance).
     - **Public access**: `Yes` (Allows direct connection from local development and EC2) or `No` (EC2-only access).
     - VPC security group: Choose **Create new** > Name: `customer-report-rds-sg`.
     - Database port: `5432` (PostgreSQL default).
   - **Additional configuration**:
     - **Initial database name**: `customer_report_system`
     - Backup retention period: `7 days` (Free automated snapshots).
     - Encryption: `Enable encryption` (AWS KMS default key).
4. Click **Create database**.
5. Wait 4-8 minutes until **Status** becomes **`Available`**.

---

### Step 2.2: Configure RDS Security Group for EC2 Connection
To allow the EC2 backend server to communicate securely with the RDS database:
1. In the RDS Console, click on your database `customer-report-rds`.
2. Under **Connectivity & security**, click on the **VPC security groups** link (`customer-report-rds-sg`).
3. Select the security group > click the **Inbound rules** tab > click **Edit inbound rules**.
4. Add the following rule:
   - **Type**: `PostgreSQL` (Port `5432`)
   - **Source**: Select **Custom** and search for your EC2 Security Group ID (`customer-report-ec2-sg` or `sg-xxxxxx`), or select `0.0.0.0/0` / `My IP` for testing.
5. Click **Save rules**.
6. Go back to your RDS database details and copy the **Endpoint**:
   *(Example Endpoint: `customer-report-rds.c7yxxxxxx.us-east-1.rds.amazonaws.com`)*

---

## Task 3: Deploying Full-Stack Application on EC2 with RDS

### Step 3.1: Transfer / Clone Project to EC2
```bash
# Inside your EC2 SSH terminal:
git clone https://github.com/Mayank3613/AWS.git Customer-Report-System-AWS
cd Customer-Report-System-AWS
```

---

### Step 3.2: Run Automated Server Setup
```bash
chmod +x aws/scripts/*.sh
./aws/scripts/setup-ec2.sh
```
*This installs Node.js 20 LTS, PostgreSQL client tools, Nginx, PM2, and enables 2GB Swap space.*

---

### Step 3.3: Configure Amazon RDS Environment Variables
Create and edit `.env`:
```bash
cp .env.production .env
nano .env
```
Update the RDS credentials with your actual AWS RDS endpoint:
```env
PORT=5000
NODE_ENV=production

# Amazon AWS RDS Configuration
DB_HOST=customer-report-rds.c7yxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=customer_report_system
DB_USER=postgres
DB_PASSWORD=YourSecureRDSPassword123!
DB_DIALECT=postgres
DB_SSL=true

JWT_SECRET=super_secret_jwt_key_aws_customer_report_2026_change_this
CORS_ORIGIN=*
SERVE_STATIC=false
```
Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

### Step 3.4: Seed RDS Database & Deploy
Run the one-command deployment script:
```bash
./aws/scripts/deploy.sh
```

**What this accomplishes:**
1. Installs backend dependencies (`sequelize`, `pg`, `bcryptjs`, etc.).
2. Builds React production bundle (`npm run build`).
3. Connects to Amazon RDS and runs `node seed.js` (creating all relational tables and default Admin/Manager/Staff accounts).
4. Configures Nginx reverse proxy routing `/api` to port 5000 and `/` to React.
5. Launches PM2 process manager for 24/7 background uptime.

---

### Step 3.5: Verification & Live Testing
1. Open your browser and navigate to:
   ```
   http://<YOUR_EC2_PUBLIC_IP>
   ```
2. Check the **Health Check Endpoint**:
   ```
   http://<YOUR_EC2_PUBLIC_IP>/api/health
   ```
   *Expected Response:*
   ```json
   {
     "status": "OK",
     "service": "Customer Report System API",
     "databaseEngine": "Amazon AWS RDS (PostgreSQL/MySQL)",
     "databaseHost": "customer-report-rds.c7yxxxxxx.us-east-1.rds.amazonaws.com",
     "databaseStatus": "Connected (Amazon RDS)",
     "environment": "production",
     "uptimeSeconds": 45
   }
   ```
3. **Login with Default Accounts**:
   - **Admin**: `admin@example.com` / `password123`
   - **Manager**: `manager@example.com` / `password123`
   - **Staff**: `staff@example.com` / `password123`

---

## Task 4: Policy & Access Rights for End Users / Consumers (AWS IAM)

In cloud environments, security is implemented across two distinct tiers:

```
+-----------------------------------------------------------------------------------+
|                                ACCESS CONTROL LAYERS                              |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |            LAYER 1: AWS IAM (Infrastructure / Consumer Level)             |   |
|   |   - Restricts AWS Management Console / API access                         |   |
|   |   - Grants Read-Only visibility to consumers/auditors for EC2 & RDS       |   |
|   |   - EC2 Instance Profile for secure S3 RDS backups without credentials    |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |            LAYER 2: APPLICATION RBAC (Customer Report System)             |   |
|   |   - Admin: Full system control, audit trails, user management             |   |
|   |   - Manager: Analytics, complaint oversight, risk scoring                 |   |
|   |   - Staff: Customer profile management, interaction logging               |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

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
3. Name policy: `CustomerReport-Consumer-ReadOnly-Policy` and create it.

---

### Step 4.2: EC2 Instance Profile Role for Secure RDS S3 Backups
1. In IAM, click **Roles > Create role** > Select **AWS service (EC2)**.
2. Attach policy [`aws/iam-policies/ec2-instance-role.json`](./aws/iam-policies/ec2-instance-role.json) allowing S3 backup uploads and CloudWatch metrics.
3. Name role: `CustomerReport-EC2-Role`.
4. In **EC2 > Instances > Select Instance > Actions > Security > Modify IAM role**, attach `CustomerReport-EC2-Role`.

---

## Task 5: Security Hardening & Storage Size Expansion (EBS & RDS)

### Part 5A: Security Hardening
1. **Network Layer Isolation**:
   - RDS Database is placed inside a private/restricted security group accessible only from the EC2 instance Security Group on port 5432.
   - Nginx handles all public traffic on port 80/443; Node.js port 5000 and RDS port 5432 are never directly exposed to unauthorized IPs.
2. **Data-in-Transit Encryption**:
   - SSL/TLS is enforced on all Sequelize queries between EC2 and Amazon RDS (`ssl: { require: true, rejectUnauthorized: false }`).
3. **Data-at-Rest Encryption**:
   - Amazon RDS storage encryption enabled using AWS KMS.

---

### Part 5B: Storage Size Expansion (EBS & RDS)

#### 1. Expanding EC2 EBS Volume Storage
1. In **AWS Console > EC2 > Volumes**, select the root volume > **Actions > Modify volume**.
2. Increase size from `8 GiB` to **`20 GiB`** (within 30 GB Free Tier limit) > click **Modify**.
3. In your EC2 terminal, run the automated expansion script:
   ```bash
   ./aws/scripts/resize-disk.sh
   ```
4. Verify updated storage with `df -hT /`.

#### 2. Modifying Amazon RDS Storage Capacity
1. In **AWS Console > RDS > Databases > Select `customer-report-rds` > Modify**.
2. Under **Storage > Allocated storage**, adjust storage (e.g., from 20 GiB up to desired size).
3. Select **Apply immediately** and confirm modification.

---

## Automated Scripts Reference

| Script Path | Purpose | Execution Command |
| :--- | :--- | :--- |
| `aws/scripts/setup-ec2.sh` | Provisions Node 20, PostgreSQL tools, Nginx, PM2 & 2GB Swap | `./aws/scripts/setup-ec2.sh` |
| `aws/scripts/deploy.sh` | Builds frontend, configures Nginx, seeds RDS, launches PM2 | `./aws/scripts/deploy.sh` |
| `aws/scripts/backup-rds.sh` | Dumps Amazon RDS PostgreSQL/MySQL & uploads to S3 | `./aws/scripts/backup-rds.sh` |
| `aws/scripts/restore-rds.sh` | Restores database dump to Amazon RDS instance | `./aws/scripts/restore-rds.sh <file>` |
| `aws/scripts/resize-disk.sh` | Resizes Linux partition & filesystem after EBS expansion | `./aws/scripts/resize-disk.sh` |

---

## DA1 Viva / Oral Exam Q&A

### Q1: What is Amazon RDS and why did we migrate from local/NoSQL MongoDB to Amazon RDS?
> **Answer**: Amazon Relational Database Service (RDS) is a fully-managed cloud database service that automates provisioning, hardware scaling, patching, automated daily backups, point-in-time recovery, and multi-AZ replication. We migrated to Amazon RDS PostgreSQL because our Customer Report System features strongly relational entities (Users, Customers, Reports, Audit Logs, and Interaction Logs) requiring ACID transactions, foreign key integrity, and enterprise-grade cloud resilience.

### Q2: How does Sequelize ORM connect to Amazon RDS securely?
> **Answer**: Sequelize connects via TCP over Port 5432 using encrypted SSL/TLS (`dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }`). Credentials are securely passed through server environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`), and connection pooling (`max: 10, idle: 10000`) prevents resource exhaustion on the `db.t3.micro` instance.

### Q3: What is the purpose of Nginx in front of Node.js on EC2?
> **Answer**: Nginx acts as a high-performance reverse proxy and web server. It terminates incoming HTTP/HTTPS traffic on ports 80/443, serves cached React static assets directly with gzip compression, and forwards `/api` requests to Express on localhost port 5000, eliminating CORS issues and hiding backend infrastructure.

### Q4: How is the Principle of Least Privilege enforced on AWS for End Users?
> **Answer**: Through AWS IAM custom policies (`CustomerReport-Consumer-ReadOnly-Policy`), end-users and auditors are granted read-only permissions (`ec2:Describe*`, `rds:Describe*`, `cloudwatch:GetMetric*`) while explicitly denying any destructive capabilities (`ec2:TerminateInstances`, `rds:DeleteDBInstance`, `iam:*`).

### Q5: How do you increase EBS volume storage without causing downtime?
> **Answer**:
> 1. Increase volume size dynamically in the AWS EC2 Console.
> 2. On the live Linux EC2 instance, execute `sudo growpart /dev/xvda 1` to expand the partition table.
> 3. Run `sudo resize2fs /dev/xvda1` (for ext4) to stretch the filesystem to fill the newly available block storage without unmounting or rebooting.
