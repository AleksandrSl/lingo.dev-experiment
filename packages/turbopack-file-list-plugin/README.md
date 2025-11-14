# Turbopack File List Plugin

A plugin for Next.js that tracks all source files processed during your build using a custom Turbopack loader. This approach eliminates the need for "magic" chunk name decoding and directly tracks what Turbopack actually processes.

## Features

- Works with Next.js 14+ with Turbopack
- Tracks source files via custom loader (no chunk name decoding!)
- Generates detailed JSON file with all source files used in the build
- Provides statistics about tracked files
- Minimal configuration required

## How It Works

1. **During Build**: A custom Turbopack loader (`file-tracker-loader`) is invoked for every source file. It records the file path to a temp file and returns the source unchanged.
2. **After Build**: The CLI/API reads the temp file, deduplicates entries, and generates the final JSON output.

This approach is transparent and doesn't rely on reverse-engineering Turbopack's internal naming conventions.

## Installation

```bash
pnpm add turbopack-file-list-plugin
```

## Usage

### Step 1: Configure Turbopack Loader

Add the file-tracker-loader to your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Turbopack to use the file-tracker-loader
  turbopack: {
    rules: {
      // Track all JavaScript/TypeScript source files
      '*.{js,jsx,ts,tsx}': {
        loaders: [
          {
            loader: 'turbopack-file-list-plugin/dist/file-tracker-loader',
          },
        ],
      },
      // Track CSS files separately
      '*.{css,scss,sass}': {
        loaders: [
          {
            loader: 'turbopack-file-list-plugin/dist/file-tracker-loader',
          },
        ],
      },
    },
  },
};

module.exports = nextConfig;
```

### Step 2: Add Post-Build Script

Add a post-build script to your `package.json`:

```json
{
  "scripts": {
    "build": "next build && pnpm generate-file-list",
    "generate-file-list": "turbopack-file-list-plugin"
  }
}
```

Or use the CLI binary directly:

```bash
npx turbopack-file-list-plugin
```

### Method 3: Programmatic API

```typescript
import { generateFileList } from 'turbopack-file-list-plugin';

await generateFileList(process.cwd(), '.next/list.json', {
  includeNodeModules: false,
});
```

## Output Format

The generated JSON file includes:

```json
{
  "buildTime": "2024-01-01T00:00:00.000Z",
  "files": {
    "buildOutput": ["static/chunks/..."],
    "static": ["favicon.ico", "..."],
    "server": ["app/page.js", "..."],
    "all": ["..."]
  },
  "stats": {
    "totalFiles": 150,
    "buildOutputFiles": 50,
    "staticFiles": 10,
    "serverFiles": 90
  }
}
```

## Options

- `outputPath`: Path where the file list JSON will be written (default: `.next/list.json`)
- `includeNodeModules`: Whether to include node_modules in the scan (default: `false`)

## License

MIT
