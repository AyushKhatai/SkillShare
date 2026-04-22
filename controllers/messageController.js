const Message = require('../models/Message');

const messageController = {
    // GET /api/messages/conversations - Get all conversations for current user
    getConversations: async (req, res) => {
        try {
            const conversations = await Message.getConversations(req.user.user_id);
            res.json({ conversations });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            res.status(500).json({ message: 'Failed to fetch conversations' });
        }
    },

    // GET /api/messages/conversations/:conversationId - Get messages in a conversation
    getMessages: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            const messages = await Message.getByConversation(conversationId, limit, offset);

            // Mark as read
            await Message.markAsRead(conversationId, req.user.user_id);

            res.json({ messages });
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ message: 'Failed to fetch messages' });
        }
    },

    // POST /api/messages/send - Send a message
    sendMessage: async (req, res) => {
        try {
            const { receiverId, content, bookingId, skillId } = req.body;

            if (!receiverId || !content || !content.trim()) {
                return res.status(400).json({ message: 'Receiver and content are required' });
            }

            if (parseInt(receiverId) === req.user.user_id) {
                return res.status(400).json({ message: 'Cannot send message to yourself' });
            }

            const message = await Message.send(
                req.user.user_id,
                parseInt(receiverId),
                content.trim(),
                bookingId ? parseInt(bookingId) : null,
                skillId ? parseInt(skillId) : null
            );

            res.status(201).json({ message });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ message: 'Failed to send message' });
        }
    },

    // POST /api/messages/start - Start or get a conversation (used for "Message" button)
    startConversation: async (req, res) => {
        try {
            const { receiverId, bookingId, skillId } = req.body;

            if (!receiverId) {
                return res.status(400).json({ message: 'Receiver ID is required' });
            }

            const conversation = await Message.getOrCreateConversation(
                req.user.user_id,
                parseInt(receiverId),
                bookingId ? parseInt(bookingId) : null,
                skillId ? parseInt(skillId) : null
            );

            res.json({ conversation });
        } catch (error) {
            console.error('Error starting conversation:', error);
            res.status(500).json({ message: 'Failed to start conversation' });
        }
    },

    // PUT /api/messages/read/:conversationId - Mark messages as read
    markRead: async (req, res) => {
        try {
            const { conversationId } = req.params;
            await Message.markAsRead(conversationId, req.user.user_id);
            res.json({ success: true });
        } catch (error) {
            console.error('Error marking as read:', error);
            res.status(500).json({ message: 'Failed to mark as read' });
        }
    },

    // GET /api/messages/unread - Get unread message count
    getUnreadCount: async (req, res) => {
        try {
            const count = await Message.getUnreadCount(req.user.user_id);
            res.json({ count });
        } catch (error) {
            console.error('Error fetching unread count:', error);
            res.status(500).json({ message: 'Failed to fetch unread count' });
        }
    },

    // DELETE /api/messages/:messageId - Delete a message
    deleteMessage: async (req, res) => {
        try {
            const deleted = await Message.delete(req.params.messageId, req.user.user_id);
            if (!deleted) {
                return res.status(404).json({ message: 'Message not found or unauthorized' });
            }
            res.json({ message: 'Message deleted' });
        } catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({ message: 'Failed to delete message' });
        }
    }
};

module.exports = messageController;
