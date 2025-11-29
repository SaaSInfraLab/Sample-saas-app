const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection with timeout
    const queryPromise = pool.query('SELECT 1');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );
    
    await Promise.race([queryPromise, timeoutPromise]);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    // Return 200 even if DB is down - app is still running
    // This prevents Kubernetes from killing the pod
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
  try {
    // Check database connection with timeout
    const queryPromise = pool.query('SELECT 1');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );
    
    await Promise.race([queryPromise, timeoutPromise]);
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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

