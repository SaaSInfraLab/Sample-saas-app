// Tenant configuration mapping
// Maps namespace names to tenant IDs and configurations

const TENANT_CONFIG = {
  platform: {
    tenantId: 'platform',
    namespace: 'platform',
    name: 'Platform Team',
    schema: 'tenant_platform',
    resourceLimits: {
      cpu: '20',
      memory: '40Gi',
      pods: 200,
      storage: '200Gi',
    },
  },
  analytics: {
    tenantId: 'analytics',
    namespace: 'analytics',
    name: 'Analytics Team',
    schema: 'tenant_analytics',
    resourceLimits: {
      cpu: '15',
      memory: '30Gi',
      pods: 180,
      storage: '150Gi',
    },
  },
  data: {
    tenantId: 'data',
    namespace: 'data',
    name: 'Data Team',
    schema: 'tenant_data',
    resourceLimits: {
      cpu: '10',
      memory: '20Gi',
      pods: 150,
      storage: '100Gi',
    },
  },
};

function getTenantConfig(tenantId) {
  return TENANT_CONFIG[tenantId] || null;
}

function getAllTenants() {
  return Object.values(TENANT_CONFIG);
}

function isValidTenant(tenantId) {
  return tenantId in TENANT_CONFIG;
}

module.exports = {
  TENANT_CONFIG,
  getTenantConfig,
  getAllTenants,
  isValidTenant,
};

