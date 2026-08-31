#!/usr/bin/env bash
# ==============================================================================
# AWS S3 MongoDB Database Restore Script
# Restores database from a local archive or AWS S3 backup
# ==============================================================================

set -e

BACKUP_FILE="$1"
DB_NAME="customer_report_system"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-db.sh <path_to_backup.tar.gz>"
    echo "Example: ./restore-db.sh /tmp/mongodb_backups/customer_report_system_backup_20260831.tar.gz"
    exit 1
fi

echo "=========================================================="
echo "🍃 Restoring MongoDB Database: $DB_NAME"
echo "=========================================================="

RESTORE_TMP="/tmp/mongo_restore_tmp"
rm -rf "$RESTORE_TMP"
mkdir -p "$RESTORE_TMP"

# Extract archive
echo "📦 Extracting $BACKUP_FILE..."
tar -xzf "$BACKUP_FILE" -C "$RESTORE_TMP"

# Restore database
echo "🔄 Restoring to MongoDB..."
mongorestore --db "$DB_NAME" --drop "$RESTORE_TMP/$DB_NAME"

# Clean up
rm -rf "$RESTORE_TMP"

echo "=========================================================="
echo "✅ MongoDB Database $DB_NAME Restored Successfully!"
echo "=========================================================="
