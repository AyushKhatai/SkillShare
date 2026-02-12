const express = require('express');

const router = express.Router();

router.get('/profile', (req, res) => {
  res.json({ user: { id: 1, name: 'Demo User', email: 'demo@example.com' } });
});

router.put('/profile', (req, res) => {
  res.json({ message: 'Profile updated', updates: req.body || {} });
});

router.get('/all', (req, res) => {
  res.json({ users: [] });
});

router.get('/:userId', (req, res) => {
  res.json({ user: { id: Number(req.params.userId) } });
});

router.delete('/account', (req, res) => {
  res.json({ message: 'Account deleted (placeholder)' });
});

module.exports = router;
