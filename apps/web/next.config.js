const { withFileListPlugin } = require('turbopack-file-list-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js configuration here
};

module.exports = withFileListPlugin(nextConfig, {
  outputPath: '.next/list.json',
});
