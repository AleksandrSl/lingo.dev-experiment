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
 * Recursively collects all files in a directory
 */
function collectFiles(dir: string, fileList: string[] = [], baseDir: string = dir): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      collectFiles(filePath, fileList, baseDir);
    } else {
      const relativePath = path.relative(baseDir, filePath);
      fileList.push(relativePath);
    }
  });

  return fileList;
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

  const fileList: {
    buildTime: string;
    files: {
      buildOutput: string[];
      static: string[];
      server: string[];
      all: string[];
    };
    stats: {
      totalFiles: number;
      buildOutputFiles: number;
      staticFiles: number;
      serverFiles: number;
    };
  } = {
    buildTime: new Date().toISOString(),
    files: {
      buildOutput: [],
      static: [],
      server: [],
      all: [],
    },
    stats: {
      totalFiles: 0,
      buildOutputFiles: 0,
      staticFiles: 0,
      serverFiles: 0,
    },
  };

  // Collect build output files
  const staticDir = path.join(nextDir, 'static');
  if (fs.existsSync(staticDir)) {
    fileList.files.buildOutput = collectFiles(staticDir);
    fileList.stats.buildOutputFiles = fileList.files.buildOutput.length;
  }

  // Collect server files
  const serverDir = path.join(nextDir, 'server');
  if (fs.existsSync(serverDir)) {
    fileList.files.server = collectFiles(serverDir);
    fileList.stats.serverFiles = fileList.files.server.length;
  }

  // Collect static files from public directory
  const publicDir = path.join(buildDir, 'public');
  if (fs.existsSync(publicDir)) {
    fileList.files.static = collectFiles(publicDir);
    fileList.stats.staticFiles = fileList.files.static.length;
  }

  // Collect all .next files
  fileList.files.all = collectFiles(nextDir);

  fileList.stats.totalFiles = fileList.files.all.length;

  // Write the file list to the specified output path
  const fullOutputPath = path.join(buildDir, outputPath);
  const outputDir = path.dirname(fullOutputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(fullOutputPath, JSON.stringify(fileList, null, 2));

  console.log(`\n✓ File list generated at: ${outputPath}`);
  console.log(`  Total files tracked: ${fileList.stats.totalFiles}`);
  console.log(`  Build output files: ${fileList.stats.buildOutputFiles}`);
  console.log(`  Server files: ${fileList.stats.serverFiles}`);
  console.log(`  Static files: ${fileList.stats.staticFiles}\n`);
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
