const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ bookings: [] });
});

router.get('/student', (req, res) => {
  res.json({ bookings: [], type: 'student' });
});

router.get('/teacher', (req, res) => {
  res.json({ bookings: [], type: 'teacher' });
});

router.get('/skill/:skillId', (req, res) => {
  res.json({ bookings: [], skillId: Number(req.params.skillId) });
});

router.get('/:bookingId', (req, res) => {
  res.json({ booking: { id: Number(req.params.bookingId) } });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Booking created', booking: req.body || {} });
});

router.put('/:bookingId/status', (req, res) => {
  res.json({
    message: 'Booking status updated',
    bookingId: Number(req.params.bookingId),
    status: req.body?.status || null
  });
});

router.delete('/:bookingId', (req, res) => {
  res.json({ message: 'Booking deleted', bookingId: Number(req.params.bookingId) });
});

module.exports = router;
