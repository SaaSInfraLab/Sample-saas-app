# Task Management SaaS - Multi-Tenant Application

Multi-tenant task management application for AWS EKS showcase.

## Quick Deploy

```bash
# Deploy to platform namespace
kubectl apply -k k8s/namespace-platform

# Deploy to analytics namespace
kubectl apply -k k8s/namespace-analytics
```

## Local Development

```bash
# Start database
docker-compose up -d postgres

# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## Access

```bash
# Get LoadBalancer URL
kubectl get service frontend-service -n platform

# Or port-forward
kubectl port-forward -n platform service/frontend-service 8080:80
```

## Features

- Multi-tenant isolation (schema-per-tenant)
- JWT authentication
- Task CRUD operations
- Health checks and metrics
- SSL/TLS database connections (required for RDS)
- Optimized timeouts for database connections and health checks

## Health Check Endpoints

- `GET /health` - General health status with database connectivity
- `GET /health/live` - Liveness probe (always returns 200)
- `GET /health/ready` - Readiness probe (checks database connection with 18s timeout wrapper)

## Configuration

### Database Connection
- **Connection Timeout**: 15 seconds
- **SSL**: Enabled (required for RDS)
- **Connection Pool**: Min 2, Max 10 connections

### Kubernetes Probes
- **Readiness Probe**:
  - Initial Delay: 20 seconds
  - Timeout: 20 seconds
  - Period: 10 seconds
  - Failure Threshold: 3
- **Liveness Probe**:
  - Initial Delay: 30 seconds
  - Timeout: 3 seconds
  - Period: 10 seconds
