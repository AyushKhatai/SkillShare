// Validation middleware for request data
const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Validation rules for registration
const validateRegistration = [
    body('full_name')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];

// Validation rules for login
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

// Validation rules for skill creation
const validateSkill = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required'),
    body('skill_level')
        .trim()
        .notEmpty().withMessage('Skill level is required')
        .isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid skill level'),
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    handleValidationErrors
];

// Validation rules for booking
const validateBooking = [
    body('skill_id')
        .notEmpty().withMessage('Skill ID is required')
        .isInt().withMessage('Skill ID must be a number'),
    body('booking_date')
        .notEmpty().withMessage('Booking date is required')
        .isDate().withMessage('Must be a valid date'),
    body('booking_time')
        .notEmpty().withMessage('Booking time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Must be a valid time (HH:MM:SS)'),
    handleValidationErrors
];

// Validation rules for review
const validateReview = [
    body('skill_id')
        .notEmpty().withMessage('Skill ID is required')
        .isInt().withMessage('Skill ID must be a number'),
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters'),
    handleValidationErrors
];

// Validation for ID parameters
const validateId = (paramName) => [
    param(paramName)
        .notEmpty().withMessage(`${paramName} is required`)
        .isInt().withMessage(`${paramName} must be a number`),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateSkill,
    validateBooking,
    validateReview,
    validateId,
    handleValidationErrors
};
