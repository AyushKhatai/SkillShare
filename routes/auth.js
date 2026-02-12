const express = require('express');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }

  return res.status(201).json({
    message: 'Registration endpoint is ready. Connect your DB logic to persist users.',
    user: { id: 1, name, email }
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  return res.json({
    message: 'Login endpoint is ready. Replace placeholder token with JWT implementation.',
    token: 'dev-placeholder-token',
    user: { id: 1, email }
  });
});

module.exports = router;
