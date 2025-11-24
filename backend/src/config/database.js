const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskdb',
  user: process.env.DB_USER || 'taskuser',
  password: process.env.DB_PASSWORD || 'changeme',
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to get tenant schema name
function getTenantSchema(tenantId) {
  return `tenant_${tenantId}`;
}

// Execute query in tenant schema
async function queryInTenantSchema(tenantId, query, params = []) {
  const schema = getTenantSchema(tenantId);
  const client = await pool.connect();
  try {
    // Set search path in a separate query
    await client.query(`SET search_path TO ${schema}`);
    // Execute the actual query
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  queryInTenantSchema,
  getTenantSchema,
};

