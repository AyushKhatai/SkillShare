const db = require('../config/database');

class Review {
    // Get all reviews for a skill
    static async findBySkillId(skillId) {
        const result = await db.query(
            `SELECT r.*, u.full_name, u.profile_image
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.skill_id = $1
       ORDER BY r.created_at DESC`,
            [skillId]
        );
        return result.rows;
    }

    // Get review by ID
    static async findById(reviewId) {
        const result = await db.query(
            `SELECT r.*, u.full_name, u.profile_image
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.review_id = $1`,
            [reviewId]
        );
        return result.rows[0];
    }

    // Get reviews by user ID
    static async findByUserId(userId) {
        const result = await db.query(
            `SELECT r.*, s.title as skill_title
       FROM reviews r
       JOIN skills s ON r.skill_id = s.skill_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    // Create new review
    static async create(reviewData) {
        const { skill_id, user_id, rating, comment } = reviewData;
        const result = await db.query(
            `INSERT INTO reviews (skill_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [skill_id, user_id, rating, comment || null]
        );
        return result.rows[0];
    }

    // Update review
    static async update(reviewId, reviewData) {
        const { rating, comment } = reviewData;
        const result = await db.query(
            `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment),
           updated_at = CURRENT_TIMESTAMP
       WHERE review_id = $3
       RETURNING *`,
            [rating, comment, reviewId]
        );
        return result.rows[0];
    }

    // Delete review
    static async delete(reviewId) {
        await db.query('DELETE FROM reviews WHERE review_id = $1', [reviewId]);
    }

    // Check if user already reviewed a skill
    static async hasUserReviewed(skillId, userId) {
        const result = await db.query(
            `SELECT review_id FROM reviews WHERE skill_id = $1 AND user_id = $2`,
            [skillId, userId]
        );
        return result.rows.length > 0;
    }
}

module.exports = Review;
