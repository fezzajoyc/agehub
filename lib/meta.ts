export function metaTitle(head: string, tail: string, max = 60): string {
  const full = `${head} — ${tail}`;
  if (full.length <= max) return full;
  const over = full.length - max;
  if (head.length >= tail.length) {
    const h = head.slice(0, Math.max(head.length - over - 1, 20)).trimEnd() + "…";
    return `${h} — ${tail}`;
  }
  const t = tail.slice(0, Math.max(tail.length - over - 1, 12)).trimEnd() + "…";
  return `${head} — ${t}`;
}
