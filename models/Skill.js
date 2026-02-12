const db = require('../config/database');

class Skill {
    // Get all skills with optional filters
    static async findAll(filters = {}) {
        let query = `
      SELECT s.*, u.full_name as teacher_name, u.profile_image as teacher_image
      FROM skills s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.is_active = true
    `;
        const params = [];
        let paramCount = 1;

        if (filters.category) {
            query += ` AND s.category = $${paramCount}`;
            params.push(filters.category);
            paramCount++;
        }

        if (filters.skill_level) {
            query += ` AND s.skill_level = $${paramCount}`;
            params.push(filters.skill_level);
            paramCount++;
        }

        if (filters.search) {
            query += ` AND (s.title ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
            paramCount++;
        }

        query += ` ORDER BY s.created_at DESC`;

        if (filters.limit) {
            query += ` LIMIT $${paramCount}`;
            params.push(filters.limit);
            paramCount++;
        }

        if (filters.offset) {
            query += ` OFFSET $${paramCount}`;
            params.push(filters.offset);
        }

        const result = await db.query(query, params);
        return result.rows;
    }

    // Get skill by ID
    static async findById(skillId) {
        const result = await db.query(
            `SELECT s.*, u.full_name as teacher_name, u.email as teacher_email, 
              u.profile_image as teacher_image, u.bio as teacher_bio
       FROM skills s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.skill_id = $1`,
            [skillId]
        );
        return result.rows[0];
    }

    // Get skills by user ID
    static async findByUserId(userId) {
        const result = await db.query(
            `SELECT * FROM skills WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    // Create new skill
    static async create(skillData) {
        const { user_id, title, description, category, skill_level, duration, price, location, image_url } = skillData;
        const result = await db.query(
            `INSERT INTO skills (user_id, title, description, category, skill_level, duration, price, location, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [user_id, title, description, category, skill_level, duration || null, price || 0, location || null, image_url || null]
        );
        return result.rows[0];
    }

    // Update skill
    static async update(skillId, skillData) {
        const { title, description, category, skill_level, duration, price, location, image_url, is_active } = skillData;
        const result = await db.query(
            `UPDATE skills 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           skill_level = COALESCE($4, skill_level),
           duration = COALESCE($5, duration),
           price = COALESCE($6, price),
           location = COALESCE($7, location),
           image_url = COALESCE($8, image_url),
           is_active = COALESCE($9, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE skill_id = $10
       RETURNING *`,
            [title, description, category, skill_level, duration, price, location, image_url, is_active, skillId]
        );
        return result.rows[0];
    }

    // Delete skill
    static async delete(skillId) {
        await db.query('DELETE FROM skills WHERE skill_id = $1', [skillId]);
    }

    // Update skill rating
    static async updateRating(skillId) {
        await db.query(
            `UPDATE skills 
       SET average_rating = (
         SELECT COALESCE(AVG(rating), 0) 
         FROM reviews 
         WHERE skill_id = $1
       )
       WHERE skill_id = $1`,
            [skillId]
        );
    }

    // Increment booking count
    static async incrementBookings(skillId) {
        await db.query(
            `UPDATE skills 
       SET total_bookings = total_bookings + 1 
       WHERE skill_id = $1`,
            [skillId]
        );
    }
}

module.exports = Skill;
