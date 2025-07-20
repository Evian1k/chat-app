const { Translate } = require('@google-cloud/translate').v2;
const logger = require('../utils/logger');

// Initialize Google Translate client
let translateClient;

try {
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    translateClient = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY
    });
  } else {
    logger.warn('Google Translate API key not provided. Translation features will be disabled.');
  }
} catch (error) {
  logger.error('Failed to initialize Google Translate client:', error);
}

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr', 'de')
 * @param {string} sourceLanguage - Source language code (optional, auto-detect if not provided)
 * @returns {string|null} - Translated text or null if translation fails
 */
async function translateText(text, targetLanguage, sourceLanguage = null) {
  if (!translateClient) {
    logger.warn('Translation service not available');
    return null;
  }

  if (!text || !targetLanguage) {
    return null;
  }

  try {
    const options = {
      to: targetLanguage
    };

    if (sourceLanguage) {
      options.from = sourceLanguage;
    }

    const [translation] = await translateClient.translate(text, options);
    
    logger.debug(`Translated "${text}" to "${translation}" (${targetLanguage})`);
    return translation;

  } catch (error) {
    logger.error('Translation error:', error);
    return null;
  }
}

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {object|null} - Language detection result or null if detection fails
 */
async function detectLanguage(text) {
  if (!translateClient) {
    logger.warn('Translation service not available');
    return null;
  }

  if (!text) {
    return null;
  }

  try {
    const [detection] = await translateClient.detect(text);
    
    return {
      language: detection.language,
      confidence: detection.confidence
    };

  } catch (error) {
    logger.error('Language detection error:', error);
    return null;
  }
}

/**
 * Get supported languages
 * @returns {Array|null} - Array of supported languages or null if request fails
 */
async function getSupportedLanguages() {
  if (!translateClient) {
    logger.warn('Translation service not available');
    return null;
  }

  try {
    const [languages] = await translateClient.getLanguages();
    return languages;

  } catch (error) {
    logger.error('Error getting supported languages:', error);
    return null;
  }
}

/**
 * Batch translate multiple texts
 * @param {Array} texts - Array of texts to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Array|null} - Array of translated texts or null if translation fails
 */
async function translateBatch(texts, targetLanguage, sourceLanguage = null) {
  if (!translateClient) {
    logger.warn('Translation service not available');
    return null;
  }

  if (!texts || !Array.isArray(texts) || !targetLanguage) {
    return null;
  }

  try {
    const options = {
      to: targetLanguage
    };

    if (sourceLanguage) {
      options.from = sourceLanguage;
    }

    const [translations] = await translateClient.translate(texts, options);
    
    logger.debug(`Batch translated ${texts.length} texts to ${targetLanguage}`);
    return Array.isArray(translations) ? translations : [translations];

  } catch (error) {
    logger.error('Batch translation error:', error);
    return null;
  }
}

/**
 * Check if translation is needed
 * @param {string} sourceLanguage - Source language code
 * @param {string} targetLanguage - Target language code
 * @returns {boolean} - Whether translation is needed
 */
function isTranslationNeeded(sourceLanguage, targetLanguage) {
  if (!sourceLanguage || !targetLanguage) {
    return false;
  }

  // Normalize language codes (remove region codes)
  const normalizeLanguage = (lang) => lang.toLowerCase().split('-')[0];
  
  return normalizeLanguage(sourceLanguage) !== normalizeLanguage(targetLanguage);
}

/**
 * Get popular language codes with names
 * @returns {Array} - Array of popular languages
 */
function getPopularLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'tr', name: 'Turkish' },
    { code: 'pl', name: 'Polish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'cs', name: 'Czech' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'ro', name: 'Romanian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'et', name: 'Estonian' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'be', name: 'Belarusian' },
    { code: 'ka', name: 'Georgian' },
    { code: 'am', name: 'Amharic' },
    { code: 'sw', name: 'Swahili' },
    { code: 'ms', name: 'Malay' },
    { code: 'id', name: 'Indonesian' },
    { code: 'tl', name: 'Filipino' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ur', name: 'Urdu' },
    { code: 'fa', name: 'Persian' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'mr', name: 'Marathi' },
    { code: 'pa', name: 'Punjabi' }
  ];
}

/**
 * Validate language code
 * @param {string} languageCode - Language code to validate
 * @returns {boolean} - Whether the language code is valid
 */
function isValidLanguageCode(languageCode) {
  if (!languageCode || typeof languageCode !== 'string') {
    return false;
  }

  const popularLanguages = getPopularLanguages();
  return popularLanguages.some(lang => lang.code === languageCode.toLowerCase());
}

/**
 * Smart translate - only translate if needed and cache results
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} userPreferredLanguage - User's preferred language
 * @returns {object} - Translation result with metadata
 */
async function smartTranslate(text, targetLanguage, userPreferredLanguage = 'en') {
  if (!text || !targetLanguage) {
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: null,
      targetLanguage: targetLanguage,
      wasTranslated: false,
      confidence: null
    };
  }

  try {
    // Detect source language
    const detection = await detectLanguage(text);
    const sourceLanguage = detection ? detection.language : null;

    // Check if translation is needed
    if (!isTranslationNeeded(sourceLanguage, targetLanguage)) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        wasTranslated: false,
        confidence: detection ? detection.confidence : null
      };
    }

    // Perform translation
    const translatedText = await translateText(text, targetLanguage, sourceLanguage);

    return {
      originalText: text,
      translatedText: translatedText || text,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      wasTranslated: !!translatedText,
      confidence: detection ? detection.confidence : null
    };

  } catch (error) {
    logger.error('Smart translation error:', error);
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: null,
      targetLanguage: targetLanguage,
      wasTranslated: false,
      confidence: null,
      error: error.message
    };
  }
}

module.exports = {
  translateText,
  detectLanguage,
  getSupportedLanguages,
  translateBatch,
  isTranslationNeeded,
  getPopularLanguages,
  isValidLanguageCode,
  smartTranslate
};