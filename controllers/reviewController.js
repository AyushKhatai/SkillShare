const Review = require('../models/Review');
const Skill = require('../models/Skill');

// Get all reviews for a skill
exports.getReviewsBySkill = async (req, res) => {
    try {
        const { skillId } = req.params;

        const reviews = await Review.findBySkillId(skillId);

        res.json({ reviews, count: reviews.length });
    } catch (error) {
        console.error('Get skill reviews error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get reviews by user
exports.getReviewsByUser = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const reviews = await Review.findByUserId(userId);

        res.json({ reviews, count: reviews.length });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new review
exports.createReview = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { skill_id, rating, comment } = req.body;

        // Validation
        if (!skill_id || !rating) {
            return res.status(400).json({ message: 'Skill ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if skill exists
        const skill = await Skill.findById(skill_id);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        // Check if user is trying to review their own skill
        if (skill.user_id === userId) {
            return res.status(400).json({ message: 'You cannot review your own skill' });
        }

        // Check if user already reviewed this skill
        const hasReviewed = await Review.hasUserReviewed(skill_id, userId);
        if (hasReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this skill' });
        }

        const reviewData = {
            skill_id,
            user_id: userId,
            rating,
            comment
        };

        const newReview = await Review.create(reviewData);

        // Update skill average rating
        await Skill.updateRating(skill_id);

        res.status(201).json({
            message: 'Review created successfully',
            review: newReview
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update review
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.user_id;
        const { rating, comment } = req.body;

        // Validation
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user owns this review
        if (review.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this review' });
        }

        const updatedReview = await Review.update(reviewId, { rating, comment });

        // Update skill average rating
        await Skill.updateRating(review.skill_id);

        res.json({
            message: 'Review updated successfully',
            review: updatedReview
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete review
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.user_id;

        // Check if review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user owns this review
        if (review.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        const skillId = review.skill_id;
        await Review.delete(reviewId);

        // Update skill average rating
        await Skill.updateRating(skillId);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
