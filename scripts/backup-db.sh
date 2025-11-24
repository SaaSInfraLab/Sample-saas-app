#!/bin/bash
# Database backup script wrapper
# This script can be run as a Kubernetes CronJob

set -e

NAMESPACE="${1:-platform}"
POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=postgresql -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo "Error: PostgreSQL pod not found in namespace $NAMESPACE"
    exit 1
fi

echo "Backing up database in namespace: $NAMESPACE"
kubectl exec -n "$NAMESPACE" "$POD_NAME" -- /backup-script.sh

echo "Backup completed for namespace: $NAMESPACE"

