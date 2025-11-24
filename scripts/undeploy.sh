#!/bin/bash
# Undeployment script for Task Management SaaS
# Removes all resources from a namespace

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 <namespace> [--delete-pvc]"
    echo "Example: $0 platform"
    echo "Example: $0 platform --delete-pvc"
    echo "Namespaces: platform, analytics, data"
    exit 1
fi

NAMESPACE="$1"
DELETE_PVC="${2:-}"

if [[ ! "$NAMESPACE" =~ ^(platform|analytics|data)$ ]]; then
    echo "Error: Invalid namespace. Must be one of: platform, analytics, data"
    exit 1
fi

echo "Undeploying from namespace: $NAMESPACE"

# Delete all resources
echo "Deleting Kubernetes resources..."
kubectl delete -k "k8s/namespace-$NAMESPACE" --ignore-not-found=true

# Optionally delete PVCs
if [ "$DELETE_PVC" == "--delete-pvc" ]; then
    echo "Deleting PersistentVolumeClaims..."
    kubectl delete pvc -n "$NAMESPACE" -l app=postgresql --ignore-not-found=true
fi

echo "Undeployment complete for namespace: $NAMESPACE"

