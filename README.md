# Task Management SaaS Application

A Task Management SaaS application demonstrating multi-tenant isolation on AWS EKS (dev environment). This application showcases complete tenant isolation, resource quotas, network policies, and cost tracking.

## Architecture

```
Task Management SaaS
├── Frontend (React + Vite)
│   └── Deployed via Nginx
├── Backend API (Node.js + Express)
│   └── REST API with JWT authentication
└── Database (PostgreSQL)
    └── Schema-per-tenant isolation
```

## Features

- **Multi-Tenant Isolation**: Complete data and network isolation per tenant
- **User Authentication**: JWT-based authentication with tenant context
- **Task Management**: Full CRUD operations for tasks
- **Resource Monitoring**: Real-time resource usage tracking per tenant
- **Metrics & Health Checks**: Prometheus metrics and health endpoints
- **Automated Backups**: Scheduled database backups
- **CI/CD Pipeline**: GitHub Actions for automated deployment

## Prerequisites

- Kubernetes cluster (EKS) with tenant namespaces created
- kubectl configured
- Docker for building images
- Node.js 18+ for local development

## Quick Start

### Automated Deployment (Recommended)

The application uses CI/CD for automated deployment. See [CI_CD_SETUP.md](CI_CD_SETUP.md) for setup instructions.

**Quick Steps:**
1. Configure GitHub Secrets (AWS_ROLE_ARN, ECR repository names)
2. Push code to `main` branch
3. GitHub Actions automatically builds, pushes to ECR, and deploys to EKS

### Manual Deployment (Alternative)

If you need to deploy manually:

```bash
# Update image URLs in k8s manifests first, then:
kubectl apply -k k8s/namespace-platform
kubectl apply -k k8s/namespace-analytics
kubectl apply -k k8s/namespace-data
```

### Access Application

Get the LoadBalancer URL:
```bash
kubectl get service frontend-service -n platform
```

Or use port-forward:
```bash
kubectl port-forward -n platform service/frontend-service 8080:80
```

Then open: http://localhost:8080

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database

Use docker-compose for local PostgreSQL:
```bash
docker-compose up -d postgres
```

## Multi-Tenant Demo

1. **Deploy to Multiple Namespaces**: Deploy the app to platform, analytics, and data namespaces
2. **Create Users**: Register users in different tenants
3. **Verify Isolation**: 
   - Users in platform tenant cannot see tasks from analytics tenant
   - Network policies prevent cross-namespace communication
   - Resource quotas are enforced per namespace

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - List all tasks (tenant-scoped)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/statistics` - Get task statistics

### Tenant
- `GET /api/tenant/info` - Get tenant information
- `GET /api/tenant/usage` - Get resource usage

### Health & Metrics
- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check
- `GET /metrics` - Prometheus metrics

## Database Schema

The application uses schema-per-tenant isolation:
- `tenant_platform` - Platform tenant data
- `tenant_analytics` - Analytics tenant data
- `tenant_data` - Data tenant data

Each schema contains:
- `users` table - User accounts
- `tasks` table - Task data

## Monitoring

### Prometheus Metrics

The backend exposes Prometheus metrics at `/metrics`:
- HTTP request duration
- HTTP request count
- Database connection pool metrics
- Custom application metrics

### Health Checks

- `/health` - Overall health status
- `/health/ready` - Readiness probe (checks database)
- `/health/live` - Liveness probe

## Backup & Recovery

### Automated Backups

Backups run daily via GitHub Actions workflow (`.github/workflows/backup.yml`).

### Manual Backup

```bash
./scripts/backup-db.sh platform
```

### Restore

```bash
./scripts/restore-db.sh platform /path/to/backup.tar.gz
```

## CI/CD

### Automated Pipeline

The CI/CD pipeline automatically handles:
- **Build**: Docker images for backend and frontend
- **Push**: Images to ECR (created by Terraform)
- **Deploy**: Updates and deploys to all EKS namespaces

**Setup**: See [CI_CD_SETUP.md](CI_CD_SETUP.md) for complete setup instructions.

**Workflows:**
- `.github/workflows/ci.yml` - Runs tests and builds on every push/PR
- `.github/workflows/cd.yml` - Builds, pushes to ECR, and deploys to EKS on main branch
- `.github/workflows/backup.yml` - Daily database backups

## Configuration

### Environment Variables

**Backend** (see `backend/.env.example`):
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `METRICS_ENABLED` - Enable Prometheus metrics

**Frontend** (see `frontend/vite.config.js`):
- `VITE_API_URL` - Backend API URL

## Troubleshooting

### Pods Not Starting

```bash
# Check pod logs
kubectl logs -n platform deployment/backend
kubectl logs -n platform deployment/frontend

# Check pod status
kubectl describe pod -n platform <pod-name>
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl logs -n platform statefulset/postgresql

# Test database connection
kubectl exec -n platform -it postgresql-0 -- psql -U taskuser -d taskdb
```

### Network Policy Issues

```bash
# Check network policies
kubectl get networkpolicies -n platform

# Test connectivity
kubectl exec -n platform deployment/backend -- wget -O- http://backend-service:3000/health
```

## Documentation

- [Quick Start Guide](QUICK_START.md) - Run the application locally
- [CI/CD Setup Guide](CI_CD_SETUP.md) - Set up automated deployment

## License

MIT

