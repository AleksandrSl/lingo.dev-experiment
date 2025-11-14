import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { appendToTempStrings } from './strings-manager';

/**
 * Finds the monorepo root by looking for pnpm-workspace.yaml or package.json with workspaces
 */
function findMonorepoRoot(startPath: string): string {
  let currentDir = path.dirname(startPath);

  while (true) {
    if (fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
      return currentDir;
    }

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

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return path.dirname(startPath);
    }
    currentDir = parentDir;
  }
}

/**
 * Gets the project root (where Next.js is configured)
 */
function getProjectRoot(resourcePath: string): string {
  let searchDir = path.dirname(resourcePath);

  while (true) {
    const hasNextConfig =
      fs.existsSync(path.join(searchDir, 'next.config.js')) ||
      fs.existsSync(path.join(searchDir, 'next.config.ts')) ||
      fs.existsSync(path.join(searchDir, 'next.config.mjs'));

    if (hasNextConfig) {
      return searchDir;
    }

    const parentDir = path.dirname(searchDir);
    if (parentDir === searchDir) {
      return process.cwd();
    }
    searchDir = parentDir;
  }
}

/**
 * Extracts the component name from the AST
 */
function findComponentName(ast: t.File): string {
  let componentName = 'default';

  traverse(ast, {
    // Function declaration: function MyComponent() {}
    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      if (path.node.id && t.isIdentifier(path.node.id)) {
        const body = path.node.body.body;
        // Check if it returns JSX
        const hasJSXReturn = body.some(
          (statement: t.Statement) =>
            t.isReturnStatement(statement) &&
            statement.argument &&
            (t.isJSXElement(statement.argument) || t.isJSXFragment(statement.argument))
        );
        if (hasJSXReturn) {
          componentName = path.node.id.name;
          path.stop();
        }
      }
    },
    // Arrow function or function expression: const MyComponent = () => {}
    VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
      if (
        t.isIdentifier(path.node.id) &&
        (t.isArrowFunctionExpression(path.node.init) ||
          t.isFunctionExpression(path.node.init))
      ) {
        const init = path.node.init;
        // Check if it returns JSX
        if (t.isBlockStatement(init.body)) {
          const hasJSXReturn = init.body.body.some(
            (statement: t.Statement) =>
              t.isReturnStatement(statement) &&
              statement.argument &&
              (t.isJSXElement(statement.argument) || t.isJSXFragment(statement.argument))
          );
          if (hasJSXReturn) {
            componentName = path.node.id.name;
            path.stop();
          }
        } else if (t.isJSXElement(init.body) || t.isJSXFragment(init.body)) {
          componentName = path.node.id.name;
          path.stop();
        }
      }
    },
    // Export default
    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
      if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
        componentName = path.node.declaration.id.name;
      } else if (t.isIdentifier(path.node.declaration)) {
        componentName = path.node.declaration.name;
      }
    },
  });

  return componentName;
}

/**
 * Builds a JSX path for the current element
 */
function buildJSXPath(path: NodePath<any>): string {
  const pathSegments: string[] = [];
  let currentPath: NodePath<any> | null = path;

  while (currentPath) {
    if (t.isJSXElement(currentPath.node)) {
      const openingElement = currentPath.node.openingElement;
      if (t.isJSXIdentifier(openingElement.name)) {
        const tagName = openingElement.name.name;

        // Find the index among siblings with the same tag name
        if (currentPath.parent && t.isJSXElement(currentPath.parent)) {
          const siblings = currentPath.parent.children.filter((child: any) =>
            t.isJSXElement(child)
          );
          const sameTagSiblings = siblings.filter(
            (sibling: any) =>
              t.isJSXElement(sibling) &&
              t.isJSXIdentifier(sibling.openingElement.name) &&
              sibling.openingElement.name.name === tagName
          );

          if (sameTagSiblings.length > 1) {
            const index = sameTagSiblings.indexOf(currentPath.node);
            pathSegments.unshift(`${tagName}:nth-child(${index + 1})`);
          } else {
            pathSegments.unshift(tagName);
          }
        } else {
          pathSegments.unshift(tagName);
        }
      }
    }

    currentPath = currentPath.parentPath;
  }

  return pathSegments.join(' > ') || 'root';
}

