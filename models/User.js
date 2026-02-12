const db = require('../config/database');

class User {
    // Get user by ID
    static async findById(userId) {
        const result = await db.query(
            'SELECT user_id, full_name, email, bio, profile_image, phone, department, year_of_study, created_at FROM users WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    }

    // Get user by email
    static async findByEmail(email) {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    // Create new user
    static async create(userData) {
        const { full_name, email, password_hash, bio, profile_image, phone, department, year_of_study } = userData;
        const result = await db.query(
            `INSERT INTO users (full_name, email, password_hash, bio, profile_image, phone, department, year_of_study)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, full_name, email, bio, profile_image, phone, department, year_of_study, created_at`,
            [full_name, email, password_hash, bio || null, profile_image || null, phone || null, department || null, year_of_study || null]
        );
        return result.rows[0];
    }

    // Update user profile
    static async update(userId, userData) {
        const { full_name, bio, profile_image, phone, department, year_of_study } = userData;
        const result = await db.query(
            `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           bio = COALESCE($2, bio),
           profile_image = COALESCE($3, profile_image),
           phone = COALESCE($4, phone),
           department = COALESCE($5, department),
           year_of_study = COALESCE($6, year_of_study),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $7
       RETURNING user_id, full_name, email, bio, profile_image, phone, department, year_of_study`,
            [full_name, bio, profile_image, phone, department, year_of_study, userId]
        );
        return result.rows[0];
    }

    // Get all users
    static async findAll(limit = 50, offset = 0) {
        const result = await db.query(
            `SELECT user_id, full_name, email, bio, profile_image, department, year_of_study, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    // Delete user
    static async delete(userId) {
        await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
    }
}

module.exports = User;
