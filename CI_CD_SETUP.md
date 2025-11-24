# CI/CD Setup Guide

This guide explains how to set up the complete CI/CD pipeline for deploying the Task Management SaaS application to EKS.

## Architecture

```
GitHub Push → GitHub Actions → Build Images → Push to ECR → Deploy to EKS
```

## Prerequisites

1. **Terraform Infrastructure Deployed**
   - EKS cluster must be running
   - ECR repositories must be created (via Terraform)
   - See `cloudnative-saas-eks` repository for infrastructure setup

2. **GitHub Repository**
   - Repository must be on GitHub
   - GitHub Actions must be enabled

3. **AWS IAM Role for GitHub Actions**
   - Role with permissions to push to ECR and deploy to EKS
   - Configured with OIDC trust relationship (recommended) or access keys

## Step 1: Deploy Infrastructure with ECR

The ECR repositories are automatically created when you deploy the infrastructure:

```bash
cd cloudnative-saas-eks/examples/dev-environment/infrastructure
terraform init -backend-config=backend-dev.tfbackend
terraform apply -var-file=../infrastructure.tfvars
```

This creates:
- `{cluster-name}-backend` ECR repository
- `{cluster-name}-frontend` ECR repository

## Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

### Required Secrets

1. **AWS_ROLE_ARN**
   - ARN of the IAM role for GitHub Actions
   - Example: `arn:aws:iam::123456789012:role/github-actions-role`

2. **ECR_BACKEND_REPO**
   - Name of the backend ECR repository
   - Get from Terraform: `terraform output ecr_backend_repository_name`
   - Example: `saas-infra-lab-dev-backend`

3. **ECR_FRONTEND_REPO**
   - Name of the frontend ECR repository
   - Get from Terraform: `terraform output ecr_frontend_repository_name`
   - Example: `saas-infra-lab-dev-frontend`

## Step 3: Create IAM Role for GitHub Actions

### Option A: Using OIDC (Recommended)

1. **Create OIDC Provider in AWS**:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

2. **Create IAM Role with Trust Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
```

3. **Attach Policies**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    }
  ]
}
```

### Option B: Using Access Keys (Not Recommended)

1. Create IAM user with programmatic access
2. Attach policies for ECR and EKS
3. Store access key ID and secret in GitHub Secrets

## Step 4: Test the Pipeline

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```

2. **Check GitHub Actions**:
   - Go to Actions tab in GitHub
   - Watch the workflow run
   - Check for any errors

3. **Verify Deployment**:
   ```bash
   kubectl get pods -n platform
   kubectl get pods -n analytics
   kubectl get pods -n data
   ```

## Step 5: Access the Application

After successful deployment:

```bash
# Port forward to access frontend
kubectl port-forward -n platform service/frontend-service 8080:80

# Open browser: http://localhost:8080
```

## Troubleshooting

### Workflow Fails at "Get ECR registry"
- Ensure Terraform infrastructure is deployed
- Check that ECR repositories exist
- Verify Terraform state is accessible

### Workflow Fails at "Login to Amazon ECR"
- Check AWS credentials/role permissions
- Verify IAM role has ECR permissions
- Check region matches (us-east-1)

### Workflow Fails at "Deploy to EKS"
- Verify kubectl can access cluster
- Check cluster name matches Terraform output
- Ensure namespaces exist (platform, analytics, data)

### Images Not Updating
- Check image tags in deployment manifests
- Verify ECR push succeeded
- Check pod image pull errors: `kubectl describe pod -n <namespace>`

## Manual Deployment

If you need to deploy manually:

```bash
# Get ECR repository URLs
cd cloudnative-saas-eks/examples/dev-environment/infrastructure
terraform output ecr_backend_repository_url
terraform output ecr_frontend_repository_url

# Update manifests with image URLs
# Then apply
kubectl apply -k k8s/namespace-platform
```

## Next Steps

- Set up monitoring and alerting
- Configure backup workflows
- Add staging environment
- Set up blue-green deployments

