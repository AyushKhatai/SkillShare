const Booking = require('../models/Booking');
const Skill = require('../models/Skill');

// Get all bookings for current user
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const bookings = await Booking.findByUserId(userId);

        res.json({ bookings, count: bookings.length });
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get bookings as student
exports.getMyStudentBookings = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const bookings = await Booking.findByStudentId(userId);

        res.json({ bookings, count: bookings.length });
    } catch (error) {
        console.error('Get student bookings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get bookings as teacher
exports.getMyTeacherBookings = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const bookings = await Booking.findByTeacherId(userId);

        res.json({ bookings, count: bookings.length });
    } catch (error) {
        console.error('Get teacher bookings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.user_id;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if user is involved in this booking
        if (booking.student_id !== userId && booking.teacher_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this booking' });
        }

        res.json({ booking });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new booking
exports.createBooking = async (req, res) => {
    try {
        const studentId = req.user.user_id;
        const { skill_id, booking_date, booking_time, message } = req.body;

        // Validation
        if (!skill_id || !booking_date || !booking_time) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Get skill to find teacher
        const skill = await Skill.findById(skill_id);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        // Check if user is trying to book their own skill
        if (skill.user_id === studentId) {
            return res.status(400).json({ message: 'You cannot book your own skill' });
        }

        const bookingData = {
            skill_id,
            student_id: studentId,
            teacher_id: skill.user_id,
            booking_date,
            booking_time,
            message
        };

        const newBooking = await Booking.create(bookingData);

        // Increment skill booking count
        await Skill.incrementBookings(skill_id);

        res.status(201).json({
            message: 'Booking created successfully',
            booking: newBooking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;
        const userId = req.user.user_id;

        // Validation
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Check if booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Only teacher can confirm/complete, both can cancel
        if (status === 'confirmed' || status === 'completed') {
            if (booking.teacher_id !== userId) {
                return res.status(403).json({ message: 'Only the teacher can update to this status' });
            }
        } else if (status === 'cancelled') {
            if (booking.student_id !== userId && booking.teacher_id !== userId) {
                return res.status(403).json({ message: 'Not authorized to cancel this booking' });
            }
        }

        const updatedBooking = await Booking.updateStatus(bookingId, status);

        res.json({
            message: 'Booking status updated successfully',
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.user_id;

        // Check if booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Only student can delete their booking
        if (booking.student_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this booking' });
        }

        await Booking.delete(bookingId);

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get bookings for a specific skill
exports.getBookingsBySkill = async (req, res) => {
    try {
        const { skillId } = req.params;
        const userId = req.user.user_id;

        // Check if skill belongs to user
        const skill = await Skill.findById(skillId);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        if (skill.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to view bookings for this skill' });
        }

        const bookings = await Booking.findBySkillId(skillId);

        res.json({ bookings, count: bookings.length });
    } catch (error) {
        console.error('Get skill bookings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
