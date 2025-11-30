const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { ensureTenantIsolation } = require('../middleware/tenant-isolation');
const { getTenantConfig } = require('../config/tenants');
const { pool, getTenantSchema } = require('../config/database');

/**
 * Get tenant information and resource usage
 */
router.get('/info', authenticateToken, ensureTenantIsolation, (req, res) => {
  try {
    const tenantConfig = getTenantConfig(req.tenantId);
    
    res.json({
      tenant: {
        id: tenantConfig.tenantId,
        name: tenantConfig.name,
        namespace: tenantConfig.namespace,
        resourceLimits: tenantConfig.resourceLimits,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant info:', error);
    res.status(500).json({ error: 'Failed to fetch tenant information' });
  }
});

/**
 * Get tenant resource usage
 * Note: Currently returns placeholder data for CPU/memory/pods
 * Future: Integrate with Kubernetes metrics API or Prometheus for actual usage
 */
router.get('/usage', authenticateToken, ensureTenantIsolation, async (req, res) => {
  try {
    // Note: Currently returns placeholder data for CPU/memory/pods
    // Future: Integrate with Kubernetes metrics API or Prometheus for actual usage
    const tenantConfig = getTenantConfig(req.tenantId);
    
    // Get tenant-specific schema size
    // Note: pg_tables is a system catalog, so we query it directly with the schema name
    const schema = getTenantSchema(req.tenantId);
    const schemaSizeQuery = `
      SELECT pg_size_pretty(COALESCE(
        (SELECT sum(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename)))
         FROM pg_catalog.pg_tables 
         WHERE schemaname = $1), 0
      )) as size
    `;
    // Query system catalog directly (not tenant-isolated, but safe as it's read-only metadata)
    const dbResult = await pool.query(schemaSizeQuery, [schema]);
    
    res.json({
      tenant: req.tenantId,
      usage: {
        cpu: {
          used: '2.5',
          limit: tenantConfig.resourceLimits.cpu,
          unit: 'cores',
        },
        memory: {
          used: '8.5',
          limit: tenantConfig.resourceLimits.memory,
          unit: 'Gi',
        },
        storage: {
          used: dbResult.rows[0]?.size || '0',
          limit: tenantConfig.resourceLimits.storage,
        },
        pods: {
          used: 5,
          limit: tenantConfig.resourceLimits.pods,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching tenant usage:', error);
    res.status(500).json({ error: 'Failed to fetch resource usage' });
  }
});

module.exports = router;

