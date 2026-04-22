const Skill = require('../models/Skill');

// Get all skills with filters
exports.getAllSkills = async (req, res) => {
    try {
        const { category, skill_level, search, limit, offset } = req.query;

        const filters = {
            category,
            skill_level,
            search,
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0
        };

        const skills = await Skill.findAll(filters);

        res.json({ skills, count: skills.length });
    } catch (error) {
        console.error('Get all skills error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get skill by ID
exports.getSkillById = async (req, res) => {
    try {
        const { skillId } = req.params;
        const skill = await Skill.findById(skillId);

        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        res.json({ skill });
    } catch (error) {
        console.error('Get skill error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get skills by user ID
exports.getSkillsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const skills = await Skill.findByUserId(userId);

        res.json({ skills, count: skills.length });
    } catch (error) {
        console.error('Get user skills error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user's skills
exports.getMySkills = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const skills = await Skill.findByUserId(userId);

        res.json({ skills, count: skills.length });
    } catch (error) {
        console.error('Get my skills error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new skill
exports.createSkill = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { title, description, category, skill_level, duration, price, location, resume_link } = req.body;

        // Validation
        if (!title || !description || !category || !skill_level) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const skillData = {
            user_id: userId,
            title,
            description,
            category,
            skill_level,
            duration,
            price,
            location,
            resume_link
        };

        const newSkill = await Skill.create(skillData);

        res.status(201).json({
            message: 'Skill created successfully',
            skill: newSkill
        });
    } catch (error) {
        console.error('Create skill error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Update skill
exports.updateSkill = async (req, res) => {
    try {
        const { skillId } = req.params;
        const userId = req.user.user_id;
        const { title, description, category, skill_level, duration, price, location, resume_link, is_active } = req.body;

        // Check if skill exists and belongs to user
        const existingSkill = await Skill.findById(skillId);
        if (!existingSkill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        if (existingSkill.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this skill' });
        }

        const updatedSkill = await Skill.update(skillId, {
            title,
            description,
            category,
            skill_level,
            duration,
            price,
            location,
            resume_link,
            is_active
        });

        res.json({
            message: 'Skill updated successfully',
            skill: updatedSkill
        });
    } catch (error) {
        console.error('Update skill error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete skill
exports.deleteSkill = async (req, res) => {
    try {
        const { skillId } = req.params;
        const userId = req.user.user_id;

        // Check if skill exists and belongs to user
        const existingSkill = await Skill.findById(skillId);
        if (!existingSkill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        if (existingSkill.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this skill' });
        }

        await Skill.delete(skillId);

        res.json({ message: 'Skill deleted successfully' });
    } catch (error) {
        console.error('Delete skill error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
