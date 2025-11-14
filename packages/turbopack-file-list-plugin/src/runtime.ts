/**
 * Runtime module for text translation function with locale support
 * This module is imported by transformed JSX/TSX files
 */

// Import the strings data - this gets populated during the build process
import { stringsData } from './strings-data';

export type Locale = 'en' | 'ru' | 'pseudo';

// Current locale (can be set from outside)
let currentLocale: Locale = 'en';

/**
 * Sets the current locale for server-side rendering
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Gets the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Translation function that looks up text by hash with locale support
 */
export function t(hash: string, locale?: Locale): string {
  const entry = stringsData[hash];

  if (!entry) {
    // During build or if string not found, return a placeholder
    return `[${hash.substring(0, 8)}]`;
  }

  // Use provided locale or current locale
  const targetLocale = locale || currentLocale;

  // If entry has translations, use them
  if (entry.translations) {
    const translation = entry.translations[targetLocale];

    // Fall back to English if translation is empty
    if (!translation || translation === '') {
      return entry.translations.en || entry.text;
    }

    return translation;
  }

  // Legacy format support
  return entry.text || entry;
}

export default t;