/**
 * Checks if text is meaningful (not just whitespace)
 */
function isMeaningfulText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed !== '\n';
}

/**
 * The main text extraction loader
 */
export default function textExtractionLoader(this: any, source: string): string {
  const resourcePath = this.resourcePath;

  if (!resourcePath) {
    return source;
  }

  // Only process JSX/TSX files
  if (!/\.(jsx|tsx)$/.test(resourcePath)) {
    return source;
  }

  // Don't process node_modules
  if (resourcePath.includes('node_modules')) {
    return source;
  }

  try {
    const monorepoRoot = findMonorepoRoot(resourcePath);
    const projectRoot = getProjectRoot(resourcePath);
    const relativeFilePath = path.relative(monorepoRoot, resourcePath);

    // Parse the source code
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    // Find the component name
    const componentName = findComponentName(ast);

    // Check if the component uses useLocale and extracts locale variable
    let hasLocaleVariable = false;
    traverse(ast, {
      VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
        // Check for: const { locale } = useLocale()
        if (
          t.isObjectPattern(path.node.id) &&
          t.isCallExpression(path.node.init) &&
          t.isIdentifier(path.node.init.callee) &&
          path.node.init.callee.name === 'useLocale'
        ) {
          // Check if 'locale' is one of the destructured properties
          const hasLocale = path.node.id.properties.some(
            (prop) =>
              t.isObjectProperty(prop) &&
              t.isIdentifier(prop.key) &&
              prop.key.name === 'locale'
          );
          if (hasLocale) {
            hasLocaleVariable = true;
            path.stop();
          }
        }
      },
    });

    // Track if we made any changes
    let hasChanges = false;

    // Traverse and transform JSX text nodes
    traverse(ast, {
      JSXText(path: NodePath<t.JSXText>) {
        const text = path.node.value;

        if (!isMeaningfulText(text)) {
          return;
        }

        const trimmedText = text.trim();
        const jsxPath = buildJSXPath(path.parentPath);

        // Extract the string and get the hash
        const hash = appendToTempStrings(
          projectRoot,
          trimmedText,
          relativeFilePath,
          componentName,
          jsxPath
        );

        // Replace the text with {t('hash')} or {t('hash', locale)}
        // We need to replace the JSXText node with a JSXExpressionContainer
        // containing a call to t(hash) or t(hash, locale)
        const tCallArgs: Array<t.StringLiteral | t.Identifier> = [t.stringLiteral(hash)];

        // If component uses locale variable, add it as second parameter
        if (hasLocaleVariable) {
          tCallArgs.push(t.identifier('locale'));
        }

        const tCallExpression = t.callExpression(t.identifier('t'), tCallArgs);

        const jsxExpression = t.jsxExpressionContainer(tCallExpression);

        path.replaceWith(jsxExpression);
        hasChanges = true;
      },
    });

    // If we made changes, we need to add the import for `t`
    if (hasChanges) {
      // Import from the runtime module in the plugin package
      const importDeclaration = t.importDeclaration(
        [t.importSpecifier(t.identifier('t'), t.identifier('t'))],
        t.stringLiteral('turbopack-file-list-plugin/dist/runtime')
      );

      // Check if there's already an import for 't'
      let hasImport = false;
      traverse(ast, {
        ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
          // Check if 't' is already imported from any source
          const importsTFunction = path.node.specifiers.some(
            (spec) =>
              (t.isImportSpecifier(spec) || t.isImportDefaultSpecifier(spec)) &&
              t.isIdentifier(spec.local) &&
              spec.local.name === 't'
          );
          if (importsTFunction) {
            hasImport = true;
            path.stop();
          }
        },
      });

      if (!hasImport) {
        ast.program.body.unshift(importDeclaration);
      }

      // Generate the transformed code
      const output = generate(ast, {
        retainLines: false,
        compact: false,
      });

      return output.code;
    }

    return source;
  } catch (error) {
    console.error('[text-extraction-loader] Error processing file:', resourcePath);
    console.error(error);
    return source;
  }
}
