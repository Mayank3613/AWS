#!/usr/bin/env bash
# ==============================================================================
# AWS S3 Automated MongoDB Database Backup Script
# Hosts & backs up the database entirely within AWS infrastructure
# ==============================================================================

set -e

BACKUP_DIR="/tmp/mongodb_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="customer_report_system"
BACKUP_NAME="${DB_NAME}_backup_${TIMESTAMP}.tar.gz"
S3_BUCKET="customer-report-system-backups" # Replace with your S3 bucket name

echo "=========================================================="
echo "🍃 Starting MongoDB Backup on AWS EC2..."
echo "=========================================================="

# Create local backup directory
mkdir -p "$BACKUP_DIR"

# 1. Dump MongoDB database
echo "📦 Dumping MongoDB database: $DB_NAME..."
mongodump --db "$DB_NAME" --out "$BACKUP_DIR/dump_$TIMESTAMP"

# 2. Compress the dump
echo "🗜️ Compressing backup archive..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$BACKUP_DIR/dump_$TIMESTAMP" .

# 3. Upload to AWS S3 (Using EC2 IAM Instance Role - No credentials needed in code)
if command -v aws &> /dev/null; then
    echo "☁️ Uploading backup to AWS S3 bucket: s3://$S3_BUCKET/db-backups/..."
    aws s3 cp "$BACKUP_DIR/$BACKUP_NAME" "s3://$S3_BUCKET/db-backups/$BACKUP_NAME" || {
        echo "⚠️ S3 upload skipped (Check if S3 bucket exists and IAM role is attached)."
    }
else
    echo "ℹ️ AWS CLI not installed. Local backup saved at: $BACKUP_DIR/$BACKUP_NAME"
fi

# 4. Clean up temporary uncompressed files
rm -rf "$BACKUP_DIR/dump_$TIMESTAMP"

echo "=========================================================="
echo "✅ Database backup complete: $BACKUP_DIR/$BACKUP_NAME"
echo "=========================================================="
