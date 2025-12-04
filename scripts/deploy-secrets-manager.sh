#!/bin/bash

# ⚠️ DEPRECATED SCRIPT
# This script is deprecated. Secrets Manager configuration is now managed via GitOps.
# See: https://github.com/SaaSInfraLab/Gitops-pipeline
#
# The aws-secrets-manager.yaml is located at:
# Gitops-pipeline/apps/sample-saas-app/overlays/platform/aws-secrets-manager.yaml
#
# To update the configuration:
# 1. Clone the Gitops-pipeline repository
# 2. Update the aws-secrets-manager.yaml file
# 3. Commit and push - Flux CD will automatically deploy

echo "⚠️  This script is deprecated."
echo "Secrets Manager is now managed via GitOps in Gitops-pipeline repository."
echo ""
echo "To deploy Secrets Manager configuration:"
echo "1. Update Gitops-pipeline/apps/sample-saas-app/overlays/platform/aws-secrets-manager.yaml"
echo "2. Commit and push to the GitOps repository"
echo "3. Flux CD will automatically deploy the changes"
echo ""
echo "For manual deployment, see the GitOps repository documentation."

# Exit on error
set -e

# Get the RDS secret ARN from Terraform output
cd ../../cloudnative-saas-eks/examples/dev-environment/infrastructure
RDS_SECRET_ARN=$(terraform output -raw rds_secret_arn)
cd -

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo ""
echo "Current configuration:"
echo "  AWS Account ID: ${AWS_ACCOUNT_ID}"
echo "  RDS Secret ARN: ${RDS_SECRET_ARN}"
echo ""
echo "To update the GitOps repository manually:"
echo "  cd Gitops-pipeline"
echo "  sed -i \"s|\\\${AWS_ACCOUNT_ID}|${AWS_ACCOUNT_ID}|\" apps/sample-saas-app/overlays/platform/aws-secrets-manager.yaml"
echo "  sed -i \"s|\\\${RDS_SECRET_ARN}|${RDS_SECRET_ARN}|\" apps/sample-saas-app/overlays/platform/aws-secrets-manager.yaml"
echo "  git commit -am \"Update Secrets Manager configuration\""
echo "  git push"
