# Turbopack File List Monorepo

A monorepo demonstrating a Next.js app with Turbopack and a custom plugin that generates a comprehensive list of all files used in the build.

## Project Structure

```
.
├── apps/
│   └── web/              # Next.js application
│       ├── src/
│       │   └── app/      # Next.js app directory
│       └── .next/        # Build output (including list.json)
├── packages/
│   └── turbopack-file-list-plugin/  # Custom build plugin
└── package.json          # Workspace root
```

## Features

- **Monorepo Setup**: Uses pnpm workspaces for efficient package management
- **Next.js 15**: Latest Next.js with Turbopack support
- **Custom Build Plugin**: Generates `list.json` with all build files
- **TypeScript**: Full TypeScript support across the monorepo
- **Build Analytics**: Detailed categorization of build artifacts

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies for all packages
pnpm install

# Build the plugin
pnpm --filter turbopack-file-list-plugin build
```

### Development

```bash
# Start the Next.js dev server with Turbopack
pnpm dev

# Or run from the web app directory
pnpm --filter web dev
```

### Production Build

```bash
# Build the Next.js app and generate file list
pnpm build

# Or run from the web app directory
pnpm --filter web build
```

After building, check `apps/web/.next/list.json` for the complete file list.

## How It Works

### The Plugin

The `turbopack-file-list-plugin` package provides:

1. **Next.js Plugin Wrapper** (`withFileListPlugin`): Works with webpack builds
2. **CLI Tool**: Generates file list post-build for Turbopack
3. **Programmatic API** (`generateFileList`): Can be used in custom scripts

### Build Process

1. Next.js builds the application using Turbopack
2. After build completes, the CLI tool scans the `.next` directory
3. Files are categorized into:
   - **buildOutput**: Static chunks, CSS, and client bundles
   - **server**: Server-side components and middleware
   - **static**: Public static files
4. A JSON file is generated with the complete file list and statistics

### Output Format

```json
{
  "buildTime": "2024-01-01T00:00:00.000Z",
  "files": {
    "buildOutput": ["static/chunks/..."],
    "static": ["favicon.ico"],
    "server": ["app/page.js"],
    "all": ["...all files..."]
  },
  "stats": {
    "totalFiles": 80,
    "buildOutputFiles": 15,
    "staticFiles": 0,
    "serverFiles": 34
  }
}
```

## Customization

### Change Output Path

Edit `apps/web/next.config.js`:

```javascript
module.exports = withFileListPlugin(nextConfig, {
  outputPath: 'custom/path/files.json',
});
```

And update the postbuild script in `apps/web/package.json`:

```json
{
  "scripts": {
    "postbuild": "tsx ../../packages/turbopack-file-list-plugin/src/cli.ts custom/path/files.json"
  }
}
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Turbopack Documentation](https://turbo.build/pack/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## License

MIT
