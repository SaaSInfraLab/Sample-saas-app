#!/bin/bash
# =============================================================================
# Setup AWS Secrets Manager IAM Role
# =============================================================================
# This script creates IAM role and policy for Secrets Manager CSI Driver access.
#
# NOTE: For production deployments, IAM setup is typically managed via Terraform
# in the cloudnative-saas-eks repository. This script is for manual setup or
# development environments.
# =============================================================================

# Exit on error
set -e

# Get the AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create IAM policy for Secrets Manager access
cat > secrets-manager-policy.json << EOL
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:*:${AWS_ACCOUNT_ID}:secret:*"
        },
        {
            "Effect": "Allow",
            "Action": "secretsmanager:ListSecrets",
            "Resource": "*"
        }
    ]
}
EOL

# Create the IAM policy
aws iam create-policy \
    --policy-name EKSSecretsManagerAccess \
    --policy-document file://secrets-manager-policy.json

# Create IAM role for the service account
EKS_CLUSTER_NAME="your-eks-cluster-name"  # Replace with your EKS cluster name
OIDC_PROVIDER=$(aws eks describe-cluster --name $EKS_CLUSTER_NAME --query "cluster.identity.oidc.issuer" --output text | sed -e "s/^https:\/\///")

cat > trust-policy.json << EOL
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/${OIDC_PROVIDER}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "${OIDC_PROVIDER}:sub": "system:serviceaccount:platform:backend-sa",
          "${OIDC_PROVIDER}:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
EOL

# Create the IAM role
aws iam create-role \
    --role-name EKSSecretsManagerRole \
    --assume-role-policy-document file://trust-policy.json

# Attach the policy to the role
aws iam attach-role-policy \
    --role-name EKSSecretsManagerRole \
    --policy-arn arn:aws:iam::${AWS_ACCOUNT_ID}:policy/EKSSecretsManagerAccess

echo "IAM setup complete. Please update the service account annotation with the following ARN:"
aws iam get-role --role-name EKSSecretsManagerRole --query 'Role.Arn' --output text
