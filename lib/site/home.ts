export const HOME_ASSET_ROOT = "/production30-homepage";

export const HOME_IMAGES = {
  heroSelfie: `${HOME_ASSET_ROOT}/images/hero-selfie.webp`,
  heroFinishedAd: `${HOME_ASSET_ROOT}/images/hero-finished-ad.webp`,
  cardSalesAd: `${HOME_ASSET_ROOT}/images/card-sales-ad.webp`,
  cardViralGrowth: `${HOME_ASSET_ROOT}/images/card-viral-growth.webp`,
  styleCinematic: `${HOME_ASSET_ROOT}/images/style-cinematic.webp`,
  styleUgc: `${HOME_ASSET_ROOT}/images/style-ugc.webp`,
  styleLuxury: `${HOME_ASSET_ROOT}/images/style-luxury.webp`,
  styleFunny: `${HOME_ASSET_ROOT}/images/style-funny.webp`,
  finalCtaAd: `${HOME_ASSET_ROOT}/images/final-cta-ad.webp`,
  fromSelfieToSales: `${HOME_ASSET_ROOT}/images/from-selfie-to-sales.webp`,
} as const;

export const HOME_VIDEOS = {
  heroSelfie: `${HOME_ASSET_ROOT}/videos/hero-selfie.mp4`,
  heroFinishedAd: `${HOME_ASSET_ROOT}/videos/hero-finished-ad.mp4`,
} as const;

export const HOME_BACKGROUNDS = {
  heroAurora: `${HOME_ASSET_ROOT}/backgrounds/hero-aurora.webp`,
  lightFlow: `${HOME_ASSET_ROOT}/backgrounds/light-flow.webp`,
  performancePath: `${HOME_ASSET_ROOT}/backgrounds/performance-path.webp`,
  finalCtaFlow: `${HOME_ASSET_ROOT}/backgrounds/final-cta-flow.webp`,
} as const;

export const HOME_UI = {
  phoneFrame: `${HOME_ASSET_ROOT}/ui/phone-frame.svg`,
  transformationRibbon: `${HOME_ASSET_ROOT}/ui/transformation-ribbon.svg`,
  analyticsDashboard: `${HOME_ASSET_ROOT}/ui/analytics-dashboard.svg`,
  conversionPath: `${HOME_ASSET_ROOT}/ui/conversion-path.svg`,
  studioToolbar: `${HOME_ASSET_ROOT}/ui/studio-toolbar.svg`,
} as const;

export const HOME_ICONS = {
  salesScript: `${HOME_ASSET_ROOT}/icons/sales-script.svg`,
  duration: `${HOME_ASSET_ROOT}/icons/duration.svg`,
  socialReady: `${HOME_ASSET_ROOT}/icons/social-ready.svg`,
  check: `${HOME_ASSET_ROOT}/icons/check.svg`,
  attention: `${HOME_ASSET_ROOT}/icons/attention.svg`,
  enquiries: `${HOME_ASSET_ROOT}/icons/enquiries.svg`,
  customers: `${HOME_ASSET_ROOT}/icons/customers.svg`,
  sales: `${HOME_ASSET_ROOT}/icons/sales.svg`,
  play: `${HOME_ASSET_ROOT}/icons/play.svg`,
  growth: `${HOME_ASSET_ROOT}/icons/growth.svg`,
  cart: `${HOME_ASSET_ROOT}/icons/cart.svg`,
  advert: `${HOME_ASSET_ROOT}/icons/advert.svg`,
  viral: `${HOME_ASSET_ROOT}/icons/viral.svg`,
  product: `${HOME_ASSET_ROOT}/icons/product.svg`,
  service: `${HOME_ASSET_ROOT}/icons/service.svg`,
  offer: `${HOME_ASSET_ROOT}/icons/offer.svg`,
  pov: `${HOME_ASSET_ROOT}/icons/pov.svg`,
  storytime: `${HOME_ASSET_ROOT}/icons/storytime.svg`,
  beforeAfter: `${HOME_ASSET_ROOT}/icons/before-after.svg`,
  arrowLeft: `${HOME_ASSET_ROOT}/icons/arrow-left.svg`,
  arrowRight: `${HOME_ASSET_ROOT}/icons/arrow-right.svg`,
  selfieVideo: `${HOME_ASSET_ROOT}/icons/selfie-video.svg`,
  uploadLogo: `${HOME_ASSET_ROOT}/icons/upload-logo.svg`,
  generateScript: `${HOME_ASSET_ROOT}/icons/generate-script.svg`,
  getAdvert: `${HOME_ASSET_ROOT}/icons/get-advert.svg`,
} as const;

