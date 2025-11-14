/**
 * Runtime module for text translation function
 * This module is imported by transformed JSX/TSX files
 */

// In-memory store for strings
let stringsData: Record<string, any> = {};
let isLoaded = false;

/**
 * Loads the extracted strings from the file system (server-side only)
 */
function loadStrings(): void {
  if (isLoaded || typeof window !== 'undefined') {
    return;
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const stringsPath = path.join(process.cwd(), '.next', 'extracted-strings.js');

    if (fs.existsSync(stringsPath)) {
      const content = fs.readFileSync(stringsPath, 'utf-8');

      // Extract the strings object from the module exports
      // The file has: const strings = {...}; module.exports = strings;
      const match = content.match(/const strings = ({[\s\S]*?});/);
      if (match) {
        stringsData = JSON.parse(match[1]);
        isLoaded = true;
      }
    }
  } catch (error) {
    // Strings file doesn't exist yet during build - that's ok
  }
}

/**
 * Translation function that looks up text by hash
 */
export function t(hash: string): string {
  // Try to load strings on first use
  if (!isLoaded && typeof window === 'undefined') {
    loadStrings();
  }

  const entry = stringsData[hash];

  if (!entry) {
    // During build, return a placeholder
    return `[${hash.substring(0, 8)}]`;
  }

  return entry.text || entry;
}

export default t;
