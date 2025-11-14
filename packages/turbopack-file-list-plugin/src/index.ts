import * as fs from 'fs';
import * as path from 'path';

export interface FileListPluginOptions {
  outputPath?: string;
  includeNodeModules?: boolean;
}

export class TurbopackFileListPlugin {
  private options: Required<FileListPluginOptions>;

  constructor(options: FileListPluginOptions = {}) {
    this.options = {
      outputPath: options.outputPath || 'build-files.json',
      includeNodeModules: options.includeNodeModules || false,
    };
  }

  // This method can be called from Next.js config
  apply() {
    return {
      options: this.options,
    };
  }
}

/**
 * Finds the monorepo root by looking for pnpm-workspace.yaml or package.json with workspaces
 */
function findMonorepoRoot(startDir: string): string {
  let currentDir = startDir;

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
      // Reached filesystem root, return original directory
      return startDir;
    }
    currentDir = parentDir;
  }
}

/**
 * Reads the tracked files from the temp file created by the file-tracker-loader
 */
function readTrackedFiles(buildDir: string): string[] {
  const tempFilePath = path.join(buildDir, '.turbopack-file-tracker.tmp');

  if (!fs.existsSync(tempFilePath)) {
    console.warn('Warning: .turbopack-file-tracker.tmp not found. Make sure the file-tracker-loader is configured.');
    return [];
  }

  try {
    const content = fs.readFileSync(tempFilePath, 'utf-8');
    const lines = content.split('\n').filter((line: string) => line.trim().length > 0);

    // Deduplicate using a Set (the loader may write the same file multiple times)
    const uniqueFiles = new Set<string>(lines);

    return Array.from(uniqueFiles);
  } catch (error) {
    console.warn('Warning: Could not read .turbopack-file-tracker.tmp:', error);
    return [];
  }
}

/**
 * Cleans up the temp file after processing
 */
function cleanupTempFile(buildDir: string): void {
  const tempFilePath = path.join(buildDir, '.turbopack-file-tracker.tmp');

  if (fs.existsSync(tempFilePath)) {
    try {
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.warn('Warning: Could not delete temp file:', error);
    }
  }
}

/**
 * Generates a file list from the Next.js build output
 */
export async function generateFileList(
  buildDir: string,
  outputPath: string,
  options: FileListPluginOptions = {}
): Promise<void> {
  const nextDir = path.join(buildDir, '.next');

  if (!fs.existsSync(nextDir)) {
    console.warn('Warning: .next directory not found. Skipping file list generation.');
    return;
  }

  console.log(`\nReading tracked files from build...`);

  const fileList: {
    buildTime: string;
    sourceFiles: string[];
    stats: {
      totalSourceFiles: number;
    };
  } = {
    buildTime: new Date().toISOString(),
    sourceFiles: [],
    stats: {
      totalSourceFiles: 0,
    },
  };

  // Read the tracked files from the temp file created by the loader
  const trackedFiles = readTrackedFiles(buildDir);

  // Sort the files for consistent output
  fileList.sourceFiles = trackedFiles.sort();
  fileList.stats.totalSourceFiles = fileList.sourceFiles.length;

  // Clean up the temp file
  cleanupTempFile(buildDir);

  // Write the file list to the specified output path
  const fullOutputPath = path.join(buildDir, outputPath);
  const outputDir = path.dirname(fullOutputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(fullOutputPath, JSON.stringify(fileList, null, 2));

  console.log(`\n✓ File list generated at: ${outputPath}`);
  console.log(`  Total source files tracked: ${fileList.stats.totalSourceFiles}`);
  console.log(`\nSample files included in build:`);

  // Show first 10 files as examples
  const sampleFiles = fileList.sourceFiles.slice(0, 10);
  sampleFiles.forEach((file) => console.log(`    ${file}`));

  if (fileList.sourceFiles.length > 10) {
    console.log(`    ... and ${fileList.sourceFiles.length - 10} more files\n`);
  } else {
    console.log('');
  }
}

/**
 * Creates a Next.js plugin wrapper for the file list generator
 */
export function withFileListPlugin(
  nextConfig: any = {},
  pluginOptions: FileListPluginOptions = {}
) {
  return {
    ...nextConfig,
    // Preserve existing webpack config if present
    webpack: (config: any, context: any) => {
      // Add webpack plugin if not using turbopack
      if (!context.dev && !context.isServer) {
        // Hook into the compilation finish
        config.plugins = config.plugins || [];

        class FileListWebpackPlugin {
          apply(compiler: any) {
            compiler.hooks.done.tap('FileListWebpackPlugin', () => {
              const buildDir = process.cwd();
              const outputPath = pluginOptions.outputPath || '.next/list.json';

              // Run file list generation after webpack is done
              setTimeout(() => {
                generateFileList(buildDir, outputPath, pluginOptions).catch(console.error);
              }, 100);
            });
          }
        }

        config.plugins.push(new FileListWebpackPlugin());
      }

      // Call original webpack config if it exists
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, context);
      }

      return config;
    },
  };
}

export default TurbopackFileListPlugin;

// Export the loader paths for easy reference in Next.js config
export const fileTrackerLoaderPath = require.resolve('./file-tracker-loader');
export const textExtractionLoaderPath = require.resolve('./text-extraction-loader');

// Export string extraction functions
export { consolidateStrings } from './strings-manager';
