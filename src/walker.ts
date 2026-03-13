import * as fs from 'fs';
import * as path from 'path';
import ignore, { Ignore } from 'ignore';
import { FileEntry } from './types.js';
import { estimateTokens } from './tokenEstimator.js';

const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php', swift: 'swift',
  kt: 'kotlin', scala: 'scala', html: 'html', css: 'css', scss: 'scss',
  json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml', md: 'markdown',
  sh: 'bash', bash: 'bash', zsh: 'bash', sql: 'sql', graphql: 'graphql',
  vue: 'vue', svelte: 'svelte', xml: 'xml', dockerfile: 'dockerfile',
};

const ALWAYS_IGNORE = [
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '.cache', '.turbo', 'out', '.vercel', '.netlify',
  '*.lock', '*.log', '*.map', '*.min.js', '*.min.css',
  '*.jpg', '*.jpeg', '*.png', '*.gif', '*.ico', '*.svg',
  '*.mp4', '*.mp3', '*.zip', '*.tar', '*.gz', '*.exe',
  '*.pdf', '*.ttf', '*.woff', '*.woff2', '*.eot',
];

function getLanguage(ext: string, filename: string): string {
  if (filename.toLowerCase() === 'dockerfile') return 'dockerfile';
  return LANGUAGE_MAP[ext.toLowerCase()] || ext || 'text';
}

function buildIgnore(dir: string, extraExcludes: string[]): Ignore {
  const ig = ignore();
  ig.add(ALWAYS_IGNORE);
  ig.add(extraExcludes);

  const gitignorePath = path.join(dir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  }

  return ig;
}

export function walkDir(
  dir: string,
  options: { exclude?: string[]; maxFileSize?: number }
): FileEntry[] {
  const ig = buildIgnore(dir, options.exclude || []);
  const maxSize = options.maxFileSize ?? 500 * 1024; // 500kb default
  const files: FileEntry[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath).replace(/\\/g, '/');

      if (ig.ignores(relativePath)) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        if (stat.size > maxSize) continue;

        let content: string;
        try {
          content = fs.readFileSync(fullPath, 'utf-8');
        } catch {
          continue; // skip binary files that can't be read as utf-8
        }

        const ext = path.extname(entry.name).replace('.', '');
        const language = getLanguage(ext, entry.name);

        files.push({
          path: fullPath,
          relativePath,
          extension: ext,
          language,
          content,
          sizeBytes: stat.size,
          tokens: estimateTokens(content),
        });
      }
    }
  }

  walk(dir);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function buildFileTree(files: FileEntry[]): string {
  const lines: string[] = [];
  const dirs = new Set<string>();

  for (const file of files) {
    const parts = file.relativePath.split('/');
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join('/'));
    }
  }

  const allPaths = [
    ...Array.from(dirs).map(d => ({ path: d, isDir: true })),
    ...files.map(f => ({ path: f.relativePath, isDir: false })),
  ].sort((a, b) => a.path.localeCompare(b.path));

  for (const item of allPaths) {
    const depth = item.path.split('/').length - 1;
    const indent = '  '.repeat(depth);
    const name = item.path.split('/').pop()!;
    lines.push(`${indent}${item.isDir ? '📁' : '📄'} ${name}`);
  }

  return lines.join('\n');
}