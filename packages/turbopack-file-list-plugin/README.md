# Turbopack File List Plugin

A plugin for Next.js that generates a comprehensive list of all files included in your build, compatible with both Turbopack and Webpack.

## Features

- Works with Next.js 14+ (both Turbopack and Webpack)
- Generates detailed JSON file with all build artifacts
- Categorizes files by type (build output, server, static)
- Provides statistics about the build
- Zero configuration required

## Installation

```bash
pnpm add turbopack-file-list-plugin
```

## Usage

### Method 1: Using the Next.js Plugin Wrapper (Webpack)

For webpack-based builds, use the plugin wrapper in your `next.config.js`:

```javascript
const { withFileListPlugin } = require('turbopack-file-list-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // your Next.js config
};

module.exports = withFileListPlugin(nextConfig, {
  outputPath: '.next/list.json', // optional, default: '.next/list.json'
});
```

### Method 2: Using the CLI (Recommended for Turbopack)

For Turbopack builds, add a post-build script to your `package.json`:

```json
{
  "scripts": {
    "build": "next build && pnpm generate-file-list",
    "generate-file-list": "node -r esbuild-register ./node_modules/turbopack-file-list-plugin/src/cli.ts"
  }
}
```

Or use the programmatic API directly in a custom build script.

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
