const { Pool } = require('pg');
require('dotenv').config();

// Connection state tracking
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 3;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'taskdb',
  user: process.env.DB_USER || 'taskuser',
  password: process.env.DB_PASSWORD || 'changeme',
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Increased to 15s to match probe timeout
  ssl: {
    rejectUnauthorized: false // Required for RDS connections without custom CA
  }
});

// Test database connection
pool.on('connect', () => {
  if (!isConnected) {
    console.log('Database connection established');
    isConnected = true;
    connectionRetries = 0;
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  isConnected = false;
  // Don't exit process - allow retry and graceful degradation
  // The application should handle DB errors gracefully
});

// Health check function
async function checkPoolHealth() {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      isConnected = true;
      connectionRetries = 0;
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    isConnected = false;
    console.error('Pool health check failed:', error.message);
    return false;
  }
}

// Connection retry with exponential backoff
async function connectWithRetry(maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const healthy = await checkPoolHealth();
      if (healthy) {
        return true;
      }
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error.message);
    }
    
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
      console.log(`Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

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
  checkPoolHealth,
  connectWithRetry,
  get isConnected() {
    return isConnected;
  },
};

