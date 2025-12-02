const express = require('express');
const router = express.Router();
const { pool, checkPoolHealth, connectWithRetry, isConnected } = require('../config/database');

async function queryWithTimeout(query, params = [], timeoutMs = 3000) {
  const client = await pool.connect();
  let timeoutId;
  
  try {
    const queryPromise = client.query(query, params);
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Database query timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  } finally {
    client.release();
  }
}

router.get('/', async (req, res) => {
  try {
    // Check database connection with timeout
    await queryWithTimeout('SELECT 1', [], 3000);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    const sanitizedMessage = error.message
      .replace(/user\s+["'][^"']+["']/gi, 'user "[REDACTED]"')
      .replace(/password\s+["'][^"']+["']/gi, 'password "[REDACTED]"');
    console.error('Health check failed:', sanitizedMessage);
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      warning: sanitizedMessage,
    });
  }
});

router.get('/ready', async (req, res) => {
  const READINESS_TIMEOUT = 18000;
  let timeoutId;

  try {
    const healthCheckPromise = (async () => {
      if (!isConnected) {
        const connected = await connectWithRetry(3);
        if (!connected) {
          return false;
        }
      }
      
      await queryWithTimeout('SELECT 1', [], 3000);
      return true;
    })();

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Readiness check timeout after ${READINESS_TIMEOUT}ms`));
      }, READINESS_TIMEOUT);
    });

    const healthy = await Promise.race([healthCheckPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    if (healthy) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Database not ready',
      });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    const sanitizedMessage = error.message
      .replace(/user\s+["'][^"']+["']/gi, 'user "[REDACTED]"')
      .replace(/password\s+["'][^"']+["']/gi, 'password "[REDACTED]"');
    console.error('Readiness check failed:', sanitizedMessage);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: sanitizedMessage,
    });
  }
});

router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

