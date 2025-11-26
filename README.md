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
