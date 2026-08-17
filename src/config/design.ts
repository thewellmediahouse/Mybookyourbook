/**
 * Extended design tokens — maps to SITE_SPEC `design` (docs/SITE_SPEC.schema.json).
 * Optional: when enabled is false, branding from site.ts is used via branding.ts.
 */
export const designConfig = {
  /** When false, only site.ts branding colors are applied */
  enabled: false,
  colors: {
    base: '#f8fafc',
    baseDeep: '#020617',
    baseMid: '#0f172a',
    accent: '#f59e0b',
    accentDark: '#d97706',
    accentLight: '#fbbf24',
    highlight: '#0ea5e9',
    cyan: '#06b6d4',
    text: '#0f172a',
    textSoft: '#334155',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
    border: '#e2e8f0',
    borderSubtle: '#f1f5f9',
    surface: 'rgba(255, 255, 255, 0.8)',
    surfaceRaised: '#ffffff',
    inputBg: '#ffffff',
  },
  gradients: {
    hero: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%)',
    page:
      'linear-gradient(180deg, var(--color-background) 0%, var(--color-background-deep) 100%)',
    gold: 'linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-accent-light) 100%)',
    accent: 'linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-secondary) 100%)',
    highlight: 'linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-primary) 100%)',
    cyan: 'linear-gradient(135deg, var(--brand-highlight) 0%, var(--brand-primary) 100%)',
    card: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
    divider: 'linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%)',
    edge: 'linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%)',
  },
  typography: {
    displayFont: 'Inter, ui-sans-serif, system-ui, sans-serif',
    bodyFont: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  spacing: {
    sectionDesktop: '5rem',
    sectionTablet: '3.5rem',
    sectionMobile: '2.5rem',
    containerMaxWidth: '80rem',
  },
  radius: {
    card: '0.75rem',
    button: '0.5rem',
    media: '1rem',
    input: '1.25rem',
    textarea: '1.25rem',
  },
  shadows: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
    elevated: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
    goldButton: '0 4px 14px rgb(0 0 0 / 0.12)',
    goldGlow: '0 0 24px rgb(0 0 0 / 0.06)',
    blueGlow: '0 0 32px rgb(0 0 0 / 0.05)',
  },
  /** Package / tier pricing presentation */
  packages: {
    featuredTier: {
      borderWidth: '2px',
      glowEnabled: true,
      glowSize: '32px',
      glowOpacity: 0.22,
      borderOpacity: 0.55,
      badgeLabel: 'Recommended',
    },
    tierIcons: {
      silver: '◆',
      gold: '★',
      platinum: '♛',
      star: '★',
      spark: '✦',
      crown: '♛',
      rocket: '▲',
      shield: '⬡',
    },
  },
  /** Video / media frame presentation (portfolio, hero video blocks) */
  media: {
    videoFrame: {
      glowEnabled: true,
      glowSize: '48px',
      glowOpacity: 0.24,
      outerGlowSize: '96px',
      outerGlowOpacity: 0.12,
      borderWidth: '1px',
      borderColor: 'rgba(217, 164, 65, 0.38)',
      useElevatedShadow: true,
    },
    portfolioDetail: {
      heroGlowEnabled: true,
      heroBlueGlowOpacity: 0.08,
      heroGoldGlowOpacity: 0.06,
      metaGlowEnabled: true,
    },
  },
} as const;

export type DesignConfig = typeof designConfig;
