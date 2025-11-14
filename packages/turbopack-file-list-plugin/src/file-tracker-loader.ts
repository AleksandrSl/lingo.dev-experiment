import * as fs from 'fs';
import * as path from 'path';

/**
 * A simple Turbopack/Webpack loader that tracks which files are processed during the build.
 * This loader is invoked for every source file and appends the file path to a temp file.
 *
 * The temp file is later read during post-build to generate the final file list.
 *
 * This approach eliminates the need to "decode" chunk filenames - we directly track
 * what Turbopack actually processes.
 */
export default function fileTrackerLoader(this: any, source: string): string {
  // Get the absolute path of the file being processed
  const resourcePath = this.resourcePath;

  if (!resourcePath) {
    // If resourcePath is not available, just return the source unchanged
    return source;
  }

  try {
    // Find the monorepo root (where pnpm-workspace.yaml exists)
    const monorepoRoot = findMonorepoRoot(resourcePath);

    // Convert absolute path to relative path from monorepo root
    const relativePath = path.relative(monorepoRoot, resourcePath);

    // Don't track node_modules files
    if (relativePath.includes('node_modules')) {
      return source;
    }

    // Determine temp file location
    // We write to the project root to avoid cleanup by Next.js
    const tempFilePath = getTempFilePath(resourcePath);

    // Append the relative file path to the temp file (one per line)
    // Using appendFileSync is simple but not perfectly atomic - we'll dedupe in post-processing
    fs.appendFileSync(tempFilePath, relativePath + '\n', 'utf-8');
  } catch (error) {
    // Don't fail the build if tracking fails - just log a warning
    console.warn('[file-tracker-loader] Warning: Could not track file:', resourcePath, error);
  }

  // Return the source unchanged - this loader is purely for tracking
  return source;
}

/**
 * Finds the monorepo root by looking for pnpm-workspace.yaml or package.json with workspaces
 */
function findMonorepoRoot(startPath: string): string {
  let currentDir = path.dirname(startPath);

  while (true) {
    // Check for pnpm-workspace.yaml
    if (fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
      return currentDir;
    }

    // Check for package.json with workspaces field
    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.workspaces) {
          return currentDir;
        }
      } catch (error) {
        // Continue searching
      }
    }

    // Move to parent directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root, return the directory containing the file
      return path.dirname(startPath);
    }
    currentDir = parentDir;
  }
}

/**
 * Gets the temp file path where we'll write tracked files
 */
function getTempFilePath(resourcePath: string): string {
  // Find the Next.js project directory (where .next would be)
  // We prioritize finding next.config.js since that's the definitive marker
  let currentDir = path.dirname(resourcePath);

  // First pass: Look for next.config.js/ts (most reliable)
  let searchDir = currentDir;
  while (true) {
    const hasNextConfig =
      fs.existsSync(path.join(searchDir, 'next.config.js')) ||
      fs.existsSync(path.join(searchDir, 'next.config.ts')) ||
      fs.existsSync(path.join(searchDir, 'next.config.mjs'));

    if (hasNextConfig) {
      // Write to project root instead of .next to avoid cleanup
      return path.join(searchDir, '.turbopack-file-tracker.tmp');
    }

    const parentDir = path.dirname(searchDir);
    if (parentDir === searchDir) {
      break;
    }
    searchDir = parentDir;
  }

  // Fallback: use the current working directory
  return path.join(process.cwd(), '.turbopack-file-tracker.tmp');
}
