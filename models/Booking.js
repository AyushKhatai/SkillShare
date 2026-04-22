const db = require('../config/database');

class Booking {
    // Get all bookings for a user (as student or teacher)
    static async findByUserId(userId) {
        const result = await db.query(
            `SELECT b.*, 
              s.title as skill_title, s.category, s.duration, s.price, s.location,
              student.full_name as student_name, student.email as student_email,
              teacher.full_name as teacher_name, teacher.email as teacher_email
       FROM bookings b
       JOIN skills s ON b.skill_id = s.skill_id
       JOIN users student ON b.student_id = student.user_id
       JOIN users teacher ON b.teacher_id = teacher.user_id
       WHERE b.student_id = $1 OR b.teacher_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
            [userId]
        );
        return result.rows;
    }

    // Get bookings as student
    static async findByStudentId(studentId) {
        const result = await db.query(
            `SELECT b.*, 
              s.title as skill_title, s.category, s.duration, s.price, s.location,
              teacher.full_name as teacher_name, teacher.email as teacher_email, teacher.profile_image as teacher_image
       FROM bookings b
       JOIN skills s ON b.skill_id = s.skill_id
       JOIN users teacher ON b.teacher_id = teacher.user_id
       WHERE b.student_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
            [studentId]
        );
        return result.rows;
    }

    // Get bookings as teacher
    static async findByTeacherId(teacherId) {
        const result = await db.query(
            `SELECT b.*, 
              s.title as skill_title, s.category, s.duration, s.price, s.location,
              student.full_name as student_name, student.email as student_email, student.profile_image as student_image
       FROM bookings b
       JOIN skills s ON b.skill_id = s.skill_id
       JOIN users student ON b.student_id = student.user_id
       WHERE b.teacher_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
            [teacherId]
        );
        return result.rows;
    }

    // Get booking by ID
    static async findById(bookingId) {
        const result = await db.query(
            `SELECT b.*, 
              s.title as skill_title, s.category, s.duration, s.price, s.location,
              student.full_name as student_name, student.email as student_email,
              teacher.full_name as teacher_name, teacher.email as teacher_email
       FROM bookings b
       JOIN skills s ON b.skill_id = s.skill_id
       JOIN users student ON b.student_id = student.user_id
       JOIN users teacher ON b.teacher_id = teacher.user_id
       WHERE b.booking_id = $1`,
            [bookingId]
        );
        return result.rows[0];
    }

    // Create new booking
    static async create(bookingData) {
        const { skill_id, student_id, teacher_id, booking_date, booking_time, message } = bookingData;
        const result = await db.query(
            `INSERT INTO bookings (skill_id, student_id, teacher_id, booking_date, booking_time, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [skill_id, student_id, teacher_id, booking_date, booking_time, message || null]
        );
        return result.rows[0];
    }

    // Update booking status
    static async updateStatus(bookingId, status) {
        const result = await db.query(
            `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $2
       RETURNING *`,
            [status, bookingId]
        );
        return result.rows[0];
    }

    // Delete booking
    static async delete(bookingId) {
        await db.query('DELETE FROM bookings WHERE booking_id = $1', [bookingId]);
    }

    // Get bookings by skill ID
    static async findBySkillId(skillId) {
        const result = await db.query(
            `SELECT b.*, 
              student.full_name as student_name, student.email as student_email
       FROM bookings b
       JOIN users student ON b.student_id = student.user_id
       WHERE b.skill_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
            [skillId]
        );
        return result.rows;
    }
}

module.exports = Booking;
