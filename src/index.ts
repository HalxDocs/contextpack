import * as path from 'path';
import { walkDir, buildFileTree } from './walker.js';
import { formatMarkdown, formatJSON } from './formatter.js';
import { ContextPackOptions, PackResult } from './types.js';

export function pack(options: ContextPackOptions): { output: string; result: PackResult } {
  const dir = path.resolve(options.dir);

  // Walk the directory and collect files
  const files = walkDir(dir, {
    exclude: options.exclude,
    maxFileSize: options.maxFileSize,
  });

  // Filter by include patterns if provided
  const filteredFiles = options.include
    ? files.filter(f =>
        options.include!.some(pattern => f.relativePath.includes(pattern))
      )
    : files;

  // Build the result object
  const result: PackResult = {
    files: filteredFiles,
    fileTree: buildFileTree(filteredFiles),
    totalFiles: filteredFiles.length,
    totalSizeBytes: filteredFiles.reduce((sum, f) => sum + f.sizeBytes, 0),
    totalTokens: filteredFiles.reduce((sum, f) => sum + f.tokens, 0),
    generatedAt: new Date().toISOString(),
    sourceDir: dir,
  };

  // Format output
  const output =
    options.format === 'json'
      ? formatJSON(result)
      : formatMarkdown(result, options);

  return { output, result };
}

export { ContextPackOptions, PackResult, FileEntry } from './types.js';