#!/usr/bin/env node

import { generateFileList, consolidateStrings } from './index';

const buildDir = process.cwd();
const outputPath = process.argv[2] || '.next/list.json';

console.log('Generating file list from Next.js build...');

generateFileList(buildDir, outputPath)
  .then(() => {
    console.log('File list generation complete!');

    // Also consolidate extracted strings
    console.log('\nConsolidating extracted strings...');
    consolidateStrings(buildDir);

    process.exit(0);
  })
  .catch((error) => {
    console.error('Error generating file list:', error);
    process.exit(1);
  });
