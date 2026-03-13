import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import { pack } from './index.js';
import { ContextPackOptions } from './types.js';
import { formatTokenCount } from './tokenEstimator.js';

export function watch(options: ContextPackOptions, outPath: string) {
  const dir = path.resolve(options.dir);

  console.log(`\n👀 Watching ${dir} for changes...`);
  console.log(`📦 Output: ${outPath}`);
  console.log(`Press Ctrl+C to stop\n`);

  function rebuild(changedPath?: string) {
    if (changedPath) {
      const rel = path.relative(dir, changedPath).replace(/\\/g, '/');
      console.log(`🔄 Change detected: ${rel}`);
    }

    try {
      const { output, result } = pack(options);
      fs.writeFileSync(outPath, output, 'utf-8');

      const time = new Date().toLocaleTimeString();
      console.log(
        `✅ [${time}] Repacked → ${result.totalFiles} files · ${formatTokenCount(result.totalTokens)}`
      );
    } catch (err) {
      console.error(`❌ Error repacking:`, err);
    }
  }

  // Initial build
  rebuild();

  // Watch for changes
  const watcher = chokidar.watch(dir, {
    ignored: [
      /(^|[\/\\])\../, // dotfiles
      /node_modules/,
      /dist/,
      /\.git/,
      outPath, // ignore the output file itself
    ],
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('add', rebuild)
    .on('change', rebuild)
    .on('unlink', rebuild)
    .on('addDir', rebuild)
    .on('unlinkDir', rebuild);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watcher...');
    watcher.close();
    process.exit(0);
  });
}