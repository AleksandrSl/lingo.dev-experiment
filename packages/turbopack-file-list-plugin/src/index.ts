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
 * Decodes a Turbopack chunk filename to extract the original source file path
 * Example: "apps_web_src_app_layout_tsx_a4dff4b0._.js" -> "apps/web/src/app/layout.tsx"
 */
function decodeChunkFilename(chunkName: string): string | null {
  // Remove the hash suffix and extension
  // Example: apps_web_src_app_layout_tsx_a4dff4b0._.js -> apps_web_src_app_layout_tsx
  const withoutExt = chunkName.replace(/\.[^.]+$/, '');  // Remove .js
  const withoutUnderscore = withoutExt.replace(/\._$/, '');  // Remove ._
  let withoutHash = withoutUnderscore.replace(/_[a-f0-9]{8}$/, '');  // Remove _a4dff4b0

  // Convert underscores to path separators and add proper extension
  // Detect the file type from the pattern
  let ext = '';
  if (withoutHash.endsWith('_tsx')) {
    ext = '.tsx';
    withoutHash = withoutHash.slice(0, -4);
  } else if (withoutHash.endsWith('_ts')) {
    ext = '.ts';
    withoutHash = withoutHash.slice(0, -3);
  } else if (withoutHash.endsWith('_jsx')) {
    ext = '.jsx';
    withoutHash = withoutHash.slice(0, -4);
  } else if (withoutHash.endsWith('_js')) {
    ext = '.js';
    withoutHash = withoutHash.slice(0, -3);
  } else if (withoutHash.endsWith('_css')) {
    ext = '.css';
    withoutHash = withoutHash.slice(0, -4);
  }

  if (!ext) {
    return null;
  }

  // Convert underscores to path separators
  const sourcePath = withoutHash.replace(/_/g, '/') + ext;

  return sourcePath;
}

/**
 * Extracts source files from Next.js build trace files
 */
function extractSourceFilesFromTrace(traceFile: string, projectRoot: string): string[] {
  const sourceFiles = new Set<string>();

  try {
    const traceData = JSON.parse(fs.readFileSync(traceFile, 'utf-8'));
    const traceDir = path.dirname(traceFile);

    // Trace files contain a list of all files that were accessed during the build
    if (traceData.files && Array.isArray(traceData.files)) {
      traceData.files.forEach((relativeFilePath: string) => {
        // Check if this is a chunk file that encodes a source file path
        const fileName = path.basename(relativeFilePath);

        // Look for chunk files in the ssr directory
        if (relativeFilePath.includes('chunks/ssr/') && fileName.includes('_')) {
          const decodedPath = decodeChunkFilename(fileName);
          if (decodedPath) {
            // Verify the file actually exists
            const fullPath = path.join(projectRoot, decodedPath);
            if (fs.existsSync(fullPath)) {
              sourceFiles.add(decodedPath);
            }
          }
        }
      });
    }
  } catch (error) {
    console.warn(`Warning: Could not parse trace file ${traceFile}:`, error);
  }

  return Array.from(sourceFiles);
}

/**
 * Collects all trace files from the .next directory
 */
function collectTraceFiles(nextDir: string): string[] {
  const traceFiles: string[] = [];

  if (!fs.existsSync(nextDir)) {
    return traceFiles;
  }

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip cache directory to avoid unnecessary processing
        if (entry.name !== 'cache') {
          walk(fullPath);
        }
      } else if (entry.name.endsWith('.nft.json')) {
        traceFiles.push(fullPath);
      }
    }
  }

  walk(nextDir);
  return traceFiles;
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

  // Find the monorepo root for resolving source file paths
  const monorepoRoot = findMonorepoRoot(buildDir);
  console.log(`Using monorepo root: ${monorepoRoot}`);

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

  // Collect all trace files from the .next directory
  const traceFiles = collectTraceFiles(nextDir);

  console.log(`\nFound ${traceFiles.length} trace files to analyze...`);

  // Extract source files from all trace files
  const allSourceFiles = new Set<string>();

  for (const traceFile of traceFiles) {
    const sourceFiles = extractSourceFilesFromTrace(traceFile, monorepoRoot);
    sourceFiles.forEach((file) => allSourceFiles.add(file));
  }

  // Convert Set to sorted array
  fileList.sourceFiles = Array.from(allSourceFiles).sort();
  fileList.stats.totalSourceFiles = fileList.sourceFiles.length;

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
