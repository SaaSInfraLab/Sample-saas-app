# Database Schema & Migrations

Multi-tenant PostgreSQL database with schema-per-tenant isolation.

## 📊 Database Structure

### Public Schema
- **`tenants`** - Tenant metadata (id, tenant_id, name, namespace, timestamps)

### Tenant Schemas
Each tenant has an isolated schema with identical structure:

**`tenant_platform`** and **`tenant_analytics`** schemas:
- **`users`** - User accounts (id, email, password_hash, name, tenant_id, timestamps)
- **`tasks`** - Task management (id, title, description, status, assignee, due_date, created_by, timestamps)

## 🔄 Migrations

Migrations are located in `migrations/` and run automatically:

1. **001_create_tenants.sql** - Creates tenant schemas and metadata table
2. **002_create_users.sql** - Creates users table in each tenant schema
3. **003_create_tasks.sql** - Creates tasks table in each tenant schema

### When Migrations Run

- **Docker Compose**: Automatically on PostgreSQL first startup
- **Kubernetes**: Via `init-db-job.yaml` in [Gitops-pipeline](https://github.com/SaaSInfraLab/Gitops-pipeline) (deployed automatically by Flux CD)
- **Manual**: Use `scripts/init-rds-database.sh` or `.ps1`

## 🔍 Verification

### List All Tables
```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'tenant_platform', 'tenant_analytics')
ORDER BY table_schema, table_name;
```

### Check Tenant Data
```sql
-- Platform tenant
SELECT * FROM tenant_platform.users LIMIT 10;
SELECT * FROM tenant_platform.tasks LIMIT 10;

-- Analytics tenant
SELECT * FROM tenant_analytics.users LIMIT 10;
SELECT * FROM tenant_analytics.tasks LIMIT 10;
```

### Verify Tenant Schemas
```sql
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';
```

## 📝 Notes

- Migrations are **idempotent** (safe to run multiple times)
- Tenant schemas provide **complete data isolation**
- Always run migrations in order (001 → 002 → 003)

For connection details, see [db-verification/README.md](../db-verification/README.md).
