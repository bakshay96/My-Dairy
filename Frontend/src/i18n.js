// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslation from './locales/en/translation.json';
import mrTranslation from './locales/mr/translation.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    mr: { translation: mrTranslation },
  },
  lng: 'en', // Default language
  fallbackLng: 'en', // Fallback language if translation is not available
  interpolation: {
    escapeValue: false, // React already escapes by default
  },
});

export default i18n;
