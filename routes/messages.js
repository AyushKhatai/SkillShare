const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// All message routes require authentication
router.use(authMiddleware);

// Conversations
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:conversationId', messageController.getMessages);

// Send message
router.post('/send', messageController.sendMessage);

// Start / get conversation
router.post('/start', messageController.startConversation);

// Mark as read
router.put('/read/:conversationId', messageController.markRead);

// Unread count
router.get('/unread', messageController.getUnreadCount);

// Delete message
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
