const { queryInTenantSchema } = require('../config/database');
const { isValidTenant } = require('../config/tenants');

/**
 * Middleware to ensure tenant isolation
 * Validates tenant from JWT and sets up tenant context
 */
function ensureTenantIsolation(req, res, next) {
  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }

  const tenantId = req.user.tenantId;

  // Validate tenant exists
  if (!isValidTenant(tenantId)) {
    return res.status(403).json({ error: 'Invalid tenant' });
  }

  // Attach tenant context to request
  req.tenantId = tenantId;
  req.queryInTenant = (query, params) => queryInTenantSchema(tenantId, query, params);

  next();
}

/**
 * Helper function to execute queries in tenant schema
 */
async function executeInTenant(tenantId, query, params = []) {
  if (!isValidTenant(tenantId)) {
    throw new Error(`Invalid tenant: ${tenantId}`);
  }
  return queryInTenantSchema(tenantId, query, params);
}

module.exports = {
  ensureTenantIsolation,
  executeInTenant,
};

