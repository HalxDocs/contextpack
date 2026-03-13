// It approximates token count the same way OpenAI/Claude tokenizers work
// ~4 characters per token is the widely accepted estimate

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return `${tokens} tokens`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}k tokens`;
  return `${(tokens / 1_000_000).toFixed(2)}M tokens`;
}

export function getContextWarning(tokens: number): string | null {
  if (tokens > 2_000_000) return '⛔ Exceeds most LLM context windows (2M+)';
  if (tokens > 1_000_000) return '⚠️  Very large — only Gemini 1.5 / Claude 3 can handle this';
  if (tokens > 200_000)   return '⚠️  Large — works with Claude 3, GPT-4 Turbo';
  if (tokens > 128_000)   return '⚠️  Fits Claude 3 but may exceed GPT-4';
  return null;
}