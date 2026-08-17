import { siteConfig } from '@/config/site';
import { designConfig } from '@/config/design';
import { adjustColor } from '@/utils/seo';

export interface BrandCssVars {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  highlight: string;
  text: string;
  textMuted: string;
  background: string;
  backgroundDeep: string;
  border: string;
}

export function getThemeClass(): string {
  const mode = siteConfig.branding.themeMode;
  if (mode === 'dark') return 'theme-dark';
  if (mode === 'auto') return 'theme-auto';
  return 'theme-light';
}

export function getBrandCssVars(): BrandCssVars {
  const { primary, secondary, accent, additionalAccent, neutrals } = siteConfig.branding;
  const colors = designConfig.enabled ? designConfig.colors : null;

  return {
    primary,
    primaryDark: adjustColor(primary, -0.15),
    primaryLight: adjustColor(primary, 0.35),
    secondary,
    secondaryDark: adjustColor(secondary, -0.15),
    accent,
    highlight: additionalAccent ?? accent,
    text: colors?.text ?? neutrals.text,
    textMuted: colors?.textMuted ?? neutrals.textMuted,
    background: colors?.base ?? neutrals.background,
    backgroundDeep: colors?.baseDeep ?? neutrals.backgroundDeep,
    border: colors?.border ?? neutrals.border,
  };
}

export function brandStyleAttribute(): string {
  const vars = getBrandCssVars();
  const design = designConfig.enabled ? designConfig : null;
  const isLightTheme = getThemeClass() === 'theme-light';
  const { neutrals } = siteConfig.branding;

  const accentDark = design?.colors.accentDark ?? adjustColor(vars.accent, -0.15);
  const accentLight = design?.colors.accentLight ?? adjustColor(vars.accent, 0.15);

  const textSoft = isLightTheme
    ? (design?.colors.textSoft ?? '#334155')
    : (design?.colors.textSoft ?? '#e2e8f0');
  const textSubtle = isLightTheme
    ? (design?.colors.textSubtle ?? neutrals.textMuted)
    : (design?.colors.textSubtle ?? '#94a3b8');
  const inputBg = isLightTheme
    ? (design?.colors.inputBg ?? '#ffffff')
    : (design?.colors.inputBg ?? 'rgba(2,8,20,0.65)');

  const entries: Record<string, string> = {
    '--brand-primary': vars.primary,
    '--brand-primary-dark': vars.primaryDark,
    '--brand-primary-light': vars.primaryLight,
    '--brand-secondary': vars.secondary,
    '--brand-secondary-dark': vars.secondaryDark,
    '--brand-accent': vars.accent,
    '--brand-accent-dark': accentDark,
    '--brand-accent-light': accentLight,
    '--brand-highlight': vars.highlight,
    '--color-text': vars.text,
    '--color-text-soft': textSoft,
    '--color-text-muted': design?.colors.textMuted ?? vars.textMuted,
    '--color-text-subtle': textSubtle,
    '--color-background': vars.background,
    '--color-background-deep': vars.backgroundDeep,
    '--color-border': vars.border,
    '--color-surface': design?.colors.surface ?? (isLightTheme ? '#f8fafc' : 'rgba(255,255,255,0.04)'),
    '--color-surface-raised': design?.colors.surfaceRaised ?? (isLightTheme ? '#ffffff' : 'rgba(255,255,255,0.07)'),
    '--color-input-bg': inputBg,
    '--gradient-accent':
      design?.gradients.accent ??
      `linear-gradient(135deg, ${vars.accent} 0%, ${accentLight} 100%)`,
    '--shadow-gold-button': design?.shadows.goldButton ?? '0 4px 14px rgb(0 0 0 / 0.12)',
  };

  if (design) {
    entries['--gradient-hero'] = design.gradients.hero;
    entries['--gradient-page'] = design.gradients.page;
    entries['--gradient-gold'] = design.gradients.gold;
    entries['--gradient-accent'] = design.gradients.accent;
    entries['--gradient-highlight'] = design.gradients.highlight;
    entries['--gradient-cyan'] = design.gradients.cyan;
    entries['--gradient-card'] = design.gradients.card;
    entries['--gradient-divider'] = design.gradients.divider;
    entries['--gradient-edge'] = design.gradients.edge;
    entries['--shadow-card'] = design.shadows.card;
    entries['--shadow-elevated'] = design.shadows.elevated;
    entries['--shadow-gold-button'] = design.shadows.goldButton;
    entries['--shadow-gold-glow'] = design.shadows.goldGlow;
    entries['--shadow-blue-glow'] = design.shadows.blueGlow;
    entries['--font-display'] = design.typography.displayFont;
    entries['--font-sans'] = design.typography.bodyFont;
    entries['--radius-card'] = design.radius.card;
    entries['--radius-button'] = design.radius.button;
    entries['--radius-media'] = design.radius.media;
    entries['--radius-input'] = design.radius.input;
    entries['--radius-textarea'] = design.radius.textarea;
    entries['--spacing-section'] = design.spacing.sectionDesktop;
    entries['--spacing-section-sm'] = design.spacing.sectionTablet;
    entries['--container-max'] = design.spacing.containerMaxWidth;

    if (design.packages) {
      entries['--package-featured-border-width'] = design.packages.featuredTier.borderWidth;
      entries['--package-featured-glow-size'] = design.packages.featuredTier.glowSize;
    }

    if (design.media) {
      const { videoFrame, portfolioDetail } = design.media;

      entries['--media-video-border-width'] = videoFrame.borderWidth;
      entries['--media-video-border-color'] = videoFrame.borderColor;
      const glowMix = (size: string, opacity: number) =>
        `0 0 ${size} color-mix(in srgb, ${vars.accent} ${Math.round(opacity * 100)}%, transparent)`;
      entries['--media-video-glow'] = videoFrame.glowEnabled
        ? `${glowMix(videoFrame.glowSize, videoFrame.glowOpacity)}, ${glowMix(
            videoFrame.outerGlowSize,
            videoFrame.outerGlowOpacity,
          )}`
        : 'none';
      entries['--media-video-shadow'] = videoFrame.useElevatedShadow
        ? '0 28px 56px -16px rgb(0 0 0 / 0.62), 0 12px 24px -8px rgb(0 0 0 / 0.42)'
        : 'none';
      entries['--portfolio-detail-hero-glow-display'] = portfolioDetail.heroGlowEnabled
        ? 'block'
        : 'none';
      entries['--portfolio-detail-hero-blue-opacity'] = String(portfolioDetail.heroBlueGlowOpacity);
      entries['--portfolio-detail-hero-gold-opacity'] = String(portfolioDetail.heroGoldGlowOpacity);
      entries['--portfolio-detail-meta-shadow'] = portfolioDetail.metaGlowEnabled
        ? design.shadows.goldGlow
        : 'none';
    }
  }

  return Object.entries(entries)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}
