/**
 * Extended design tokens — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md + approved mockup direction
 */
export const designConfig = {
  enabled: true,
  colors: {
    base: '#061426',
    baseDeep: '#050A18',
    baseMid: '#0A1A2E',
    accent: '#D9A441',
    accentDark: '#B8862E',
    accentLight: '#F2C766',
    highlight: '#1EA7FF',
    cyan: '#16D6D9',
    text: '#FFFFFF',
    textSoft: '#E2E8F0',
    textMuted: '#B8C5D6',
    textSubtle: '#94A3B8',
    border: 'rgba(217, 164, 65, 0.22)',
    borderSubtle: 'rgba(255, 255, 255, 0.1)',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceRaised: 'rgba(255, 255, 255, 0.07)',
    inputBg: 'rgba(2, 8, 20, 0.65)',
  },
  gradients: {
    /** Spec: Hero */
    hero: 'linear-gradient(135deg, #020814 0%, #061426 100%)',
    /** Page backdrop — radial spotlight + deep navy (mockup feel) */
    page:
      'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(30, 80, 130, 0.28) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 80% 20%, rgba(217, 164, 65, 0.06) 0%, transparent 50%), linear-gradient(180deg, #050A18 0%, #020814 45%, #061426 100%)',
    /** Spec: Gold — used for accents, dividers, emphasis */
    gold: 'linear-gradient(135deg, #D9A441 0%, #F2C766 100%)',
    /** Metallic gold for primary CTAs (mockup button feel) */
    accent:
      'linear-gradient(90deg, #A67C2A 0%, #D9A441 22%, #F2C766 50%, #D9A441 78%, #A67C2A 100%)',
    /** Spec: Blue */
    highlight: 'linear-gradient(135deg, #1EA7FF 0%, #061426 100%)',
    /** Spec: Cyan */
    cyan: 'linear-gradient(135deg, #16D6D9 0%, #061426 100%)',
    /** Card / panel surface */
    card: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
    /** Horizontal fade divider */
    divider: 'linear-gradient(90deg, transparent 0%, rgba(217,164,65,0.5) 50%, transparent 100%)',
    /** Header / footer edge highlight */
    edge: 'linear-gradient(90deg, transparent 0%, rgba(217,164,65,0.35) 50%, transparent 100%)',
  },
  typography: {
    displayFont: '"Playfair Display", ui-serif, Georgia, serif',
    bodyFont: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  spacing: {
    sectionDesktop: '6rem',
    sectionTablet: '5rem',
    sectionMobile: '3.5rem',
    containerMaxWidth: '80rem',
  },
  radius: {
    card: '1rem',
    button: '9999px',
    media: '1.5rem',
    input: '1.25rem',
    textarea: '1.25rem',
  },
  shadows: {
    card: '0 8px 32px rgb(0 0 0 / 0.35), 0 0 0 1px rgba(217, 164, 65, 0.08)',
    elevated: '0 24px 48px -12px rgb(0 0 0 / 0.5), 0 0 40px rgba(217, 164, 65, 0.06)',
    goldButton:
      '0 4px 16px rgba(217, 164, 65, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 rgba(0, 0, 0, 0.15)',
    goldGlow: '0 0 32px rgba(217, 164, 65, 0.12)',
    blueGlow: '0 0 48px rgba(30, 167, 255, 0.08)',
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
