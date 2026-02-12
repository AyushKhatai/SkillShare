const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// All booking routes require authentication
router.use(authMiddleware);

router.get('/', bookingController.getMyBookings);
router.get('/student', bookingController.getMyStudentBookings);
router.get('/teacher', bookingController.getMyTeacherBookings);
router.get('/skill/:skillId', bookingController.getBookingsBySkill);
router.get('/:bookingId', bookingController.getBookingById);
router.post('/', bookingController.createBooking);
router.put('/:bookingId/status', bookingController.updateBookingStatus);
router.delete('/:bookingId', bookingController.deleteBooking);

module.exports = router;
