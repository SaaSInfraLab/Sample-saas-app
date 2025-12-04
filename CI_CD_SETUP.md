# CI/CD Pipeline Setup

Automated CI/CD pipeline with GitOps deployment to AWS EKS using GitHub Actions.

## 📋 Prerequisites

- EKS cluster and ECR repositories deployed via Terraform
- GitHub Actions IAM role with permissions for:
  - ECR (push/pull images)
- Flux CD installed and configured on EKS cluster
- GitOps repository ([Gitops-pipeline](https://github.com/SaaSInfraLab/Gitops-pipeline))

## ⚙️ Configuration

### GitHub Secrets

Configure these secrets in your GitHub repository:

#### Required Secrets

- `AWS_ROLE_ARN` - IAM role ARN for GitHub Actions (ECR access)
- `ECR_BACKEND_REPO` - ECR repository name for backend
- `ECR_FRONTEND_REPO` - ECR repository name for frontend
- `GITOPS_REPO_TOKEN` - Personal Access Token (PAT) with `repo` scope for Gitops-pipeline repository

#### Creating GITOPS_REPO_TOKEN

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Add as secret `GITOPS_REPO_TOKEN` in this repository

**Note:** The token needs write access to the `Gitops-pipeline` repository.

## 🔄 Workflows

### CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests

**Jobs:**
- Backend tests
- Frontend tests
- Code linting

**Duration:** ~5-8 minutes

### CD Pipeline (`cd.yml`)

**Triggers:**
- CI workflow success
- Manual dispatch
- Tag push (`v*`)

**Jobs:**
1. **Check CI Status** - Verify CI passed
2. **Build Backend** - Build and push backend Docker image to ECR
3. **Build Frontend** - Build and push frontend Docker image to ECR
4. **Update GitOps Manifest** - Update Gitops-pipeline repository with new image tags

**Duration:** ~5-10 minutes

## 🔄 GitOps Flow

```
Developer pushes code
    ↓
CI Pipeline (tests)
    ↓
CD Pipeline:
  1. Build Docker images
  2. Push to ECR
  3. Update Gitops-pipeline Git repo
    ↓
Flux CD detects Git change
    ↓
Automatic deployment to cluster
```

## 🚀 Deployment Process

### Automatic Deployment

1. **Push code** to `main` or `develop` branch
2. **CI runs** - Tests and validation
3. **CD runs** - Builds images and updates GitOps repo
4. **Flux deploys** - Automatically syncs and deploys to cluster

### Manual Deployment

1. Go to Actions tab
2. Select "CD - Build and Push Images" workflow
3. Click "Run workflow"
4. Select branch and run

### Tag-based Deployment

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0
```

This triggers the CD pipeline automatically.

## 📝 Image Tagging

Images are tagged with:
- **SHA tag**: `sha-<commit-sha>` (unique per commit)
- **Latest tag**: `latest` (only on main branch)
- **Branch tag**: `<branch-name>` (for feature branches)

The CD pipeline automatically extracts the tag and updates the GitOps repository.

## 🔍 Monitoring Deployment

### Check CI/CD Status

```bash
# View workflow runs
# GitHub Actions tab → Workflow runs
```

### Check Flux Sync Status

```bash
# After CD pipeline completes, check Flux
kubectl get kustomizations -n flux-system

# View sync events
flux get kustomizations sample-saas-app
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n platform
kubectl get pods -n analytics

# Check services
kubectl get svc -n platform
kubectl get svc -n analytics
```

## 🛠️ Troubleshooting

### CD Pipeline Fails to Update GitOps Repo

1. **Check GITOPS_REPO_TOKEN**:
   - Verify token has `repo` scope
   - Verify token has access to Gitops-pipeline repository
   - Check if token is expired

2. **Check GitOps Repo Access**:
   ```bash
   # Test token manually
   curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/repos/SaaSInfraLab/Gitops-pipeline
   ```

3. **Check Workflow Logs**:
   - View "Update GitOps Manifest" job logs
   - Look for Git authentication errors

### Images Not Deploying

1. **Check Flux Sync**:
   ```bash
   flux get kustomizations
   flux events --kind Kustomization
   ```

2. **Check Image Tags**:
   ```bash
   # Verify tags in GitOps repo
   git log --oneline apps/sample-saas-app/
   ```

3. **Check Cluster Resources**:
   ```bash
   kubectl get deployments -n platform
   kubectl describe deployment backend -n platform
   ```

## 📚 Related Documentation

- [Flux GitOps Pipeline](https://github.com/SaaSInfraLab/Gitops-pipeline)
- [GitOps Integration Guide](https://github.com/SaaSInfraLab/Gitops-pipeline/blob/main/docs/integration-guide.md)
- [Sample-saas-app README](README.md)

## 🔐 Security Notes

- **GITOPS_REPO_TOKEN**: Store as GitHub secret, never commit to repository
- **AWS_ROLE_ARN**: Use IAM roles with least privilege
- **Image Tags**: Use SHA-based tags for traceability
- **Git Commits**: All GitOps updates are auditable via Git history
