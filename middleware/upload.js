const multer = require('multer');
const path = require('path');
const { validateImageFile, validateAudioFile, validateVideoFile } = require('../utils/validation');

// Configure storage
const storage = multer.memoryStorage(); // Store files in memory for cloud upload

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    let validation;
    
    // Determine file type and validate accordingly
    if (file.mimetype.startsWith('image/')) {
      validation = validateImageFile(file);
    } else if (file.mimetype.startsWith('audio/')) {
      validation = validateAudioFile(file);
    } else if (file.mimetype.startsWith('video/')) {
      validation = validateVideoFile(file);
    } else {
      return cb(new Error('Invalid file type'), false);
    }

    if (!validation.valid) {
      return cb(new Error(validation.message), false);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 5, // Maximum 5 files per request
    fields: 10, // Maximum 10 non-file fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024 // Maximum field value size (1MB)
  }
});

// Error handler for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 50MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 5 files per request.'
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many fields in the request.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  }
  
  if (error.message.includes('Invalid file type') || 
      error.message.includes('File size too large')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Middleware for single file upload
const uploadSingle = (fieldName) => {
  return [
    upload.single(fieldName),
    handleMulterError
  ];
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return [
    upload.array(fieldName, maxCount),
    handleMulterError
  ];
};

// Middleware for mixed file upload (different field names)
const uploadFields = (fields) => {
  return [
    upload.fields(fields),
    handleMulterError
  ];
};

// Middleware for profile image upload
const uploadProfileImage = uploadSingle('profileImage');

// Middleware for message media upload
const uploadMessageMedia = uploadSingle('media');

// Middleware for multiple message attachments
const uploadMessageAttachments = uploadMultiple('attachments', 3);

// Middleware for voice message
const uploadVoiceMessage = uploadSingle('voice');

// Middleware for video message
const uploadVideoMessage = uploadSingle('video');

// Middleware for chat media (mixed types)
const uploadChatMedia = uploadFields([
  { name: 'images', maxCount: 3 },
  { name: 'voice', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadProfileImage,
  uploadMessageMedia,
  uploadMessageAttachments,
  uploadVoiceMessage,
  uploadVideoMessage,
  uploadChatMedia,
  handleMulterError
};