const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { ensureTenantIsolation } = require('../middleware/tenant-isolation');
const { register, login, getCurrentUser } = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, ensureTenantIsolation, getCurrentUser);

module.exports = router;

