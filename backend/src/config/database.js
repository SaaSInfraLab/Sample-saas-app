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
  if (!error) {
    return error;
  }
  
  const errorMessage = error.message || error.toString();

  let sanitized = errorMessage
    .replace(/password authentication failed for user\s+["']([^"']+)["']/gi, 'password authentication failed for user "[REDACTED]"')
    .replace(/authentication failed for user\s+["']?([^"'\s]+)["']?/gi, 'authentication failed for user "[REDACTED]"')
    .replace(/user\s+["']([^"']+)["']/gi, 'user "[REDACTED]"')
    .replace(/password\s+["']([^"']+)["']/gi, 'password "[REDACTED]"')
    .replace(/role\s+["']([^"']+)["']/gi, 'role "[REDACTED]"');

  sanitized = sanitized.replace(/["']([A-Za-z0-9+/]{8,}={0,2})["']/g, '"[REDACTED]"');

  sanitized = sanitized.replace(/(?:for|user|password|with|as)\s+["']?([A-Za-z0-9+/]{8,}={0,2})["']?/gi, (match, base64Str) => {
    return match.replace(base64Str, '[REDACTED]');
  });

  sanitized = sanitized.replace(/(?:user|password|pwd|passwd|credential|secret|token)\s*[:=]\s*["']?([^"'\s]{4,})["']?/gi, (match, value) => {
    return match.replace(value, '[REDACTED]');
  });
  
  return {
    message: sanitized,
    code: error.code,
    name: error.name
  };
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

