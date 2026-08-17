import { designConfig } from '@/config/design';
import type { PackageTierIcon, ServicePackageAccent } from '@/config/packages';

const presetColors = {
  accent: designConfig.colors.accent,
  highlight: designConfig.colors.highlight,
  cyan: designConfig.colors.cyan,
} as const;

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const num = parseInt(normalized, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveServicePackageAccentColor(accent?: ServicePackageAccent): string | undefined {
  if (!accent) return undefined;
  if (typeof accent === 'string') return presetColors[accent];
  return accent.color;
}

export function buildPackageAccentStyleAttribute(accent?: ServicePackageAccent): string | undefined {
  const featured = designConfig.packages?.featuredTier;
  const color = resolveServicePackageAccentColor(accent);

  if (!color) return undefined;

  const border =
    typeof accent === 'object' && accent.border
      ? accent.border
      : hexToRgba(color, featured?.borderOpacity ?? 0.45);

  const glow =
    typeof accent === 'object' && accent.glow
      ? accent.glow
      : `0 0 ${featured?.glowSize ?? '32px'} ${hexToRgba(color, featured?.glowOpacity ?? 0.22)}`;

  return [
    `--pkg-accent:${color}`,
    `--pkg-accent-soft:${hexToRgba(color, 0.12)}`,
    `--pkg-accent-border:${border}`,
    `--pkg-accent-glow:${glow}`,
  ].join(';');
}

export function getTierIcon(icon?: PackageTierIcon): string | undefined {
  if (!icon) return undefined;
  return designConfig.packages?.tierIcons[icon];
}

export function getFeaturedTierLabel(): string {
  return designConfig.packages?.featuredTier.badgeLabel ?? 'Recommended';
}

export function isRecommendedTier(
  recommendedTierId: string | undefined,
  tierId: string,
): boolean {
  return Boolean(recommendedTierId && recommendedTierId === tierId);
}
