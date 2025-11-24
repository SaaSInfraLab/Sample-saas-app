#!/bin/bash
# Database backup script
# Creates timestamped backups of all tenant schemas

set -e

DB_NAME="${DB_NAME:-taskdb}"
DB_USER="${DB_USER:-taskuser}"
DB_PASSWORD="${DB_PASSWORD:-changeme}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Backup all tenant schemas
for schema in tenant_platform tenant_analytics tenant_data; do
    echo "Backing up schema: $schema"
    PGPASSWORD=$DB_PASSWORD pg_dump \
        -h "$DB_HOST" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema="$schema" \
        --format=custom \
        --file="$BACKUP_DIR/${schema}_${TIMESTAMP}.dump"
    
    echo "Backup created: $BACKUP_DIR/${schema}_${TIMESTAMP}.dump"
done

# Backup public schema (tenants metadata)
echo "Backing up public schema"
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --schema=public \
    --format=custom \
    --file="$BACKUP_DIR/public_${TIMESTAMP}.dump"

# Compress backups
echo "Compressing backups..."
tar -czf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" -C "$BACKUP_DIR" \
    tenant_platform_${TIMESTAMP}.dump \
    tenant_analytics_${TIMESTAMP}.dump \
    tenant_data_${TIMESTAMP}.dump \
    public_${TIMESTAMP}.dump

# Remove individual dump files after compression
rm -f "$BACKUP_DIR"/*_${TIMESTAMP}.dump

echo "Backup complete: $BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"

# Optional: Upload to S3 (uncomment and configure if needed)
# aws s3 cp "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" s3://your-backup-bucket/database-backups/

# Optional: Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup process completed at $(date)"

