# CI/CD Setup

Automated deployment using GitHub Actions with optimized timeouts and robust error handling.

## Prerequisites

- EKS cluster deployed (via Terraform)
- ECR repositories created (via Terraform)
- GitHub Actions IAM role configured with permissions:
  - ECR: Push/pull images
  - EKS: Update kubeconfig, apply manifests
  - S3: Read Terraform state
  - Secrets Manager: Read RDS credentials (for platform namespace)
- Terraform state stored in S3 (for RDS secret ARN retrieval)

## Setup

1. Configure GitHub Secrets:
   - `AWS_ROLE_ARN` - IAM role ARN for GitHub Actions
   - `ECR_BACKEND_REPO` - ECR repository name for backend
   - `ECR_FRONTEND_REPO` - ECR repository name for frontend

2. Verify Infrastructure:
   ```bash
   # Infrastructure must be deployed first
   cd cloudnative-saas-eks/examples/dev-environment/infrastructure
   terraform output rds_secret_arn  # Should return a secret ARN
   
   # Tenants must be deployed (creates analytics secrets)
   cd ../tenants
   terraform apply -var-file="../tenants.tfvars"
   ```

3. Push to main branch - deployment happens automatically

## Workflows

### CI Pipeline (`ci.yml`)
- **Triggers**: Push to `main` or `develop`, Pull requests
- **Jobs**: Backend test, Frontend test, Docker build
- **Duration**: ~5-8 minutes

### CD Pipeline (`cd.yml`)
- **Triggers**: CI workflow success, Manual dispatch, Tag push
- **Jobs**: Build backend/frontend (parallel), Cluster setup, Deploy (matrix: platform, analytics)
- **Duration**: ~10-15 minutes
- **Timeouts**:
  - Backend rollout: 10 minutes (accounts for DB connection + health checks)
  - Frontend rollout: 10 minutes
  - Deploy step: 20 minutes (overall timeout)

## Timeout Configuration

The pipeline uses optimized timeouts to handle:
- **Database Connection**: 15 seconds (configured in backend)
- **Health Check Wrapper**: 18 seconds (prevents hanging)
- **Readiness Probe**: 20 seconds (matches health check)
- **Rollout Status**: 10 minutes (accounts for all startup phases)

These timeouts ensure deployments complete successfully even with slow database connections or network latency.
