export interface ContextPackOptions {
  dir: string;
  include?: string[];
  exclude?: string[];
  format: 'markdown' | 'json';
  out?: string;
  copy: boolean;
  watch: boolean;
  stats: boolean;
  maxFileSize: number; // bytes
}

export interface FileEntry {
  path: string;
  relativePath: string;
  extension: string;
  language: string;
  content: string;
  sizeBytes: number;
  tokens: number;
}

export interface PackResult {
  files: FileEntry[];
  fileTree: string;
  totalFiles: number;
  totalSizeBytes: number;
  totalTokens: number;
  generatedAt: string;
  sourceDir: string;
}