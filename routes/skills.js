const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', skillController.getAllSkills);
router.get('/:skillId', skillController.getSkillById);
router.get('/user/:userId', skillController.getSkillsByUserId);

// Protected routes (require authentication)
router.get('/my/skills', authMiddleware, skillController.getMySkills);
router.post('/', authMiddleware, skillController.createSkill);
router.put('/:skillId', authMiddleware, skillController.updateSkill);
router.delete('/:skillId', authMiddleware, skillController.deleteSkill);

module.exports = router;
