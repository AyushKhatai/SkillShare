const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication) - must come before /:skillId
router.get('/my/skills', authMiddleware, skillController.getMySkills);

// Public routes - specific paths before wildcard
router.get('/', skillController.getAllSkills);
router.get('/user/:userId', skillController.getSkillsByUserId);
router.get('/:skillId', skillController.getSkillById);

// Protected write routes
router.post('/', authMiddleware, skillController.createSkill);
router.put('/:skillId', authMiddleware, skillController.updateSkill);
router.delete('/:skillId', authMiddleware, skillController.deleteSkill);

module.exports = router;
