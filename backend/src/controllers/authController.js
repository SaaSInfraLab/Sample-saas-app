const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');
const { queryInTenantSchema } = require('../config/database');

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { email, password, name, tenantId } = req.body;

    // Validate required fields
    if (!email || !password || !name || !tenantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists in tenant schema
    const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await queryInTenantSchema(tenantId, checkUserQuery, [email]);
    
    if (existingUser.rows && existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const createUserQuery = `
      INSERT INTO users (email, password_hash, name, tenant_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email, name, tenant_id, created_at
    `;

    const result = await queryInTenantSchema(tenantId, createUserQuery, [
      email,
      hashedPassword,
      name,
      tenantId,
    ]);

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenant_id,
      },
      token,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user in tenant schema
    const findUserQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await queryInTenantSchema(tenantId, findUserQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenant_id,
      },
      token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

/**
 * Get current user info
 */
async function getCurrentUser(req, res) {
  try {
    const getUserQuery = 'SELECT id, email, name, tenant_id, created_at FROM users WHERE id = $1';
    const result = await req.queryInTenant(getUserQuery, [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
};

