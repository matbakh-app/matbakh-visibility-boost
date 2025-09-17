/**
 * Usage Analyzer
 * Tracks active imports/exports and analyzes component dependencies
 */

import { UsageAnalysis } from './types';

export class UsageAnalyzer {
  private static readonly IMPORT_PATTERNS = [
    // ES6 imports
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g,
    // CommonJS requires
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Dynamic imports
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  private static readonly EXPORT_PATTERNS = [
    // Named exports
    /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g,
    // Export declarations
    /export\s+\{([^}]+)\}/g,
    // Default exports
    /export\s+default\s+(?:(?:const|let|var|function|class)\s+)?(\w+)?/g,
    // Re-exports
    /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g
  ];

  /**
   * Analyze imports in a file
   */
  static analyzeImports(content: string): string[] {
    const imports: string[] = [];

    for (const pattern of this.IMPORT_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath && !this.isExternalModule(importPath)) {
          imports.push(this.normalizeImportPath(importPath));
        }
      }
    }

    return [...new Set(imports)]; // Remove duplicates
  }

  /**
   * Analyze exports in a file
   */
  static analyzeExports(content: string): string[] {
    const exports: string[] = [];

    for (const pattern of this.EXPORT_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          // Handle multiple exports in braces
          if (match[0].includes('{')) {
            const exportList = match[1]
              .split(',')
              .map(exp => exp.trim().split(' as ')[0].trim())
              .filter(exp => exp && exp !== '');
            exports.push(...exportList);
          } else {
            exports.push(match[1].trim());
          }
        }
      }
    }

    return [...new Set(exports)]; // Remove duplicates
  }

  /**
   * Analyze usage of a specific component across all files
   */
  static async analyzeComponentUsage(
    componentPath: string,
    allFiles: Map<string, string>
  ): Promise<UsageAnalysis> {
    const importedBy: string[] = [];
    const exportsUsed: string[] = [];
    const componentContent = allFiles.get(componentPath) || '';
    const componentExports = this.analyzeExports(componentContent);

    // Check which files import this component
    for (const [filePath, content] of allFiles.entries()) {
      if (filePath === componentPath) continue;

      const imports = this.analyzeImports(content);
      const normalizedComponentPath = this.normalizeImportPath(componentPath);

      // Check if this file imports the component
      const importsComponent = imports.some(imp => 
        this.resolveImportPath(imp, filePath) === normalizedComponentPath
      );

      if (importsComponent) {
        importedBy.push(filePath);

        // Analyze which specific exports are used
        const usedExports = this.findUsedExports(content, componentExports);
        exportsUsed.push(...usedExports);
      }
    }

    const unusedExports = componentExports.filter(exp => 
      !exportsUsed.includes(exp)
    );

    const circularDependencies = this.detectCircularDependencies(
      componentPath,
      allFiles
    );

    return {
      isImported: importedBy.length > 0,
      importedBy: [...new Set(importedBy)],
      exportsUsed: [...new Set(exportsUsed)],
      unusedExports,
      circularDependencies
    };
  }

  /**
   * Find which exports from a component are actually used in a file
   */
  private static findUsedExports(content: string, exports: string[]): string[] {
    const usedExports: string[] = [];

    for (const exportName of exports) {
      // Check if the export is referenced in the content
      const usagePatterns = [
        new RegExp(`\\b${exportName}\\b`, 'g'), // Direct usage
        new RegExp(`\\{[^}]*\\b${exportName}\\b[^}]*\\}`, 'g'), // Destructured import
      ];

      const isUsed = usagePatterns.some(pattern => pattern.test(content));
      if (isUsed) {
        usedExports.push(exportName);
      }
    }

    return usedExports;
  }

  /**
   * Detect circular dependencies
   */
  private static detectCircularDependencies(
    componentPath: string,
    allFiles: Map<string, string>,
    visited: Set<string> = new Set(),
    path: string[] = []
  ): string[] {
    if (visited.has(componentPath)) {
      const cycleStart = path.indexOf(componentPath);
      return cycleStart >= 0 ? path.slice(cycleStart) : [];
    }

    visited.add(componentPath);
    path.push(componentPath);

    const content = allFiles.get(componentPath) || '';
    const imports = this.analyzeImports(content);

    for (const importPath of imports) {
      const resolvedPath = this.resolveImportPath(importPath, componentPath);
      if (allFiles.has(resolvedPath)) {
        const cycle = this.detectCircularDependencies(
          resolvedPath,
          allFiles,
          new Set(visited),
          [...path]
        );
        if (cycle.length > 0) {
          return cycle;
        }
      }
    }

    return [];
  }

  /**
   * Check if an import is an external module
   */
  private static isExternalModule(importPath: string): boolean {
    return !importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('@/');
  }

  /**
   * Normalize import path for comparison
   */
  private static normalizeImportPath(importPath: string): string {
    // Convert @/ alias to src/
    if (importPath.startsWith('@/')) {
      return importPath.replace('@/', 'src/');
    }
    
    // Remove file extensions
    return importPath.replace(/\.(ts|tsx|js|jsx)$/, '');
  }

  /**
   * Resolve relative import path to absolute path
   */
  private static resolveImportPath(importPath: string, fromFile: string): string {
    if (importPath.startsWith('@/')) {
      return this.normalizeImportPath(importPath);
    }

    if (importPath.startsWith('.')) {
      const fromDir = fromFile.split('/').slice(0, -1).join('/');
      const resolved = this.resolvePath(fromDir, importPath);
      return this.normalizeImportPath(resolved);
    }

    return importPath;
  }

  /**
   * Resolve relative path
   */
  private static resolvePath(basePath: string, relativePath: string): string {
    const baseParts = basePath.split('/');
    const relativeParts = relativePath.split('/');

    for (const part of relativeParts) {
      if (part === '..') {
        baseParts.pop();
      } else if (part !== '.') {
        baseParts.push(part);
      }
    }

    return baseParts.join('/');
  }
}