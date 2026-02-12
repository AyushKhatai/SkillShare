const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ skills: [], filters: req.query });
});

router.get('/my/skills', (req, res) => {
  res.json({ skills: [] });
});

router.get('/user/:userId', (req, res) => {
  res.json({ skills: [], userId: Number(req.params.userId) });
});

router.get('/:skillId', (req, res) => {
  res.json({ skill: { id: Number(req.params.skillId) } });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Skill created', skill: req.body || {} });
});

router.put('/:skillId', (req, res) => {
  res.json({ message: 'Skill updated', skillId: Number(req.params.skillId), updates: req.body || {} });
});

router.delete('/:skillId', (req, res) => {
  res.json({ message: 'Skill deleted', skillId: Number(req.params.skillId) });
});

module.exports = router;
