# contextpack

> Bundle your codebase into a single LLM-ready file. Stop copy-pasting.

```bash
npx contextpack .
```

---

## What it does

When you're working with Claude, ChatGPT, or any LLM, you often need to share multiple files at once. ContextPack bundles your entire codebase into a single markdown or JSON file — with a file tree, stats, and every source file's content — ready to paste.

```
📦 Packing /your/project...

✅ Done!
   Files:   12
   Tokens:  23.5k tokens
   Output:  /your/project/context.md
```

---

## Install

```bash
# Use without installing
npx contextpack .

# Or install globally
npm install -g contextpack
```

---

## Usage

```bash
ctx [directory] [options]
contextpack [directory] [options]
```

### Examples

```bash
# Pack current directory → context.md
ctx .

# Pack src/ only
ctx ./src --out context.md

# JSON output
ctx . --format json --out context.json

# Copy to clipboard instead of writing a file
ctx . --copy

# Just check token count before pasting
ctx . --stats

# Only include src/, exclude tests
ctx . --include src --exclude tests

# Watch mode — auto-rebuilds on file changes
ctx . --watch --out context.md
```

---

## Options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--out` | `-o` | Output file path | `context.md` |
| `--format` | `-f` | `markdown` or `json` | `markdown` |
| `--include` | `-i` | Only include paths matching pattern (repeatable) | — |
| `--exclude` | `-e` | Exclude paths matching pattern (repeatable) | — |
| `--copy` | `-c` | Copy output to clipboard | `false` |
| `--watch` | `-w` | Watch for changes and repack automatically | `false` |
| `--stats` | `-s` | Print stats only, no file output | `false` |
| `--max-size` | | Max file size in KB to include | `500` |
| `--help` | `-h` | Show help | — |

---

## Output format

### Markdown (default)

```markdown
# ContextPack

## 📊 Stats
| Property | Value |
|----------|-------|
| Files    | 12    |
| Tokens   | 23.5k |

## 🗂 File Tree
📁 src
  📄 index.ts
  📄 cli.ts

## 📄 Files

### `src/index.ts`
> 1.3 KB · 339 tokens
\`\`\`typescript
// ... file content
\`\`\`
```

### JSON

```json
{
  "meta": { "totalFiles": 12, "totalTokens": 23500 },
  "fileTree": "...",
  "files": [{ "path": "src/index.ts", "content": "..." }]
}
```

---

## Smart defaults

- Respects `.gitignore` automatically
- Skips `node_modules`, `dist`, `.git`, build artifacts
- Skips binary files (images, fonts, executables)
- Skips files over 500 KB (configurable with `--max-size`)
- Token estimates use the standard ~4 chars/token approximation

---

## Programmatic API

```typescript
import { pack } from 'contextpack';

const { output, result } = pack({
  dir: './src',
  format: 'markdown',
  copy: false,
  watch: false,
  stats: false,
  maxFileSize: 500 * 1024,
});

console.log(`${result.totalFiles} files, ${result.totalTokens} tokens`);
```

---

## License

MIT