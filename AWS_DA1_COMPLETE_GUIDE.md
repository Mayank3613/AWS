# AWS DA1 Assignment: Customer Report & Insight System
## Complete Step-by-Step Implementation & Deployment Guide

This document contains the complete technical documentation and step-by-step guide for completing **DA1 (Digital Assignment 1)** on **Amazon Web Services (AWS)** using the **Customer Report & Insight System** full-stack application.

---

## 📑 Table of Contents
1. [Architecture Overview (100% AWS Free Tier)](#1-architecture-overview-100-aws-free-tier)
2. [Task 1: EC2 Instance Creation & SSH Access](#task-1-ec2-instance-creation--ssh-access)
3. [Task 2: Deploying & Hosting Application on EC2](#task-2-deploying--hosting-application-on-ec2)
4. [Task 3: Policy & Access Rights Configuration for End Users / Consumers](#task-3-policy--access-rights-configuration-for-end-users--consumers)
5. [Task 4: Security Hardening & Increasing EBS Storage Size](#task-4-security-hardening--increasing-ebs-storage-size)
6. [Automated Scripts Reference](#automated-scripts-reference)
7. [DA1 Viva / Oral Exam Q&A](#da1-viva--oral-exam-qa)

---

## 1. Architecture Overview (100% AWS Free Tier)

All components (Frontend, Backend API, Database, Security, and Storage) are hosted **entirely inside AWS**:

```
+-----------------------------------------------------------------------------------+
|                                  AWS CLOUD                                        |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                            AWS VPC / EC2 INSTANCE                         |   |
|   |                       (Ubuntu 24.04 LTS - t2.micro)                       |   |
|   |                                                                           |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |   |                   NGINX WEB SERVER & REVERSE PROXY                |   |   |
|   |   |                         (Port 80 / Port 443)                      |   |   |
|   |   +---------------------------------+---------------------------------+   |   |
|   |                                     |                                     |   |
|   |                   +-----------------+-----------------+                   |   |
|   |                   |                                   |                   |   |
|   |                   v                                   v                   |   |
|   |   +-------------------------------+   +-------------------------------+   |   |
|   |   |       REACT FRONTEND          |   |       EXPRESS BACKEND         |   |   |
|   |   |    Static Build (/var/www)    |   |     PM2 Managed (Port 5000)   |   |   |
|   |   +-------------------------------+   +---------------+---------------+   |   |
|   |                                                       |                   |   |
|   |                                                       v                   |   |
|   |                                       +-------------------------------+   |   |
|   |                                       |      MONGODB DATABASE         |   |   |
|   |                                       |   Local Service (Port 27017)  |   |   |
|   |                                       +---------------+---------------+   |   |
|   |                                                       |                   |   |
|   +-------------------------------------------------------|-------------------+   |
|                                                           |                       |
|                               v                           v                       |
|               +-------------------------------+   +-------------------------------+
|               |       AWS EBS STORAGE         |   |         AWS S3 BUCKET         |
|               |    Root Volume (20GB - gp3)   |   |     (Automated DB Backups)    |
|               +-------------------------------+   +-------------------------------+
+-----------------------------------------------------------------------------------+
```

### Free Tier Resource Breakdown
| AWS Service | Free Tier Allowance | Our Project Usage | Cost |
| :--- | :--- | :--- | :--- |
| **Amazon EC2** | 750 hours/month of `t2.micro` or `t3.micro` | 1 instance (`t2.micro`) | **$0.00** |
| **Amazon EBS** | 30 GB/month of General Purpose SSD (gp2/gp3) | 20 GB gp3 Root Volume | **$0.00** |
| **Amazon S3** | 5 GB standard storage, 20,000 GET, 2,000 PUT | Database backups (~50 MB) | **$0.00** |
| **AWS IAM** | Always Free | Custom Roles, Groups, Policies | **$0.00** |
| **Security Groups** | Always Free | Inbound rules (22, 80, 443) | **$0.00** |
| **MongoDB** | Self-hosted Community Server on EC2 | Local database on EC2 | **$0.00** |

---

## Task 1: EC2 Instance Creation & SSH Access

### Step 1.1: Launching the EC2 Instance in AWS Console
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **EC2** and click on the **EC2 Dashboard**.
3. Ensure your region is set to **N. Virginia (`us-east-1`)** or **Mumbai (`ap-south-1`)** (or your preferred region).
4. Click the orange **Launch Instance** button.
5. Configure the instance with the following settings:
   - **Name and tags**: `Customer-Report-System-Server`
   - **Application and OS Images (Amazon Machine Image)**:
     - Select **Ubuntu**
     - Choose **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** (marked *Free tier eligible*).
   - **Instance type**:
     - Choose **`t2.micro`** (1 vCPU, 1 GiB Memory - Free tier eligible) or **`t3.micro`**.
   - **Key pair (login)**:
     - Click **Create new key pair**.
     - **Key pair name**: `customer-report-key`
     - **Key pair type**: `RSA`
     - **Private key file format**: `.pem` (for OpenSSH / Mac / Linux / Windows 10+).
     - Click **Create key pair** (the file `customer-report-key.pem` will download automatically to your computer).
   - **Network settings**:
     - Click **Edit**.
     - **Auto-assign Public IP**: `Enable`.
     - Select **Create security group**.
     - **Security group name**: `customer-report-sg`
     - **Description**: `Security group for Customer Report System (SSH, HTTP, HTTPS)`
     - Add the following Inbound Security Rules:
       1. **Type**: `SSH` | **Port**: `22` | **Source**: `My IP` (Recommended for security) or `Anywhere-IPv4 (0.0.0.0/0)`
       2. **Type**: `HTTP` | **Port**: `80` | **Source**: `Anywhere-IPv4 (0.0.0.0/0)`
       3. **Type**: `HTTPS` | **Port**: `443` | **Source**: `Anywhere-IPv4 (0.0.0.0/0)`
   - **Configure storage**:
     - Keep standard initial size: `8 GiB` or `10 GiB` gp3 (we will expand this to 20 GiB in Task 4).
6. Click **Launch Instance**.
7. Wait 1-2 minutes until **Instance state** shows `Running` and **Status check** shows `2/2 checks passed`.
8. Copy the **Public IPv4 address** (e.g. `54.210.120.45`).

---

### Step 1.2: Connecting to EC2 Instance via SSH

#### Option A: macOS / Linux Terminal
1. Open your Terminal and navigate to the directory where `customer-report-key.pem` was downloaded:
   ```bash
   cd ~/Downloads
   ```
2. Set the private key permissions (read-only by owner, required by SSH):
   ```bash
   chmod 400 customer-report-key.pem
   ```
3. Connect to your EC2 instance:
   ```bash
   ssh -i customer-report-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
   ```
   *(Replace `<YOUR_EC2_PUBLIC_IP>` with your instance's actual IP address, e.g., `54.210.120.45`)*
4. When prompted: `Are you sure you want to continue connecting (yes/no/[fingerprint])?`, type `yes` and hit Enter.
5. You are now logged into the remote Ubuntu EC2 terminal!

#### Option B: Windows (PowerShell / Windows Terminal)
1. Open PowerShell and navigate to your key folder:
   ```powershell
   cd $HOME\Downloads
   ```
2. Fix private key permissions in Windows:
   ```powershell
   icacls.exe customer-report-key.pem /inheritance:r /grant:r "$($env:username):(R)"
   ```
3. Connect using the OpenSSH client:
   ```powershell
   ssh -i customer-report-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
   ```

#### Option C: AWS EC2 Instance Connect (Browser 1-Click)
1. In the AWS Console, go to **EC2 > Instances**.
2. Select your instance `Customer-Report-System-Server`.
3. Click the **Connect** button at the top.
4. Select the **EC2 Instance Connect** tab.
5. Username: `ubuntu`
6. Click **Connect** (a terminal window will open in your browser).

---

## Task 2: Deploying & Hosting Application on EC2

### Step 2.1: Transfer Code to EC2
You can either upload the project directory using SCP or clone it directly via Git.

#### Method A: Using SCP (From your local computer)
```bash
# Run this on your local machine:
scp -i ~/Downloads/customer-report-key.pem -r /Users/cassain/Projects/Customer_Report_System/Customer-Report-System-AWS ubuntu@<YOUR_EC2_PUBLIC_IP>:/home/ubuntu/
```

#### Method B: Using Git on EC2
```bash
# Run inside your EC2 SSH session:
git clone <YOUR_GITHUB_REPO_URL> Customer-Report-System-AWS
cd Customer-Report-System-AWS
```

---

### Step 2.2: Automated Server Environment Setup
Run the automated provisioning script provided in `aws/scripts/setup-ec2.sh`. This installs Node.js 20 LTS, MongoDB Community Server, Nginx, PM2, and configures a 2GB swap space:

```bash
cd /home/ubuntu/Customer-Report-System-AWS
chmod +x aws/scripts/*.sh
./aws/scripts/setup-ec2.sh
```

**What this script configures:**
- Updates Ubuntu repositories.
- Enables **2GB Swap Memory** (vital for `t2.micro` instances with 1GB RAM to prevent out-of-memory crashes during `npm run build`).
- Installs **Node.js 20 LTS** & **NPM**.
- Installs & starts **MongoDB Community Edition** (`mongod.service` on `127.0.0.1:27017`).
- Installs & enables **Nginx**.
- Installs **PM2** process manager globally.
- Configures **UFW Firewall** allowing ports 22, 80, and 443.

Verify services are running:
```bash
node -v                   # Should output v20.x
npm -v                    # Should output 10.x
sudo systemctl status mongod --no-pager   # Active: active (running)
sudo systemctl status nginx --no-pager    # Active: active (running)
```

---

### Step 2.3: Build and Deploy the Application
Run the one-command deployment script:

```bash
./aws/scripts/deploy.sh
```

**Or perform the steps manually:**
1. **Configure Environment File**:
   ```bash
   cp .env.production .env
   ```
2. **Install Backend Dependencies & Seed Database**:
   ```bash
   npm install --production=false
   node seed.js
   ```
3. **Build Frontend (React Production Bundle)**:
   ```bash
   cd client
   export NODE_OPTIONS="--max-old-space-size=1536"
   npm install --legacy-peer-deps
   npm run build
   cd ..
   ```
4. **Configure Nginx Reverse Proxy**:
   ```bash
   sudo cp aws/nginx/customer-report.conf /etc/nginx/sites-available/customer-report
   sudo ln -sf /etc/nginx/sites-available/customer-report /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```
5. **Start Application with PM2**:
   ```bash
   pm2 start aws/pm2/ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

---

### Step 2.4: Verification & Live Testing
1. Open your web browser and navigate to:
   ```
   http://<YOUR_EC2_PUBLIC_IP>
   ```
2. Test the **Health Check Endpoint**:
   ```
   http://<YOUR_EC2_PUBLIC_IP>/api/health
   ```
   *Expected Response:*
   ```json
   {
     "status": "OK",
     "service": "Customer Report System API",
     "environment": "production",
     "database": "Connected",
     "uptimeSeconds": 42
   }
   ```
3. **Log in with seeded credentials**:
   - **Admin Account**:
     - Email: `admin@example.com`
     - Password: `password123`
   - **Manager Account**:
     - Email: `manager@example.com`
     - Password: `password123`
   - **Staff Account**:
     - Email: `staff@example.com`
     - Password: `password123`

---

## Task 3: Policy & Access Rights Configuration for End Users / Consumers

In cloud security and compliance, access control is implemented at two distinct layers:
1. **Cloud Infrastructure Level (AWS IAM)**: Controls who can view, access, or modify AWS cloud resources.
2. **Application Level (MERN RBAC)**: Controls access within the Customer Report System (Admin, Manager, Staff).

```
+-----------------------------------------------------------------------------------+
|                                ACCESS CONTROL LAYERS                              |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |            LAYER 1: AWS IAM (Infrastructure / Consumer Level)             |   |
|   |   - Restricts AWS Console / API access                                    |   |
|   |   - Grants Read-Only visibility to consumers/auditors                     |   |
|   |   - EC2 Instance Profile for secure S3 backup writes                      |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |            LAYER 2: APPLICATION RBAC (Customer Report System)             |   |
|   |   - Admin: Full system access, audit logs, user management                |   |
|   |   - Manager: View reports, customer insights, assign tickets              |   |
|   |   - Staff: Log interactions, submit customer reports                      |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

### Step 3.1: Creating Custom IAM Policy for End-User / Consumer
Following the **Principle of Least Privilege (PoLP)**, consumers and external auditors must only have read-only access to view system status and public report exports, with explicit `Deny` on destructive actions (like stopping or terminating instances).

1. In the AWS Console, navigate to **IAM (Identity and Access Management)**.
2. In the left sidebar, click **Policies** > **Create policy**.
3. Select the **JSON** tab and paste the following policy content (located in `aws/iam-policies/enduser-consumer-policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowConsumerReadOnlyEC2Status",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeVolumes"
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
      "Sid": "AllowConsumerReadReportsFromS3",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::customer-report-system-public-reports",
        "arn:aws:s3:::customer-report-system-public-reports/*"
      ]
    },
    {
      "Sid": "DenyDestructiveActions",
      "Effect": "Deny",
      "Action": [
        "ec2:TerminateInstances",
        "ec2:StopInstances",
        "ec2:DeleteVolume",
        "s3:DeleteObject",
        "s3:DeleteBucket",
        "iam:*"
      ],
      "Resource": "*"
    }
  ]
}
```
4. Click **Next**.
5. Set **Policy Name**: `CustomerReport-Consumer-ReadOnly-Policy`.
6. Description: `Grants end-users and auditors read-only visibility while blocking all destructive actions.`
7. Click **Create policy**.

---

### Step 3.2: Creating IAM User Group & Assigning End Users
1. In the IAM sidebar, click **User groups** > **Create group**.
2. **User group name**: `Customer-Report-Auditors`
3. Under **Attach permissions policies**, search for and select:
   - `CustomerReport-Consumer-ReadOnly-Policy`
4. Click **Create group**.
5. Click **Users** > **Create user**:
   - **User name**: `auditor-consumer`
   - Check **Provide user access to the AWS Management Console**.
   - Assign the user to the `Customer-Report-Auditors` group.
   - Click **Create user**.

---

### Step 3.3: Creating IAM Role for the EC2 Instance (Instance Profile)
Attaching an IAM Role to the EC2 instance allows it to write backups directly to S3 and stream logs to CloudWatch without hardcoding AWS Access Keys in `.env` files:

1. In IAM, click **Roles** > **Create role**.
2. **Trusted entity type**: `AWS service` | **Use case**: `EC2`.
3. Under permissions, click **Create policy** (JSON) and paste `aws/iam-policies/ec2-instance-role.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudWatchLogsAndMetrics",
         "Effect": "Allow",
         "Action": [
           "logs:CreateLogGroup",
           "logs:CreateLogStream",
           "logs:PutLogEvents",
           "cloudwatch:PutMetricData"
         ],
         "Resource": "*"
       },
       {
         "Sid": "AllowS3ReportBackupAccess",
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::customer-report-system-backups",
           "arn:aws:s3:::customer-report-system-backups/*"
         ]
       }
     ]
   }
   ```
4. Name the policy `CustomerReport-EC2-Instance-Policy` and create it.
5. Attach it to the role and name the role `CustomerReport-EC2-Role`.
6. Go to **EC2 > Instances** > Select your instance > **Actions** > **Security** > **Modify IAM role**.
7. Select `CustomerReport-EC2-Role` and click **Update IAM role**.

---

## Task 4: Security Hardening & Increasing EBS Storage Size

### Part 4A: Security Configuration

#### 1. Security Groups (Network Layer)
In the AWS EC2 Console under **Security Groups**, configure strict inbound access:
| Protocol | Port | Source | Purpose | Security Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | `22` | `My IP` (`xx.xx.xx.xx/32`) | Server Administration | Never leave open to `0.0.0.0/0` in production |
| **HTTP** | `80` | `0.0.0.0/0` | Public Web Access | Routed to Nginx reverse proxy |
| **HTTPS** | `443` | `0.0.0.0/0` | Secure SSL/TLS Web Traffic | Encrypted end-user communication |
| **MongoDB** | `27017` | *Blocked from internet* | Database | Only accessible locally via `127.0.0.1` |
| **API** | `5000` | *Blocked from internet* | Node.js Backend | Only accessible locally via Nginx reverse proxy |

#### 2. Host Firewall (UFW)
Ensure UFW is enabled on Ubuntu:
```bash
sudo ufw status verbose
```
*Output:*
```
Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
```

#### 3. Enable Free SSL/TLS Certificate with Let's Encrypt (Optional for Custom Domains)
If you point a domain to your EC2 Public IP:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### Part 4B: Increasing EBS Volume Storage Size (Live Volume & Filesystem Expansion)

AWS allows dynamic EBS volume modification without stopping the instance or incurring downtime.

#### Step 4B.1: Increase Volume Size in AWS Console
1. Go to **AWS Console > EC2 > Elastic Block Store > Volumes**.
2. Select the volume attached to your instance (e.g. `vol-0a1b2c3d4e5f6g7h8`).
3. Click **Actions** > **Modify volume**.
4. Change the **Size (GiB)**:
   - Change from `8 GiB` to **`20 GiB`** (or up to 30 GiB within the Free Tier limit).
5. Click **Modify** and confirm.
6. The volume state will change to `modifying` and then `optimizing` / `in-use`.

---

#### Step 4B.2: Expand the Linux Partition & Filesystem (OS Level)
Modifying the volume in AWS Console makes raw storage available, but the Linux filesystem needs to be expanded to utilize the new space.

##### Method 1: Using the Automated Script
```bash
cd /home/ubuntu/Customer-Report-System-AWS
./aws/scripts/resize-disk.sh
```

##### Method 2: Step-by-Step Manual Execution

1. **Check current disk space before expanding**:
   ```bash
   df -hT /
   ```
   *Output shows 8GB disk size.*

2. **Inspect block devices**:
   ```bash
   lsblk
   ```
   *Example Output:*
   ```
   NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
   xvda        202:0    0   20G  0 disk 
   └─xvda1     202:1    0    8G  0 part /
   ```
   *(Notice the disk `xvda` is 20G, but partition `xvda1` is still only 8G).*

3. **Install cloud-guest-utils (if not already installed)**:
   ```bash
   sudo apt-get update -y
   sudo apt-get install -y cloud-guest-utils
   ```

4. **Extend the partition**:
   - For `xvda` (device `/dev/xvda`, partition `1`):
     ```bash
     sudo growpart /dev/xvda 1
     ```
   - For NVMe devices (`/dev/nvme0n1`, partition `1` on newer instances):
     ```bash
     sudo growpart /dev/nvme0n1 1
     ```
   *Output: `CHANGED: partition=1 start=2048 old: size=16775135 end=16777183 new: size=41940959 end=41943007`*

5. **Resize the Filesystem**:
   - Check filesystem type:
     ```bash
     df -T /
     ```
   - If filesystem type is **ext4**:
     ```bash
     sudo resize2fs /dev/xvda1
     # (or sudo resize2fs /dev/nvme0n1p1)
     ```
   - If filesystem type is **xfs**:
     ```bash
     sudo xfs_growfs /
     ```

6. **Verify the expanded disk storage**:
   ```bash
   df -hT /
   ```
   *Example Output:*
   ```
   Filesystem     Type  Size  Used Avail Use% Mounted on
   /dev/root      ext4   20G  3.8G   16G  20% /
   ```
   *(The storage capacity has now successfully increased to 20 GB with 0 downtime!)*

---

## Automated Scripts Reference

| Script Path | Description | Execution Command |
| :--- | :--- | :--- |
| `aws/scripts/setup-ec2.sh` | Provisions Node 20, MongoDB, Nginx, PM2 & Swap | `./aws/scripts/setup-ec2.sh` |
| `aws/scripts/deploy.sh` | Builds frontend, configures Nginx, and runs PM2 | `./aws/scripts/deploy.sh` |
| `aws/scripts/resize-disk.sh` | Resizes partition & filesystem after EBS expansion | `./aws/scripts/resize-disk.sh` |
| `aws/scripts/backup-db-to-s3.sh` | Backs up MongoDB database and uploads to AWS S3 | `./aws/scripts/backup-db-to-s3.sh` |
| `aws/scripts/restore-db.sh` | Restores MongoDB from backup archive | `./aws/scripts/restore-db.sh <file>` |

---

## DA1 Viva / Oral Exam Q&A

### Q1: What is an EC2 Instance and why did we choose `t2.micro` / `t3.micro`?
> **Answer**: Amazon Elastic Compute Cloud (EC2) provides resizable compute capacity in the cloud. We chose `t2.micro` / `t3.micro` because it provides 1 vCPU and 1 GiB memory and is included in the AWS Free Tier (750 hours/month), making it 100% cost-free for academic submissions.

### Q2: Why is Nginx used as a Reverse Proxy instead of exposing Node.js directly on Port 5000?
> **Answer**:
> 1. **Security**: Nginx shields the backend Express application and MongoDB database from direct exposure to the public internet.
> 2. **Port Simplification**: End users access standard HTTP (port 80) or HTTPS (port 443) without typing `:5000` in the URL.
> 3. **CORS Elimination**: By serving both React static files (`/`) and API routes (`/api`) under the same domain/IP, cross-origin request issues are eliminated.
> 4. **Performance**: Nginx handles static file caching, gzip compression, and SSL termination faster than Node.js.

### Q3: What is the purpose of PM2 in our deployment?
> **Answer**: PM2 is an enterprise-grade production process manager for Node.js. It ensures the backend API runs continuously in the background, automatically restarts the application if it crashes, reboots the server on EC2 system restarts (`pm2 startup`), and provides memory threshold safeguards (`max_memory_restart: 450M`).

### Q4: Explain the difference between AWS Security Groups and Network ACLs (NACLs).
> **Answer**:
> - **Security Groups**: Stateful firewalls operating at the instance level (if inbound traffic is allowed, outbound response is automatically allowed).
> - **Network ACLs**: Stateless firewalls operating at the subnet level requiring explicit inbound and outbound rules.

### Q5: How does AWS IAM enforce the Principle of Least Privilege (PoLP)?
> **Answer**: The Principle of Least Privilege dictates that users or services receive only the minimum permissions necessary to perform their role. In our project:
> - The **Consumer/Auditor IAM Policy** allows only `ec2:Describe*` and `cloudwatch:GetMetric*` (Read-only) and explicitly denies destructive actions (`ec2:TerminateInstances`, `s3:DeleteObject`).
> - The **EC2 Instance Role** is granted S3 PutObject and CloudWatch write permissions without saving long-term AWS access keys on the server filesystem.

### Q6: What steps are required to increase an EBS Volume's size on a running EC2 instance?
> **Answer**:
> 1. **Cloud Level**: Modify the EBS volume size in the AWS Console (e.g. from 8GB to 20GB).
> 2. **Partition Level**: Run `sudo growpart /dev/xvda 1` to extend the disk partition table.
> 3. **Filesystem Level**: Run `sudo resize2fs /dev/xvda1` (for ext4) or `sudo xfs_growfs /` (for XFS) to expand the filesystem to fill the new partition without rebooting.
