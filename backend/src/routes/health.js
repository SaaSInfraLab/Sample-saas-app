const express = require('express');
const router = express.Router();
const { pool, checkPoolHealth, connectWithRetry, isConnected } = require('../config/database');

/**
 * Execute query with proper timeout and cancellation
 */
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

/**
 * Health check endpoint
 */
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
    // Return 200 even if DB is down - app is still running
    // This prevents Kubernetes from killing the pod
    console.error('Health check failed:', error.message);
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      warning: error.message,
    });
  }
});

/**
 * Readiness check endpoint
 */
router.get('/ready', async (req, res) => {
  const READINESS_TIMEOUT = 18000; // 18 seconds - slightly less than probe timeout of 20s
  let timeoutId;

  try {
    const healthCheckPromise = (async () => {
      // Check pool state first
      if (!isConnected) {
        console.log('Pool not connected, attempting to reconnect...');
        const connected = await connectWithRetry(3);
        if (!connected) {
          return false;
        }
      }
      
      // Check database connection with timeout (3s for faster failure detection)
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
    console.error('Readiness check failed:', error.message);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Liveness check endpoint
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

