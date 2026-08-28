const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI Matchmaker (Public or Authenticated)
router.post('/match', aiController.matchSkills);

// AI Learning Roadmap Generator
router.post('/roadmap', aiController.generateRoadmap);

// AI Skill Description & Syllabus Enhancer (For Tutors)
router.post('/enhance-skill', aiController.enhanceSkill);

// AI Diagnostic Quiz Generator
router.post('/quiz', aiController.generateQuiz);

// AI Interactive Campus Mentor Chat Copilot
router.post('/chat', aiController.chatMentor);

module.exports = router;
