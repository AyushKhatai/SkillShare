const db = require('../config/database');

class Message {
    // Generate a conversation ID from two user IDs and optional booking ID
    static generateConversationId(userId1, userId2, bookingId = null) {
        const sorted = [parseInt(userId1), parseInt(userId2)].sort((a, b) => a - b);
        return bookingId ? `${sorted[0]}_${sorted[1]}_b${bookingId}` : `${sorted[0]}_${sorted[1]}`;
    }

    // Get or create a conversation
    static async getOrCreateConversation(user1Id, user2Id, bookingId = null, skillId = null) {
        const conversationId = this.generateConversationId(user1Id, user2Id, bookingId);
        const sorted = [parseInt(user1Id), parseInt(user2Id)].sort((a, b) => a - b);

        // Check if conversation exists
        const existing = await db.query(
            'SELECT * FROM conversations WHERE conversation_id = $1',
            [conversationId]
        );

        if (existing.rows.length > 0) {
            return existing.rows[0];
        }

        // Create new conversation
        const result = await db.query(
            `INSERT INTO conversations (conversation_id, user1_id, user2_id, booking_id, skill_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [conversationId, sorted[0], sorted[1], bookingId || null, skillId || null]
        );

        return result.rows[0];
    }

    // Send a message
    static async send(senderId, receiverId, content, bookingId = null, skillId = null) {
        const conversationId = this.generateConversationId(senderId, receiverId, bookingId);

        // Ensure conversation exists
        await this.getOrCreateConversation(senderId, receiverId, bookingId, skillId);

        // Insert message
        const result = await db.query(
            `INSERT INTO messages (conversation_id, sender_id, receiver_id, booking_id, content)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [conversationId, senderId, receiverId, bookingId || null, content]
        );

        // Update conversation's last message
        await db.query(
            `UPDATE conversations 
             SET last_message = $1, last_message_at = CURRENT_TIMESTAMP 
             WHERE conversation_id = $2`,
            [content.substring(0, 200), conversationId]
        );

        return result.rows[0];
    }

    // Get messages for a conversation
    static async getByConversation(conversationId, limit = 50, offset = 0) {
        const result = await db.query(
            `SELECT m.*, 
                    u.full_name as sender_name, u.profile_image as sender_image
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             WHERE m.conversation_id = $1
             ORDER BY m.created_at ASC
             LIMIT $2 OFFSET $3`,
            [conversationId, limit, offset]
        );
        return result.rows;
    }

    // Get all conversations for a user
    static async getConversations(userId) {
        const result = await db.query(
            `SELECT c.*,
                    u1.full_name as user1_name, u1.profile_image as user1_image,
                    u2.full_name as user2_name, u2.profile_image as user2_image,
                    s.title as skill_title, s.category as skill_category,
                    (SELECT COUNT(*) FROM messages m 
                     WHERE m.conversation_id = c.conversation_id 
                     AND m.receiver_id = $1 AND m.is_read = false) as unread_count
             FROM conversations c
             JOIN users u1 ON c.user1_id = u1.user_id
             JOIN users u2 ON c.user2_id = u2.user_id
             LEFT JOIN skills s ON c.skill_id = s.skill_id
             WHERE c.user1_id = $1 OR c.user2_id = $1
             ORDER BY c.last_message_at DESC`,
            [userId]
        );
        return result.rows;
    }

    // Mark messages as read
    static async markAsRead(conversationId, userId) {
        await db.query(
            `UPDATE messages 
             SET is_read = true 
             WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
            [conversationId, userId]
        );
    }

    // Get unread count for a user
    static async getUnreadCount(userId) {
        const result = await db.query(
            `SELECT COUNT(*) as count 
             FROM messages 
             WHERE receiver_id = $1 AND is_read = false`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    // Delete a message (soft-delete or hard-delete)
    static async delete(messageId, userId) {
        const result = await db.query(
            'DELETE FROM messages WHERE message_id = $1 AND sender_id = $2 RETURNING *',
            [messageId, userId]
        );
        return result.rows[0];
    }
}

module.exports = Message;
