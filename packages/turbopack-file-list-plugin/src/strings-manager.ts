import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { pseudolocalize } from './pseudolocalize';

export type Locale = 'en' | 'ru' | 'pseudo';

export interface ExtractedString {
  text: string;
  hash: string;
  translations: {
    en: string;
    ru: string;
    pseudo: string;
  };
  context: {
    file: string;
    component: string;
    path: string; // JSX path like "main > h1" or "main > p:nth-child(2)"
  };
}

export interface StringsDatabase {
  [hash: string]: ExtractedString;
}

/**
 * Generates a hash from text and context
 */
export function generateHash(text: string, context: string): string {
  const combined = `${text}|${context}`;
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
}

/**
 * Gets the path to the strings database file
 */
export function getStringsFilePath(projectRoot: string): string {
  return path.join(projectRoot, '.next', 'extracted-strings.js');
}

/**
 * Reads the existing strings database
 */
export function readStringsDatabase(projectRoot: string): StringsDatabase {
  const filePath = getStringsFilePath(projectRoot);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    // Read the JS file and extract the data
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract the JSON from the module.exports statement
    const match = content.match(/module\.exports\s*=\s*({[\s\S]*});/);
    if (match) {
      return JSON.parse(match[1]);
    }

    return {};
  } catch (error) {
    console.warn('[strings-manager] Warning: Could not read strings database:', error);
    return {};
  }
}

/**
 * Writes the strings database to a JS file
 */
export function writeStringsDatabase(projectRoot: string, database: StringsDatabase): void {
  const filePath = getStringsFilePath(projectRoot);
  const dir = path.dirname(filePath);

  // Ensure the directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Generate the JS file content
  const content = `/**
 * Extracted strings database
 * Generated automatically by text-extraction-loader
 * DO NOT EDIT MANUALLY
 */

const strings = ${JSON.stringify(database, null, 2)};

module.exports = strings;

/**
 * Runtime function to get text by hash with locale support
 * @param {string} hash - The hash of the string
 * @param {string} locale - The locale to use (en, ru, pseudo)
 * @returns {string} The translated text
 */
function t(hash, locale = 'en') {
  const entry = strings[hash];
  if (!entry) {
    console.warn(\`[t] String not found for hash: \${hash}\`);
    return \`[missing: \${hash}]\`;
  }

  // Return the translation for the specified locale
  const translation = entry.translations[locale];

  // Fall back to English if translation is empty
  if (!translation || translation === '') {
    return entry.translations.en || entry.text;
  }

  return translation;
}

// Also export the t function
module.exports.t = t;
`;

  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Adds a new extracted string to the database
 * This is called from the loader during build
 */
export function addExtractedString(
  projectRoot: string,
  text: string,
  file: string,
  component: string,
  jsxPath: string
): string {
  // Generate context string
  const contextStr = `${file}:${component}:${jsxPath}`;

  // Generate hash
  const hash = generateHash(text, contextStr);

  // Read existing database
  const database = readStringsDatabase(projectRoot);

  // Add new entry (or update if hash collision)
  database[hash] = {
    text,
    hash,
    translations: {
      en: text,
      ru: '',
      pseudo: pseudolocalize(text),
    },
    context: {
      file,
      component,
      path: jsxPath,
    },
  };

  // Write updated database
  writeStringsDatabase(projectRoot, database);

  return hash;
}

/**
 * Gets the temp file path for incremental string updates during build
 */
export function getTempStringsPath(projectRoot: string): string {
  return path.join(projectRoot, '.text-extraction.tmp');
}

/**
 * Appends an extracted string to the temp file (for batch processing)
 */
export function appendToTempStrings(
  projectRoot: string,
  text: string,
  file: string,
  component: string,
  jsxPath: string
): string {
  const contextStr = `${file}:${component}:${jsxPath}`;
  const hash = generateHash(text, contextStr);

  const entry: ExtractedString = {
    text,
    hash,
    translations: {
      en: text, // Original text is English
      ru: '', // Empty, to be filled later
      pseudo: pseudolocalize(text), // Auto-generate pseudolocalization
    },
    context: {
      file,
      component,
      path: jsxPath,
    },
  };

  const tempPath = getTempStringsPath(projectRoot);

  // Append as JSON line
  fs.appendFileSync(tempPath, JSON.stringify(entry) + '\n', 'utf-8');

  return hash;
}

/**
 * Processes the temp file and generates the final strings database
 */
export function consolidateStrings(projectRoot: string): void {
  const tempPath = getTempStringsPath(projectRoot);

  if (!fs.existsSync(tempPath)) {
    console.warn('[strings-manager] No temp strings file found');
    return;
  }

  // Read existing database to preserve manual translations
  const existingDatabase = readStringsDatabase(projectRoot);
  const database: StringsDatabase = {};

  try {
    const content = fs.readFileSync(tempPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const entry: ExtractedString = JSON.parse(line);

        // If this hash exists in the old database, preserve manual translations
        const existing = existingDatabase[entry.hash];
        if (existing && existing.translations) {
          // Preserve non-empty Russian translations
          if (existing.translations.ru && existing.translations.ru !== '') {
            entry.translations.ru = existing.translations.ru;
          }
        }

        database[entry.hash] = entry;
      } catch (error) {
        console.warn('[strings-manager] Failed to parse line:', line);
      }
    }

    // Write the consolidated database
    writeStringsDatabase(projectRoot, database);

    // Clean up temp file
    fs.unlinkSync(tempPath);

    console.log(`\n✓ Extracted ${Object.keys(database).length} unique strings`);
    console.log(`  Strings file: .next/extracted-strings.js\n`);
  } catch (error) {
    console.error('[strings-manager] Error consolidating strings:', error);
  }
}
