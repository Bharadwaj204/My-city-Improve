const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In-memory admin user (replace with DB in production)
const adminCredentials = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD_HASH // Bcrypt hash
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate admin credentials
    if (username !== adminCredentials.username) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, adminCredentials.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;