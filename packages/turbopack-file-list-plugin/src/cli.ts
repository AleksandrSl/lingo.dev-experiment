#!/usr/bin/env node

import { generateFileList } from './index';

const buildDir = process.cwd();
const outputPath = process.argv[2] || '.next/list.json';

console.log('Generating file list from Next.js build...');

generateFileList(buildDir, outputPath)
  .then(() => {
    console.log('File list generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error generating file list:', error);
    process.exit(1);
  });
