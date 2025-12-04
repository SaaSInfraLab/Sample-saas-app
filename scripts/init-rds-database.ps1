# =============================================================================
# Initialize RDS PostgreSQL Database (PowerShell)
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

param(
    [string]$RdsEndpoint = "",
    [string]$DbName = "taskdb",
    [string]$DbUser = "taskuser",
    [string]$DbPassword = "changeme"
)

# Get RDS endpoint from Terraform if not provided
if ([string]::IsNullOrEmpty($RdsEndpoint)) {
    Write-Host "Getting RDS endpoint from Terraform..." -ForegroundColor Cyan
    $terraformDir = Resolve-Path "..\..\cloudnative-saas-eks\examples\dev-environment\infrastructure"
    Push-Location $terraformDir
    $RdsEndpoint = terraform output -raw rds_address
    Pop-Location
    
    if ([string]::IsNullOrEmpty($RdsEndpoint)) {
        Write-Host "Error: Could not get RDS endpoint from Terraform" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== RDS Database Initialization ===" -ForegroundColor Green
Write-Host "RDS Endpoint: $RdsEndpoint" -ForegroundColor Cyan
Write-Host "Database: $DbName" -ForegroundColor Cyan
Write-Host "User: $DbUser" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available, otherwise use Docker
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
$useDocker = $false

if (-not $psqlPath) {
    Write-Host "psql not found, using Docker..." -ForegroundColor Yellow
    $useDocker = $true
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationsDir = Join-Path $scriptDir "..\database\migrations"

# Set password
$env:PGPASSWORD = $DbPassword

Write-Host "Running migrations..." -ForegroundColor Cyan

# Run migrations
$migration1 = Join-Path $migrationsDir "001_create_tenants.sql"
$migration2 = Join-Path $migrationsDir "002_create_users.sql"
$migration3 = Join-Path $migrationsDir "003_create_tasks.sql"

if ($useDocker) {
    Write-Host "  Executing migrations via Docker..." -ForegroundColor Yellow
    docker run --rm -e PGPASSWORD=$DbPassword -v "${migrationsDir}:/migrations" postgres:15-alpine psql -h $RdsEndpoint -U $DbUser -d $DbName -f /migrations/001_create_tenants.sql
    docker run --rm -e PGPASSWORD=$DbPassword -v "${migrationsDir}:/migrations" postgres:15-alpine psql -h $RdsEndpoint -U $DbUser -d $DbName -f /migrations/002_create_users.sql
    docker run --rm -e PGPASSWORD=$DbPassword -v "${migrationsDir}:/migrations" postgres:15-alpine psql -h $RdsEndpoint -U $DbUser -d $DbName -f /migrations/003_create_tasks.sql
    Write-Host "  ✓ Migrations completed" -ForegroundColor Green
} else {
    if (Test-Path $migration1) {
        Write-Host "  Executing: 001_create_tenants.sql" -ForegroundColor Yellow
        psql -h $RdsEndpoint -U $DbUser -d $DbName -f $migration1
        Write-Host "  ✓ Completed" -ForegroundColor Green
    }
    if (Test-Path $migration2) {
        Write-Host "  Executing: 002_create_users.sql" -ForegroundColor Yellow
        psql -h $RdsEndpoint -U $DbUser -d $DbName -f $migration2
        Write-Host "  ✓ Completed" -ForegroundColor Green
    }
    if (Test-Path $migration3) {
        Write-Host "  Executing: 003_create_tasks.sql" -ForegroundColor Yellow
        psql -h $RdsEndpoint -U $DbUser -d $DbName -f $migration3
        Write-Host "  ✓ Completed" -ForegroundColor Green
    }
}

# Verify
Write-Host "`nVerifying database..." -ForegroundColor Cyan
if ($useDocker) {
    docker run --rm -e PGPASSWORD=$DbPassword postgres:15-alpine psql -h $RdsEndpoint -U $DbUser -d $DbName -c "SELECT COUNT(*) FROM tenants;"
} else {
    psql -h $RdsEndpoint -U $DbUser -d $DbName -c "SELECT COUNT(*) FROM tenants;"
}

Write-Host "`n=== Initialization Complete ===" -ForegroundColor Green
Remove-Item Env:\PGPASSWORD
