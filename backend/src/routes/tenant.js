const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { ensureTenantIsolation } = require('../middleware/tenant-isolation');
const { getTenantConfig } = require('../config/tenants');
const { pool } = require('../config/database');

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
 * This would typically query Kubernetes metrics API or Prometheus
 * For now, we return placeholder data
 */
router.get('/usage', authenticateToken, ensureTenantIsolation, async (req, res) => {
  try {
    // TODO: Query Kubernetes metrics or Prometheus for actual usage
    // For now, return placeholder data
    const tenantConfig = getTenantConfig(req.tenantId);
    
    // Get database size (example)
    const dbSizeQuery = `
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    const dbResult = await pool.query(dbSizeQuery);
    
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

