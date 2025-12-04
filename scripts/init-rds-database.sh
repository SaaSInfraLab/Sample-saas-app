#!/bin/bash
# =============================================================================
# Initialize RDS PostgreSQL Database
# =============================================================================
# This script initializes the RDS database with schemas and tables.
#
# NOTE: In production, database initialization is handled automatically via:
# - Kubernetes Job: Gitops-pipeline/apps/sample-saas-app/base/init-db-job.yaml
# - Deployed automatically by Flux CD
#
# This script is useful for:
# - Initial setup before GitOps deployment
# - Manual database initialization
# - Development environments
# =============================================================================

set -e

# Default values
RDS_ENDPOINT="${RDS_ENDPOINT:-}"
DB_NAME="${DB_NAME:-taskdb}"
DB_USER="${DB_USER:-taskuser}"
DB_PASSWORD="${DB_PASSWORD:-changeme}"
TERRAFORM_DIR="${TERRAFORM_DIR:-../../cloudnative-saas-eks/examples/dev-environment/infrastructure}"

# Get RDS endpoint from Terraform if not provided
if [ -z "$RDS_ENDPOINT" ]; then
    echo "Getting RDS endpoint from Terraform..."
    cd "$TERRAFORM_DIR"
    RDS_ENDPOINT=$(terraform output -raw rds_address)
    cd - > /dev/null
    
    if [ -z "$RDS_ENDPOINT" ]; then
        echo "Error: Could not get RDS endpoint from Terraform"
        echo "Please set RDS_ENDPOINT environment variable or provide it manually"
        exit 1
    fi
fi

echo ""
echo "=== RDS Database Initialization ==="
echo "RDS Endpoint: $RDS_ENDPOINT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql (PostgreSQL client) not found in PATH"
    echo "Please install PostgreSQL client tools"
    echo ""
    echo "Alternative: Use Docker to run psql:"
    echo "docker run -it --rm -e PGPASSWORD=$DB_PASSWORD postgres:15-alpine psql -h $RDS_ENDPOINT -U $DB_USER -d $DB_NAME"
    exit 1
fi

# Set password as environment variable for psql
export PGPASSWORD="$DB_PASSWORD"

# Migration files
MIGRATIONS=(
    "001_create_tenants.sql"
    "002_create_users.sql"
    "003_create_tasks.sql"
)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../database/migrations"

echo "Running migrations..."

for migration in "${MIGRATIONS[@]}"; do
    migration_file="$MIGRATIONS_DIR/$migration"
    if [ -f "$migration_file" ]; then
        echo "  Executing: $migration"
        if psql -h "$RDS_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
            echo "  ✓ $migration completed"
        else
            echo "  ✗ Error executing $migration"
            psql -h "$RDS_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"
        fi
    else
        echo "  Warning: $migration not found"
    fi
done

# Optional: Seed data
SEED_FILE="$SCRIPT_DIR/../database/seeds/seed_platform.sql"
if [ -f "$SEED_FILE" ]; then
    echo ""
    echo "Seeding initial data..."
    if psql -h "$RDS_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f "$SEED_FILE" > /dev/null 2>&1; then
        echo "  ✓ Seed data inserted"
    else
        echo "  Warning: Seed data may have conflicts (this is normal if re-running)"
    fi
fi

# Verify connection
echo ""
echo "Verifying database connection..."
if psql -h "$RDS_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM tenants;" > /dev/null 2>&1; then
    echo "  ✓ Database connection successful"
    echo "  ✓ Tenants table exists"
else
    echo "  ✗ Database verification failed"
    exit 1
fi

# Clean up
unset PGPASSWORD

echo ""
echo "=== Initialization Complete ==="
echo "You can now deploy the applications. Backend pods should connect successfully."

