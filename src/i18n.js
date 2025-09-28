// src/i18n.js

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files for all 7 languages from havana.languages.json
import translationID from './locales/id/translation.json'; // Indonesian (id)
import translationEN from './locales/en/translation.json'; // English (en)
import translationFR from './locales/fr/translation.json'; // French (fr)
import translationZH from './locales/zh/translation.json'; // Mandarin (zh)
import translationJA from './locales/ja/translation.json'; // Japanese (ja)
import translationKO from './locales/ko/translation.json'; // Korean (ko)
import translationRU from './locales/ru/translation.json'; // Russian (ru)


// Translation resources for all 7 languages
const resources = {
  // Indonesian
  id: {
    translation: translationID
  },
  // English
  en: {
    translation: translationEN
  },
  // French
  fr: {
    translation: translationFR
  },
  // Mandarin
  zh: {
    translation: translationZH
  },
  // Japanese
  ja: {
    translation: translationJA
  },
  // Korean
  ko: {
    translation: translationKO
  },
  // Russian
  ru: {
    translation: translationRU
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Set fallback to English as it's a common default
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already protects from XSS
    }
  });

export default i18n;