const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication)
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.delete('/account', authMiddleware, userController.deleteAccount);

// Public routes
router.get('/all', userController.getAllUsers);
router.get('/:userId', userController.getUserById);

module.exports = router;
