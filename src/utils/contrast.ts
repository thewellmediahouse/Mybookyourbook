/**
 * WCAG 2.1 relative-luminance contrast — branding-phase check only.
 * Do not substitute a Lighthouse run. AA normal text = 4.5:1; large/UI = 3:1.
 */
const AA_NORMAL = 4.5;
const AA_LARGE = 3;

export function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return [
      Number.parseInt(raw[0]! + raw[0], 16),
      Number.parseInt(raw[1]! + raw[1], 16),
      Number.parseInt(raw[2]! + raw[2], 16),
    ];
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return [
      Number.parseInt(raw.slice(0, 2), 16),
      Number.parseInt(raw.slice(2, 4), 16),
      Number.parseInt(raw.slice(4, 6), 16),
    ];
  }
  return null;
}

function channelToLinear(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** Contrast ratio (≥1). Null if either color is not a hex. */
export function contrastRatio(foreground: string, background: string): number | null {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  if (a == null || b == null) return null;
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsAaNormal(foreground: string, background: string): boolean {
  const ratio = contrastRatio(foreground, background);
  return ratio != null && ratio >= AA_NORMAL;
}

export function meetsAaLarge(foreground: string, background: string): boolean {
  const ratio = contrastRatio(foreground, background);
  return ratio != null && ratio >= AA_LARGE;
}

export type ContrastPair = {
  name: string;
  foreground: string;
  background: string;
  /** Body copy / muted text uses 4.5:1; large headings / button labels may use 3:1. */
  min: typeof AA_NORMAL | typeof AA_LARGE;
};

export type ContrastFinding = ContrastPair & {
  ratio: number | null;
  pass: boolean;
};

export function checkContrastPairs(pairs: ContrastPair[]): ContrastFinding[] {
  return pairs.map((pair) => {
    const ratio = contrastRatio(pair.foreground, pair.background);
    return {
      ...pair,
      ratio,
      pass: ratio != null && ratio >= pair.min,
    };
  });
}
