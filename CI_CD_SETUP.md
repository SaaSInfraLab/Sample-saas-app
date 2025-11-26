# CI/CD Setup

Automated deployment using GitHub Actions.

## Prerequisites

- EKS cluster deployed
- ECR repositories created
- GitHub Actions IAM role configured

## Setup

1. Configure GitHub Secrets:
   - `AWS_ROLE_ARN` - IAM role for GitHub Actions
   - `AWS_REGION` - AWS region (us-east-1)

2. Push to main branch - deployment happens automatically

## Workflows

- `ci.yml` - Build and test on PR/push
- `cd.yml` - Deploy to EKS on main branch
