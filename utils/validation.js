const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation schemas
const userValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('age')
      .isInt({ min: 18, max: 100 })
      .withMessage('Age must be between 18 and 100'),
    body('gender')
      .isIn(['male', 'female', 'non-binary', 'other'])
      .withMessage('Gender must be male, female, non-binary, or other'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    body('age')
      .optional()
      .isInt({ min: 18, max: 100 })
      .withMessage('Age must be between 18 and 100'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location must be less than 100 characters'),
    body('interests')
      .optional()
      .isArray()
      .withMessage('Interests must be an array'),
    body('interests.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage('Each interest must be between 1 and 30 characters'),
    handleValidationErrors
  ]
};

// Message validation schemas
const messageValidation = {
  send: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters'),
    body('type')
      .isIn(['text', 'image', 'voice', 'video', 'gift'])
      .withMessage('Message type must be text, image, voice, video, or gift'),
    handleValidationErrors
  ],

  react: [
    body('emoji')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Emoji must be between 1 and 10 characters'),
    handleValidationErrors
  ]
};

// Coin validation schemas
const coinValidation = {
  purchase: [
    body('package_id')
      .isInt({ min: 1 })
      .withMessage('Package ID must be a positive integer'),
    body('payment_method')
      .isIn(['stripe', 'paypal', 'google_pay', 'apple_pay'])
      .withMessage('Invalid payment method'),
    handleValidationErrors
  ]
};

// Admin validation schemas
const adminValidation = {
  updateUser: [
    body('is_banned')
      .optional()
      .isBoolean()
      .withMessage('is_banned must be a boolean'),
    body('is_premium')
      .optional()
      .isBoolean()
      .withMessage('is_premium must be a boolean'),
    body('coins')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Coins must be a non-negative integer'),
    handleValidationErrors
  ],

  coinAdjustment: [
    body('amount')
      .isInt()
      .withMessage('Amount must be an integer'),
    body('reason')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be between 5 and 200 characters'),
    handleValidationErrors
  ]
};

// Report validation schemas
const reportValidation = {
  create: [
    body('reported_user_id')
      .isInt({ min: 1 })
      .withMessage('Reported user ID must be a positive integer'),
    body('reason')
      .isIn(['inappropriate_content', 'harassment', 'spam', 'fake_profile', 'other'])
      .withMessage('Invalid report reason'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    handleValidationErrors
  ]
};

// Utility functions
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially harmful characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

const isStrongPassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, message: 'File size too large. Maximum size is 5MB.' };
  }
  
  return { valid: true };
};

const validateAudioFile = (file) => {
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: 'Invalid file type. Only MP3, WAV, OGG, and M4A are allowed.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, message: 'File size too large. Maximum size is 10MB.' };
  }
  
  return { valid: true };
};

const validateVideoFile = (file) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: 'Invalid file type. Only MP4, WebM, OGG, and MOV are allowed.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, message: 'File size too large. Maximum size is 50MB.' };
  }
  
  return { valid: true };
};

module.exports = {
  handleValidationErrors,
  userValidation,
  messageValidation,
  coinValidation,
  adminValidation,
  reportValidation,
  sanitizeInput,
  isValidUUID,
  isValidEmail,
  isValidPhoneNumber,
  isStrongPassword,
  validateImageFile,
  validateAudioFile,
  validateVideoFile
};