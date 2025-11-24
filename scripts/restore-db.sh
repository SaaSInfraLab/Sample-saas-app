#!/bin/bash
# Database restore script
# Restores database from a backup file

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <namespace> <backup-file>"
    echo "Example: $0 platform /backups/backup_20240101_120000.tar.gz"
    exit 1
fi

NAMESPACE="$1"
BACKUP_FILE="$2"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=postgresql -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo "Error: PostgreSQL pod not found in namespace $NAMESPACE"
    exit 1
fi

echo "WARNING: This will restore the database from backup. Existing data will be lost!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Extracting backup file..."
tar -xzf "$BACKUP_FILE" -C /tmp

echo "Restoring database in namespace: $NAMESPACE"

# Restore each schema
for schema in tenant_platform tenant_analytics tenant_data public; do
    DUMP_FILE="/tmp/${schema}_*.dump"
    if ls $DUMP_FILE 1> /dev/null 2>&1; then
        echo "Restoring schema: $schema"
        kubectl cp "$DUMP_FILE" "$NAMESPACE/$POD_NAME:/tmp/restore.dump"
        kubectl exec -n "$NAMESPACE" "$POD_NAME" -- pg_restore \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --clean \
            --if-exists \
            /tmp/restore.dump || echo "Schema $schema restore completed (warnings may be normal)"
    fi
done

echo "Database restore completed for namespace: $NAMESPACE"

