#!/usr/bin/env bash
# ==============================================================================
# Amazon AWS RDS Database Restore Script (PostgreSQL / MySQL)
# ==============================================================================

set -e

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-customer_report_system}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_DIALECT="${DB_DIALECT:-postgres}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-rds.sh <path_to_backup_file>"
    echo "Example (Postgres): ./restore-rds.sh /tmp/rds_backups/customer_report_system_rds_backup_20260831.dump"
    echo "Example (MySQL):    ./restore-rds.sh /tmp/rds_backups/customer_report_system_rds_backup_20260831.sql.gz"
    exit 1
fi

echo "=========================================================="
echo "🗄️ Restoring Database to Amazon RDS..."
echo "Host: $DB_HOST | Database: $DB_NAME"
echo "=========================================================="

if [ "$DB_DIALECT" == "mysql" ]; then
    echo "🔄 Restoring MySQL database to Amazon RDS..."
    gunzip < "$BACKUP_FILE" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
else
    echo "🔄 Restoring PostgreSQL database to Amazon RDS..."
    PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c -v "$BACKUP_FILE"
fi

echo "=========================================================="
echo "✅ Amazon RDS Database Restore Complete!"
echo "=========================================================="
