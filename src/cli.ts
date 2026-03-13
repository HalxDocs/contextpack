#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import minimist from 'minimist';
import { pack } from './index.js';
import { watch } from './watcher.js';
import { ContextPackOptions } from './types.js';
import { formatTokenCount, getContextWarning } from './tokenEstimator.js';

const HELP = `
╔═══════════════════════════════════════════╗
║           contextpack (ctx)               ║
║  Bundle your codebase for LLMs instantly  ║
╚═══════════════════════════════════════════╝

Usage:
  ctx [directory] [options]
  contextpack [directory] [options]

Options:
  --out, -o       Output file path (default: context.md)
  --format, -f    Output format: markdown | json (default: markdown)
  --include, -i   Only include paths matching pattern (repeatable)
  --exclude, -e   Exclude paths matching pattern (repeatable)
  --copy, -c      Copy output to clipboard
  --watch, -w     Watch for changes and repack automatically
  --stats, -s     Print stats only, no file contents
  --max-size      Max file size in KB to include (default: 500)
  --help, -h      Show this help message

Examples:
  ctx .
  ctx ./src --out context.md
  ctx . --format json --out context.json
  ctx . --include src --exclude tests
  ctx . --copy
  ctx . --watch --out context.md
  ctx . --stats
`;

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['out', 'format', 'include', 'exclude'],
    boolean: ['copy', 'watch', 'stats', 'help'],
    alias: {
      o: 'out',
      f: 'format',
      i: 'include',
      e: 'exclude',
      c: 'copy',
      w: 'watch',
      s: 'stats',
      h: 'help',
    },
    default: {
      format: 'markdown',
      copy: false,
      watch: false,
      stats: false,
    },
  });

  if (argv.help) {
    console.log(HELP);
    process.exit(0);
  }

  const dir = argv._[0] || '.';

  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }

  const format = argv.format === 'json' ? 'json' : 'markdown';
  const defaultOut = format === 'json' ? 'context.json' : 'context.md';
  const outPath = path.resolve(argv.out || defaultOut);

  const options: ContextPackOptions = {
    dir,
    format,
    out: outPath,
    copy: argv.copy,
    watch: argv.watch,
    stats: argv.stats,
    maxFileSize: (argv['max-size'] || 500) * 1024,
    include: argv.include
      ? Array.isArray(argv.include) ? argv.include : [argv.include]
      : undefined,
    exclude: argv.exclude
      ? Array.isArray(argv.exclude) ? argv.exclude : [argv.exclude]
      : undefined,
  };

  // Watch mode
  if (options.watch) {
    watch(options, outPath);
    return;
  }

  // Single pack
  console.log(`\n📦 Packing ${path.resolve(dir)}...\n`);

  try {
    const { output, result } = pack(options);

    // Stats only mode
    if (options.stats) {
      console.log(`📊 Stats`);
      console.log(`   Files:   ${result.totalFiles}`);
      console.log(`   Size:    ${(result.totalSizeBytes / 1024).toFixed(1)} KB`);
      console.log(`   Tokens:  ${formatTokenCount(result.totalTokens)}`);
      const warning = getContextWarning(result.totalTokens);
      if (warning) console.log(`\n   ${warning}`);
      console.log('');
      return;
    }

    // Write output file
    fs.writeFileSync(outPath, output, 'utf-8');
    console.log(`✅ Done!`);
    console.log(`   Files:   ${result.totalFiles}`);
    console.log(`   Tokens:  ${formatTokenCount(result.totalTokens)}`);
    console.log(`   Output:  ${outPath}`);

    const warning = getContextWarning(result.totalTokens);
    if (warning) console.log(`\n   ${warning}`);

    // Copy to clipboard
    if (options.copy) {
      try {
        const { default: clipboardy } = await import('clipboardy');
        await clipboardy.write(output);
        console.log(`\n📋 Copied to clipboard!`);
      } catch {
        console.warn(`\n⚠️  Could not copy to clipboard`);
      }
    }

    console.log('');
  } catch (err) {
    console.error(`❌ Failed to pack:`, err);
    process.exit(1);
  }
}

main();