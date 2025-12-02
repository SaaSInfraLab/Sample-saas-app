const { Pool } = require('pg');
require('dotenv').config();

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
  connectionTimeoutMillis: 15000,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  if (!isConnected) {
    console.log('Database connection established');
    isConnected = true;
    connectionRetries = 0;
  }
});

pool.on('error', (err) => {
  const sanitizedError = sanitizeError(err);
  console.error('Unexpected error on idle client', sanitizedError);
  isConnected = false;
});

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
    const sanitizedMessage = sanitizeError(error).message;
    console.error('Pool health check failed:', sanitizedMessage);
    return false;
  }
}

async function connectWithRetry(maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const healthy = await checkPoolHealth();
      if (healthy) {
        return true;
      }
    } catch (error) {
      const sanitizedMessage = sanitizeError(error).message;
      console.error(`Connection attempt ${attempt} failed:`, sanitizedMessage);
    }
    
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

function sanitizeError(error) {
  if (!error) return error;
  
  const errorStr = error.toString();
  const errorMessage = error.message || errorStr;
  
  const sanitized = {
    message: errorMessage
      .replace(/user\s+["'][^"']+["']/gi, 'user "[REDACTED]"')
      .replace(/password\s+["'][^"']+["']/gi, 'password "[REDACTED]"')
      .replace(/authentication failed for user\s+["'][^"']+["']/gi, 'authentication failed for user "[REDACTED]"')
      .replace(/role\s+["'][^"']+["']/gi, 'role "[REDACTED]"'),
    code: error.code,
    name: error.name
  };
  
  return sanitized;
}

function getTenantSchema(tenantId) {
  return `tenant_${tenantId}`;
}

async function queryInTenantSchema(tenantId, query, params = []) {
  const schema = getTenantSchema(tenantId);
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schema}`);
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

