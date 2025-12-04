# Utility Scripts

Scripts for database initialization and AWS Secrets Manager setup.

## 📋 Available Scripts

### Database Initialization

**`init-rds-database.sh`** (Bash) / **`init-rds-database.ps1`** (PowerShell)

Initializes RDS PostgreSQL database with schemas and tables.

**Usage:**
```bash
# Bash (Linux/Mac/Git Bash)
./scripts/init-rds-database.sh

# PowerShell (Windows)
.\scripts\init-rds-database.ps1
```

**What it does:**
- Gets RDS endpoint from Terraform state
- Runs all database migrations
- Creates tenant schemas and tables
- Verifies database setup

**Requirements:**
- Terraform state file accessible
- PostgreSQL client (`psql`) or Docker
- AWS CLI configured

### AWS Secrets Manager Setup

**`setup-secrets-manager-iam.sh`**

Creates IAM role and policy for Secrets Manager CSI Driver access.

**Usage:**
```bash
./scripts/setup-secrets-manager-iam.sh
```

**What it does:**
- Creates IAM role for Secrets Manager access
- Attaches required policies
- Configures trust relationship

**`deploy-secrets-manager.sh`** ⚠️ **DEPRECATED**

> **Note:** This script is deprecated. Secrets Manager configuration is now managed via GitOps in the [Gitops-pipeline](https://github.com/SaaSInfraLab/Gitops-pipeline) repository.

The AWS Secrets Manager CSI Driver and configuration are now deployed automatically by Flux CD. See the script file for migration instructions.

## 🔄 Complete Setup Workflow

### For Local Development
```bash
# Initialize database (if needed)
./scripts/init-rds-database.sh
```

### For Production Deployment
Deployment is handled automatically via GitOps:
1. Infrastructure setup: [cloudnative-saas-eks](https://github.com/SaaSInfraLab/cloudnative-saas-eks)
2. GitOps configuration: [Gitops-pipeline](https://github.com/SaaSInfraLab/Gitops-pipeline)
3. Application deployment: Automatic via CI/CD (this repository)

**Note:** Secrets Manager and IAM setup are now managed via Terraform and GitOps. Manual scripts are only for local development.

## ⚙️ Requirements

### For Database Scripts
- AWS CLI configured with credentials
- Terraform outputs available (for database script)
- PostgreSQL client or Docker (for database script)

### For Deployment
- No local requirements! Deployment is fully automated via:
  - GitHub Actions (CI/CD)
  - Flux CD (GitOps)
  - Terraform (Infrastructure)

## 📝 Notes

- Scripts are idempotent (safe to run multiple times)
- Database script requires Terraform state to be accessible
- Secrets Manager scripts require cluster admin permissions
