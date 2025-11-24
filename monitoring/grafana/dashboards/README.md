# Grafana Dashboards

This directory contains Grafana dashboard JSON files for monitoring the Task Management SaaS application.

## Recommended Dashboards

1. **Application Overview**
   - HTTP request metrics
   - Error rates
   - Response times
   - Database connection pool

2. **Tenant Resource Usage**
   - CPU usage per tenant
   - Memory usage per tenant
   - Storage usage per tenant
   - Pod count per tenant

3. **Database Performance**
   - Connection pool metrics
   - Query performance
   - Database size
   - Backup status

## Importing Dashboards

1. Open Grafana
2. Go to Dashboards → Import
3. Upload JSON file
4. Select Prometheus data source
5. Configure variables (namespace, tenant)

## Sample Queries

See [MONITORING.md](../docs/MONITORING.md) for sample Prometheus queries.

