const express = require('express');

const router = express.Router();

router.get('/my', (req, res) => {
  res.json({ reviews: [] });
});

router.get('/skill/:skillId', (req, res) => {
  res.json({ reviews: [], skillId: Number(req.params.skillId) });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Review created', review: req.body || {} });
});

router.put('/:reviewId', (req, res) => {
  res.json({
    message: 'Review updated',
    reviewId: Number(req.params.reviewId),
    updates: req.body || {}
  });
});

router.delete('/:reviewId', (req, res) => {
  res.json({ message: 'Review deleted', reviewId: Number(req.params.reviewId) });
});

module.exports = router;
