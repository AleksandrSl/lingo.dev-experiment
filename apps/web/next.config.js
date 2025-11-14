const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js configuration here
  // Turbopack is now the default in Next.js 16
  // File list generation happens via postbuild script

  // Configure Turbopack to use the loaders
  turbopack: {
    rules: {
      // Track all JavaScript/TypeScript source files and extract text from JSX/TSX
      '*.{js,jsx,ts,tsx}': {
        loaders: [
          require.resolve('turbopack-file-list-plugin/dist/file-tracker-loader'),
          require.resolve('turbopack-file-list-plugin/dist/text-extraction-loader')
        ],
      },
    },
  },
};

module.exports = nextConfig;
