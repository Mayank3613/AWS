#!/usr/bin/env bash
# ==============================================================================
# Amazon AWS RDS Automated Database Backup Script (PostgreSQL / MySQL)
# Exports schema & data and uploads to AWS S3 bucket
# ==============================================================================

set -e

BACKUP_DIR="/tmp/rds_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-customer_report_system}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_DIALECT="${DB_DIALECT:-postgres}"
S3_BUCKET="${S3_BUCKET:-customer-report-system-backups}"

mkdir -p "$BACKUP_DIR"

echo "=========================================================="
echo "🗄️ Starting Amazon RDS Database Backup..."
echo "Host: $DB_HOST | Database: $DB_NAME"
echo "=========================================================="

if [ "$DB_DIALECT" == "mysql" ]; then
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_rds_backup_${TIMESTAMP}.sql.gz"
    echo "📦 Exporting MySQL database from Amazon RDS..."
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" | gzip > "$BACKUP_FILE"
else
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_rds_backup_${TIMESTAMP}.dump"
    echo "📦 Exporting PostgreSQL database from Amazon RDS..."
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v -f "$BACKUP_FILE" "$DB_NAME"
fi

echo "✅ Backup created at: $BACKUP_FILE"

# Upload to S3 if AWS CLI is configured
if command -v aws &> /dev/null; then
    echo "☁️ Uploading backup to AWS S3: s3://$S3_BUCKET/rds-backups/..."
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/rds-backups/$(basename $BACKUP_FILE)" || {
        echo "ℹ️ S3 upload skipped (Ensure S3 bucket exists and IAM role is attached)."
    }
fi

echo "=========================================================="
echo "🎉 Amazon RDS Database Backup Complete!"
echo "=========================================================="
