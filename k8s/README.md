# ⚠️ Kubernetes Manifests - DEPRECATED

> **This directory is deprecated.** All Kubernetes manifests have been moved to the [Gitops-pipeline](https://github.com/SaaSInfraLab/Gitops-pipeline) repository for GitOps-based deployment.

## Migration to GitOps

As part of implementing a fully GitOps approach, all Kubernetes deployment manifests have been moved to the `Gitops-pipeline` repository:

- **Old Location**: `Sample-saas-app/k8s/`
- **New Location**: `Gitops-pipeline/apps/sample-saas-app/`

## New Structure

The manifests are now organized using Kustomize base and overlays:

```
Gitops-pipeline/apps/sample-saas-app/
├── base/                    # Common manifests
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── init-db-job.yaml
│   └── kustomization.yaml
└── overlays/
    ├── platform/            # Platform tenant
    │   ├── namespace.yaml
    │   ├── aws-secrets-manager.yaml
    │   ├── secret-sync-job.yaml
    │   └── kustomization.yaml
    └── analytics/           # Analytics tenant
        ├── namespace.yaml
        └── kustomization.yaml
```

## Deployment Workflow

### Before (Direct kubectl)
```bash
# Old way - direct kubectl deployment
kubectl apply -f k8s/namespace-platform/
kubectl apply -f k8s/namespace-analytics/
```

### Now (GitOps)
1. **CI Pipeline** (Sample-saas-app): Builds and pushes Docker images to ECR
2. **CD Pipeline** (Sample-saas-app): Updates image tags in `Gitops-pipeline` repository
3. **Flux CD**: Automatically detects Git changes and deploys to cluster

No manual `kubectl` commands needed! 🎉

## For Developers

As a developer, you don't need to worry about Kubernetes manifests:

- ✅ **Just write code** - Push to `main` or `develop` branch
- ✅ **CI runs automatically** - Tests, builds, and pushes images
- ✅ **CD updates GitOps** - Image tags are updated automatically
- ✅ **Flux deploys** - Changes are deployed to cluster automatically

## For DevOps/Platform Engineers

All Kubernetes configuration is now managed in:
- **Repository**: [Gitops-pipeline](https://github.com/SaaSInfraLab/Gitops-pipeline)
- **Structure**: Kustomize base + overlays for multi-tenant support
- **Deployment**: Automatic via Flux CD

## Migration Date

This migration was completed as part of the GitOps implementation. The files in this directory are kept for reference but are no longer used for deployments.

## Questions?

- See [Gitops-pipeline README](https://github.com/SaaSInfraLab/Gitops-pipeline/blob/main/README.md)
- Check [GitOps Integration Summary](https://github.com/SaaSInfraLab/Gitops-pipeline/blob/main/docs/gitops-integration-summary.md)