export const HOME_MEDIA_PATHS = [
  ...Object.values(HOME_IMAGES),
  ...Object.values(HOME_VIDEOS),
  ...Object.values(HOME_BACKGROUNDS),
  ...Object.values(HOME_UI),
  ...Object.values(HOME_ICONS),
] as const;

export const HOME_NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/examples", label: "Examples" },
  { href: "/pricing", label: "Plans" },
] as const;

export const HOME_HERO = {
  eyebrow: "AI VIDEO ADS BUILT TO SELL",
  headlineBefore: "Turn one selfie into a video that",
  headlineAccent: "brings customers.",
  body: "Create a professional sales advert or a viral-style social video—without a film crew, editor or complicated prompts.",
  primary: { href: "/signup", label: "Create a video that sells" },
  secondary: { href: "/examples", label: "See real examples" },
  headerCta: "Create my first video",
  trust: ["AI-written sales script", "Ready for social media", "15s, 20s or 30s"] as const,
  chips: [
    { icon: HOME_ICONS.salesScript, label: "Sales script" },
    { icon: HOME_ICONS.duration, label: "30 sec" },
    { icon: HOME_ICONS.socialReady, label: "Social ready" },
  ] as const,
} as const;

export const HOME_HERO_STEPS = [
  {
    number: "1",
    title: "Record a selfie",
    body: "Talk to camera for 20 seconds.",
    icon: HOME_ICONS.selfieVideo,
  },
  {
    number: "2",
    title: "Add your brand",
    body: "Upload your logo and product.",
    icon: HOME_ICONS.uploadLogo,
  },
  {
    number: "3",
    title: "Build your advert",
    body: "AI writes the hook, offer and call to action.",
    icon: HOME_ICONS.generateScript,
  },
  {
    number: "4",
    title: "Launch in minutes",
    body: "Receive a polished commercial starring you.",
    icon: HOME_ICONS.getAdvert,
  },
] as const;

export const HOME_STATS = {
  eyebrow: "WHY BUSINESSES INVEST IN VIDEO",
  heading: "Video does more than get views. It drives action.",
  items: [
    { value: "83%", body: "say video directly increased sales" },
    { value: "85%", body: "say video helped generate leads" },
    { value: "82%", body: "report a good return on video marketing" },
  ] as const,
  sourceLabel: "Source: Wyzowl Video Marketing Statistics 2026. Industry survey; not Production30 customer results.",
  sourceHref: "https://wyzowl.com/video-marketing-statistics/",
} as const;

export const HOME_CHOICES = [
  {
    id: "advert",
    title: "Sales Advert",
    body: "Turn your product, service or offer into a video designed to win enquiries and sales.",
    href: "/signup?intent=advert",
    cta: "Create my sales advert",
    image: HOME_IMAGES.cardSalesAd,
    objectPosition: "center",
  },
  {
    id: "viral",
    title: "Viral Growth Video",
    body: "Use proven hook formats to earn attention, reach and social growth.",
    href: "/signup?intent=viral",
    cta: "Create my growth video",
    image: HOME_IMAGES.cardViralGrowth,
    objectPosition: "64% 38%",
  },
] as const;

export const HOME_STEPS = [
  { number: "1", title: "Choose your goal", body: "Sales, leads or social growth." },
  { number: "2", title: "Approve your script", body: "AI builds the hook, offer and call to action." },
  { number: "3", title: "Add your selfie", body: "Choose a look and generate." },
] as const;

export const HOME_STYLES = [
  { id: "cinematic", label: "Cinematic", image: HOME_IMAGES.styleCinematic, objectPosition: "50% 40%" },
  { id: "ugc", label: "UGC", image: HOME_IMAGES.styleUgc, objectPosition: "55% 35%" },
  { id: "luxury", label: "Luxury", image: HOME_IMAGES.styleLuxury, objectPosition: "50% 52%" },
  { id: "funny", label: "Funny", image: HOME_IMAGES.styleFunny, objectPosition: "50% 35%" },
] as const;

export const HOME_FINAL = {
  heading: "Stop posting just to be seen. Create videos that sell.",
  body: "Create one campaign or subscribe for fresh sales adverts and growth videos every month.",
  primary: { href: "/signup", label: "Create a video that sells" },
  secondary: { href: "/pricing", label: "Choose a monthly plan" },
} as const;
