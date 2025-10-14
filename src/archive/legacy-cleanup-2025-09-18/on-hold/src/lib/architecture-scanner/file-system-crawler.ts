/**
 * File System Crawler
 * Recursively scans directories for components and analyzes their structure
 */

import { promises as fs } from 'fs';
import { join, relative, extname } from 'path';
import { ScanOptions } from './types';

export class FileSystemCrawler {
  private static readonly DEFAULT_SCAN_DIRECTORIES = [
    'src/api',
    'src/routes', 
    'src/dashboard',
    'src/pages',
    'src/auth',
    'src/lib',
    'src/services',
    'src/components',
    'src/contexts',
    'src/hooks',
    'src/utils'
  ];

  private static readonly DEFAULT_EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.vercel',
    '__tests__',
    '*.test.ts',
    '*.test.tsx',
    '*.spec.ts',
    '*.spec.tsx',
    '*.d.ts'
  ];

  private static readonly SUPPORTED_EXTENSIONS = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.vue',
    '.svelte'
  ];

  /**
   * Crawl file system and return all relevant component files
   */
  static async crawlFileSystem(options?: Partial<ScanOptions>): Promise<string[]> {
    const scanOptions: ScanOptions = {
      directories: options?.directories || this.DEFAULT_SCAN_DIRECTORIES,
      excludePatterns: options?.excludePatterns || this.DEFAULT_EXCLUDE_PATTERNS,
      includePatterns: options?.includePatterns || ['**/*'],
      followSymlinks: options?.followSymlinks || false,
      maxDepth: options?.maxDepth || 10
    };

    const allFiles: string[] = [];

    for (const directory of scanOptions.directories) {
      try {
        const files = await this.crawlDirectory(
          directory,
          scanOptions,
          0
        );
        allFiles.push(...files);
      } catch (error) {
        console.warn(`Failed to scan directory ${directory}:`, error);
      }
    }

    return allFiles.filter(file => this.isRelevantFile(file));
  }

  /**
   * Recursively crawl a single directory
   */
  private static async crawlDirectory(
    dirPath: string,
    options: ScanOptions,
    currentDepth: number
  ): Promise<string[]> {
    if (currentDepth >= options.maxDepth) {
      return [];
    }

    const files: string[] = [];

    try {
      // Check if directory exists before trying to read it
      const dirExists = await fs.stat(dirPath).catch(() => false);
      if (!dirExists) {
        console.warn(`Directory does not exist, skipping: ${dirPath}`);
        return [];
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        const relativePath = relative(process.cwd(), fullPath);

        // Skip excluded patterns
        if (this.isExcluded(relativePath, options.excludePatterns)) {
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.crawlDirectory(
            fullPath,
            options,
            currentDepth + 1
          );
          files.push(...subFiles);
        } else if (entry.isFile() || (entry.isSymbolicLink() && options.followSymlinks)) {
          files.push(relativePath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Check if a file path matches exclude patterns
   */
  private static isExcluded(filePath: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        // Convert glob pattern to regex
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        return new RegExp(regexPattern).test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  /**
   * Check if a file is relevant for architecture analysis
   */
  private static isRelevantFile(filePath: string): boolean {
    const ext = extname(filePath);
    return this.SUPPORTED_EXTENSIONS.includes(ext);
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(filePath: string): Promise<{
    size: number;
    lastModified: Date;
    content: string;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');

      return {
        size: stats.size,
        lastModified: stats.mtime,
        content
      };
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}