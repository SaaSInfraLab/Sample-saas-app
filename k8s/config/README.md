# Configuration Guide

## Hardcoded Values

The following values are hardcoded and should be updated for production:

### ECR Configuration (`kustomization.yaml`)
- Account ID: `821368347884`
- Region: `us-east-1`
- Environment: `dev`

### Secrets (`secret.yaml`)
- Database password: `changeme` ⚠️ **MUST CHANGE**
- JWT secret: `dev-jwt-secret-key-change-for-production-use-strong-random-key` ⚠️ **MUST CHANGE**

### Database (`configmap.yaml`)
- Database name: `taskdb`
- Database user: `taskuser`

## Updating Images

Edit the `images` section in `kustomization.yaml`:

```yaml
images:
  - name: task-management-backend
    newName: YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/your-repo
    newTag: v1.2.3
```

## Production Recommendations

1. **Secrets**: Use AWS Secrets Manager or External Secrets Operator
2. **Images**: Use environment-specific overlays or CI/CD variables
3. **Database**: Use managed RDS instead of in-cluster PostgreSQL
