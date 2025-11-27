#!/bin/bash

# Exit on error
set -e

# Get the RDS secret ARN from Terraform output
cd ../../cloudnative-saas-eks/examples/dev-environment/infrastructure
RDS_SECRET_ARN=$(terraform output -raw rds_secret_arn)
cd -

# Replace placeholders in the aws-secrets-manager.yaml file
sed -i "s|\${AWS_ACCOUNT_ID}|$(aws sts get-caller-identity --query Account --output text)|" k8s/namespace-platform/aws-secrets-manager.yaml
sed -i "s|\${RDS_SECRET_ARN}|${RDS_SECRET_ARN}|" k8s/namespace-platform/aws-secrets-manager.yaml

# Install the AWS Secrets Manager CSI Driver
kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml

# Deploy the Secrets Manager configuration
kubectl apply -f k8s/namespace-platform/aws-secrets-manager.yaml

# Restart the backend deployment to pick up the new configuration
kubectl rollout restart deployment/backend -n platform

echo "Secrets Manager configuration deployed successfully!"
