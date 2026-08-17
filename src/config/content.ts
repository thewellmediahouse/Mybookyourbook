/**
 * Page section content — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md + CURSOR_INSTRUCTIONS.md
 */
import type { ImageMetadata } from 'astro';
import { raster } from '@/assets/raster';

export interface OutcomeCard {
  title: string;
  description: string;
}

export interface ProofItem {
  label: string;
}

export interface HomeServiceCard {
  id: string;
  name: string;
  description: string;
  image: ImageMetadata | string;
  imageAlt: string;
  href?: string;
}

export interface ClientBrand {
  name: string;
}

export interface ClientLogoMarqueeItem {
  src: ImageMetadata | string;
  alt: string;
}

export interface ConsultationProcessStep {
  label: string;
  title: string;
  text: string;
}

export interface ConsultationProcessContent {
  heading: string;
  subheading: string;
  steps: ConsultationProcessStep[];
  cta: {
    heading: string;
    text: string;
    button: { label: string; href: string };
  };
}

export interface InteractiveExperiencesContent {
  heading: string;
  headingHighlight: string;
  subheading: string;
  growthScore: {
    number: string;
    eyebrow: string;
    description: string;
    gaugeAlt: string;
    questionsHeading: string;
    questions: string[];
    quizCta: string;
    timeNote: string;
    resultCta: { label: string; href: string };
  };
}

export interface ClientShowcaseCard {
  id: string;
  image: ImageMetadata | string;
  imageAlt: string;
  width: number;
  height: number;
  videoUrl?: string;
  graphAnimation?: boolean;
}

export interface DifferentiatorCard {
  title: string;
  description: string;
}

export interface GrowthPathCard {
  id: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface PhaseCard {
  phase: number;
  title: string;
  description: string;
}

export interface StatItem {
  label: string;
  value: string;
  note?: string;
  icon?: 'trophy' | 'clients' | 'experience' | 'focus';
}

export interface HeroDecorOptions {
  /** Show optional hero background decor (full section width) */
  enabled?: boolean;
  /** 0–1 opacity over the hero gradient */
  opacity?: number;
  /** Static background image (webp, jpg, etc.) */
  image?: {
    src: string;
    alt?: string;
  };
  /** Background video (webm, mp4) — takes precedence over image when set */
  video?: {
    src: string;
    /** Shown before playback and when video is unsupported */
    poster?: string;
  };
}

export interface HeroContent {
  /** Primary heading line (default text colour) */
  heading: string;
  /** Optional second line with gold gradient — still a single h1 for SEO */
  headingHighlight?: string;
  subheading?: string;
  paragraph?: string;
  trustPoints?: string[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Optional full-width hero background decor — set per page in contentConfig.*.hero.decor */
  decor?: HeroDecorOptions;
  media?: {
    type: 'image' | 'video' | 'none';
    src?: ImageMetadata | string;
    alt?: string;
    width?: number;
    height?: number;
    caption?: string;
    videoUrl?: string;
  };
}

export interface CtaBlock {
  heading: string;
  paragraph?: string;
  bullets?: string[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image?: { src: string; alt: string };
  includeBookingMockup?: boolean;
}

export interface PageHeaderContent {
  title: string;
  headingHighlight?: string;
  intro?: string;
}

export const contentConfig = {
  outcomes: [
    { title: 'More Visibility', description: 'Be seen by the right audience.' },
    { title: 'More Bookings', description: 'Turn attention into enquiries.' },
    { title: 'More Revenue', description: 'Create systems that support sales.' },
    { title: 'Systems for Growth', description: 'Build momentum that lasts.' },
  ] satisfies OutcomeCard[],

  processSteps: [
    {
      step: 1,
      title: 'Audit & Strategy',
      description:
        'We study your brand, offer, website, content, and sales process.',
    },
    {
      step: 2,
      title: 'Premium Media Creation',
      description:
        'We create the videos, photos, website assets, and visual content your business needs to look professional.',
    },
    {
      step: 3,
      title: 'Marketing & Visibility System',
      description:
        'We structure content, campaigns, and platforms to help your business attract the right audience.',
    },
    {
      step: 4,
      title: 'Growth & Optimization',
      description:
        'We help improve enquiries, bookings, sales, and long-term brand trust.',
    },
  ] satisfies ProcessStep[],

  phasedImplementation: {
    intro:
      'We understand that every business is different. That is why we can phase the project in stages. You do not need to launch everything at once. We can start with the highest-impact priorities and build from there.',
    phases: [
      {
        phase: 1,
        title: 'Foundation',
        description: 'Establish core brand, systems, and initial content.',
      },
      {
        phase: 2,
        title: 'Momentum',
        description: 'Build visibility, campaigns, and consistent growth activity.',
      },
      {
        phase: 3,
        title: 'Scale',
        description: 'Refine and expand what is working for long-term revenue growth.',
      },
    ] satisfies PhaseCard[],
  },

  whyChooseUs: {
    heading: 'One Partner. Endless Possibilities.',
    paragraph:
      'Instead of managing multiple providers for content, websites, strategy, and campaigns, clients work with one team that understands the bigger picture.',
    bullets: [
      'One partner for strategy, systems, content, and growth.',
      'Premium media quality that elevates the brand.',
      'Measurable outcomes focused on bookings, sales, and visibility.',
      'Systems that help the business grow sustainably.',
      'Phased implementation so everything does not need to launch at once.',
      'A growth mindset focused on long-term momentum.',
    ],
  },

  capabilities: [
    'Growth Strategy & Business Development',
    'Premium Media Production',
    'Website Development & Digital Systems',
    'Tourism & Destination Marketing',
    'Accommodation Marketing',
    'Event Planning Support',
    'Growth Consulting & Scaling Systems',
  ],

  stats: [
    {
      label: 'Projects Completed',
      value: '100+',
      icon: 'trophy',
    },
    {
      label: 'Happy Clients',
      value: '50+',
      icon: 'clients',
    },
    {
      label: 'Years Experience',
      value: '5+',
      icon: 'experience',
    },
    {
      label: 'Client Focused',
      value: '100%',
      icon: 'focus',
    },
  ] satisfies StatItem[],

  home: {
    hero: {
      heading: 'We Create.',
      headingHighlight: 'You Grow.',
      subheading: 'PREMIUM MEDIA. STRATEGIC GROWTH.',
      paragraph:
        'We craft high-impact media and smart growth strategies that get your brand seen, trusted, and chosen.',
      trustPoints: ['More Visibility', 'More Bookings', 'More Revenue'],
      primaryCta: { label: 'Book a Consultation', href: '/contact' },
      secondaryCta: { label: 'View Our Work', href: '/portfolio' },
      decor: {
        enabled: false,
      },
      media: {
        type: 'image',
        src: raster.hero.cameraGrowth,
        alt: 'Cinema camera with gold growth visual',
        width: 1920,
        height: 1079,
      },
    } satisfies HeroContent,
    servicesPreview: {
      eyebrow: 'What We Do',
      heading: 'Premium Media. Proven Growth.',
      subheading:
        'We combine cinematic media with strategic business systems to help your brand look trusted, professional, and ready to grow.',
      items: [
        {
          id: 'cinematic-video',
          name: 'Cinematic Videos',
          description:
            'Professional brand films, interviews, and storytelling that make your company look established.',
          image: raster.services.cinematicVideos,
          imageAlt: 'Cinematic video production',
          href: '/pricing#content-creation',
        },
        {
          id: 'photography',
          name: 'Photography',
          description:
            'Clean, premium product and brand photos for websites, campaigns, and social media.',
          image: raster.services.productPhotography,
          imageAlt: 'Professional photography',
          href: '/pricing#content-creation',
        },
        {
          id: 'web-design',
          name: 'Web Design',
          description:
            'Modern websites and online shops designed to build trust, capture leads, and convert visitors.',
          image: raster.services.websiteDesign,
          imageAlt: 'Website design preview',
          href: '/pricing#once-off-services',
        },
        {
          id: 'marketing-strategy',
          name: 'Marketing Strategy',
          description:
            'Campaign planning, content direction, and visibility strategies built around business growth.',
          image: raster.services.marketingStrategy,
          imageAlt: 'Marketing strategy dashboard',
          href: '/pricing#business-growth',
        },
      ] satisfies HomeServiceCard[],
    },
    clientLogos: {
      heading: 'Trusted by growing brands',
      brands: [
        { name: 'SPAR' },
        { name: "McDonald's" },
        { name: 'STEERS' },
        { name: 'Ocean Basket' },
        { name: 'Pick n Pay' },
        { name: 'TOYOTA' },
      ] satisfies ClientBrand[],
    },
    interactiveExperiences: {
      heading: 'Interactive Experiences.',
      headingHighlight: 'Real Business Growth.',
      subheading: 'Smart tools. Clear strategy. Measurable results.',
      growthScore: {
        number: '01',
        eyebrow: 'BUSINESS GROWTH SCORE',
        description: 'Take the 2-minute quiz and get your growth score instantly.',
        gaugeAlt: 'Business Growth Score gauge showing score out of 100',
        questionsHeading: 'How does your business score?',
        questions: [
          'Do you have a modern, mobile-friendly website?',
          'Do you rank on Google for your key services?',
          'Do you have a clear offer that converts?',
          'Do you consistently get quality enquiries?',
          'Do you leverage video content?',
        ],
        quizCta: 'Take the Quiz',
        timeNote: '2 mins',
        resultCta: { label: 'Book a Free Growth Review', href: '/contact' },
      },
    } satisfies InteractiveExperiencesContent,
    clientShowcase: {
      eyebrow: 'Client Credibility',
      heading: 'Clients Who Used',
      headingHighlight: 'The Well Media',
      subheading:
        'Trusted by brands, ministries, and businesses that value premium media, strategy, and growth.',
      items: [
        {
          id: 'simola-hotel',
          image: raster.clientShowcase.simolaCard,
          imageAlt: 'Simola Hotel showcase card by The Well Media',
          width: 640,
          height: 684,
          videoUrl: 'https://youtu.be/WrDJoxajjhw',
        },
        {
          id: 'conrad-light',
          image: raster.clientShowcase.conradCard,
          imageAlt: 'Conrad Light showcase card by The Well Media',
          width: 640,
          height: 725,
          videoUrl: 'https://youtu.be/KBIxkQdbKUw?si=ZTOdQtu2mXo2-V46',
        },
        {
          id: 'well-dream-centre',
          image: raster.clientShowcase.wellDreamCentreCard,
          imageAlt: 'The Well Dream Centre showcase card by The Well Media',
          width: 640,
          height: 596,
          graphAnimation: true,
        },
      ] satisfies ClientShowcaseCard[],
    },
    clientLogoMarquee: [
      {
        src: raster.clientLogos.wellDreamCentre,
        alt: 'The Well Dream Centre',
      },
      {
        src: raster.clientLogos.muzoNetwork,
        alt: 'MuzoNetwork',
      },
      {
        src: raster.clientLogos.chef,
        alt: 'Chef',
      },
      {
        src: raster.clientLogos.emaGlobalConsulting,
        alt: 'EMA Global Consulting',
      },
      {
        src: raster.clientLogos.linkFonteineParkPharmacy,
        alt: 'Link Fonteine Park Pharmacy',
      },
      {
        src: raster.clientLogos.simolaHotel,
        alt: 'Simola Hotel Country Club & Spa',
      },
    ] satisfies ClientLogoMarqueeItem[],
    consultationProcess: {
      heading: 'Our Consultation Process',
      subheading:
        "We don't just shoot content. We study the business, build the structure, create the media, launch the strategy, and help drive real growth.",
      steps: [
        {
          label: 'Discovery Call',
          title: 'We Listen First',
          text: 'We sit with the client, understand the business, the offer, the current bottlenecks, and where growth is being lost.',
        },
        {
          label: 'Business Growth Audit',
          title: 'We Find the Gaps',
          text: 'We look at the website, brand, customer journey, content, sales process, online presence, and missed income opportunities.',
        },
        {
          label: 'Strategic Structure',
          title: 'We Build the Plan',
          text: 'We map out what the business needs first — website, offer, video, content, online store, booking flow, or growth campaign.',
        },
        {
          label: 'Premium Media Creation',
          title: 'We Create the Assets',
          text: 'We produce the visuals that sell: cinematic promo videos, product photography, demo videos, portraits, reels, and brand content.',
        },
        {
          label: 'Website & Sales System',
          title: 'We Build the Machine',
          text: 'We create or improve the website, landing pages, online store, booking forms, WhatsApp flow, email setup, and conversion points.',
        },
        {
          label: 'Launch & Content Management',
          title: 'We Go Live',
          text: 'We launch the campaign, publish the content, manage platforms, guide ad strategy, and make sure the business looks professional everywhere.',
        },
        {
          label: 'Growth Review',
          title: 'We Optimise for Sales',
          text: 'We review the results, adjust the strategy, improve the offer, and keep building momentum through content, systems, and business growth.',
        },
      ] satisfies ConsultationProcessStep[],
      cta: {
        heading: 'Ready to Find the Growth Gaps?',
        text: "Book a consultation and let's map out what your business needs to grow.",
        button: { label: 'Book a Growth Consultation', href: '/contact' },
      },
    } satisfies ConsultationProcessContent,
    liveEventSalesStrategy: {
      imageAlt:
        'The Well Media case study: R120,000 in book sales in one month through five strategic live events without Facebook ads',
      width: 1024,
      height: 438,
    },
    differentiators: {
      eyebrow: 'Growth Partner, Not Just a Supplier',
      heading: "We're Your Business Growth Partner.",
      paragraph:
        'We do not only create content. We help position, present, and grow your business with premium media, clear strategy, and ongoing systems.',
      cards: [
        {
          title: 'Strategy First Approach',
          description: 'We align every project with your business goals.',
        },
        {
          title: 'End-to-End Solutions',
          description: 'From content to conversion — we do it all.',
        },
        {
          title: 'Ongoing Growth Support',
          description: 'We stay with you as you scale.',
        },
      ] satisfies DifferentiatorCard[],
    },
    testimonials: {
      eyebrow: 'What Our Clients Say',
      heading: 'Results That Speak.',
    },
    consultationCta: {
      heading: "Ready to Grow? Let's Build Something Powerful Together.",
      primaryCta: { label: 'Book Your Free Consultation', href: '/contact' },
      includeBookingMockup: false,
    } satisfies CtaBlock,
    featuredWork: {
      eyebrow: 'Our Work',
      heading: 'Real Projects. Real Results.',
      subheading:
        'A preview of the premium media assets and growth systems we create for businesses.',
      cta: { label: 'View Full Portfolio', href: '/portfolio' },
    },
  },

  about: {
    hero: {
      heading: 'Your Business Growth',
      headingHighlight: 'Partner.',
      subheading: 'Not just a social media marketing agency.',
      paragraph:
        'At The Well Media, we help businesses build the foundation, systems, content, and strategy needed to grow. We do not only create posts. We help businesses create demand, increase bookings and sales, improve brand awareness, and build long-term revenue streams.',
      primaryCta: { label: 'Book a Consultation', href: '/contact' },
      decor: {
        enabled: false,
      },
      media: {
        type: 'image',
        src: raster.hero.aboutTeam,
        alt: 'The Well Media leadership team',
        width: 1440,
        height: 1800,
      },
    } satisfies HeroContent,
    intro: {
      heading: 'About Schalk Brits',
      role: 'CEO and Founder',
      credentials: 'LLB Cum Laude — University of the Free State',
      paragraphs: [
        'Schalk Brits is a **strategist, entrepreneur and creative professional** with a rare ability to combine analytical thinking, sales psychology, marketing and high-end media into one powerful approach to business growth.',
        'After completing his **LLB degree cum laude**, Schalk took the discipline, critical thinking and attention to detail developed through his legal studies and applied them to the world of business, sales and marketing. His greatest strength lies in understanding **why people buy, what influences decision-making, and how businesses can communicate their value in a way that turns attention into action**.',
        'With expertise spanning **sales psychology, marketing strategy, videography, digital media and brand development**, Schalk approaches media differently. For him, a beautiful website, photograph or cinematic video is only valuable if it serves a greater purpose. Every visual, message and campaign should be intentionally designed to build trust, position a brand correctly and ultimately help generate business.',
        'At the heart of Schalk\'s philosophy is **sales psychology**. He studies the way customers perceive value, make decisions and respond to messaging, using these insights to shape everything from advertising campaigns and video concepts to website layouts, offers and overall brand positioning.',
        'He is equally passionate about **teamwork**. Schalk believes the strongest results are rarely created by one individual trying to do everything. Instead, exceptional work happens when the right people are brought together and each person\'s unique strengths are recognised and utilised.',
        'His approach is therefore simple: **identify what each person does exceptionally well, bring those strengths together around a clear objective, and create an end product that is stronger than anything one person could have produced alone.**',
        'It is this combination of **strategic thinking, creativity, sales psychology, media expertise and collaborative leadership** that defines Schalk\'s approach — not simply creating media that looks impressive, but creating communication and experiences that are designed to move people and grow businesses.',
      ],
      image: {
        src: raster.team.schalkBrits,
        alt: 'Schalk Brits, founder of The Well Media',
        width: 819,
        height: 1024,
      },
    },
    cta: {
      heading: 'Ready to Grow Your Business?',
      primaryCta: { label: 'Book a Consultation', href: '/contact' },
    },
  },

  portfolio: {
    hero: {
      heading: 'Our Work',
      headingHighlight: 'Real Results.',
      paragraph:
        'Explore a curated collection of work across brand videos, social media management, product photography, client meetings, tourism campaigns, accommodation marketing, events, and growth campaigns.',
      primaryCta: { label: 'Book a Consultation', href: '/contact' },
      decor: {
        enabled: false,
      },
      media: {
        type: 'image',
        src: raster.hero.portfolioCollage,
        alt: 'The Well Media team collaborating on media production and strategy',
        width: 1920,
        height: 1080,
      },
    } satisfies HeroContent,
    cta: {
      heading: 'Ready to Become Our Next Success Story?',
      primaryCta: { label: 'Book a Consultation', href: '/contact' },
      secondaryCta: { label: 'View Pricing', href: '/pricing' },
    },
  },

  contact: {
    hero: {
      heading: "Let's Talk About",
      headingHighlight: 'Your Growth.',
      paragraph:
        "Tell us about your business, your goals, and where you want to grow. We work with clients across Eastern Cape, Gauteng, and Cape Town — and we'll help you identify the best next step and create a plan that fits your needs.",
      primaryCta: { label: 'Send a Message', href: '#contact-form' },
      decor: {
        enabled: true,
        opacity: 0.5,
        video: {
          src: '/gallery/hero/thewell_hero_background.webm',
          poster: '/gallery/hero/thewell_hero_background.webp',
        },
      },
      media: {
        type: 'image',
        src: raster.hero.contactMeeting,
        alt: 'Business consultation meeting in a modern cafe setting',
        width: 1920,
        height: 1440,
      },
    } satisfies HeroContent,
    cta: {
      heading: 'Ready to Grow Your Business?',
      primaryCta: { label: 'Send a Message', href: '#contact-form' },
    },
  },

  services: {
    pageHeader: {
      title: 'Our Services.',
      headingHighlight: 'Built for Growth.',
      intro: 'End-to-end support tailored to your stage of growth.',
    } satisfies PageHeaderContent,
    bundles: {
      heading: 'One-Off / Bundle Packages',
      subheading: 'Fixed-price packages for launches and bundled deliverables.',
      decor: {
        enabled: true,
        opacity: 0.5,
        video: {
          src: '/gallery/hero/thewell_hero_background.webm',
          poster: '/gallery/hero/thewell_hero_background.webp',
        },
      },
    },
    alaCarte: {
      heading: 'Individual / À La Carte Items',
      subheading: 'Standalone pricing for individual deliverables.',
    },
    terminology: {
      heading: 'Terminology Definitions',
      subheading: 'Key terms used in our video and content packages.',
    },
    cta: {
      heading: 'Not sure where to start?',
      primaryCta: { label: 'Book a consultation', href: '/contact' },
    },
  },

  pricing: {
    hero: {
      eyebrow: 'PREMIUM MEDIA. STRATEGIC GROWTH.',
      headline: ['Build the Foundation.', 'Grow the Brand.', 'Scale the Business.'],
      support:
        'We start by analysing your business foundation. If the brand, website, media or systems need work, we first implement the Launch Pack. Once the foundation is strong, we move into monthly retainers for content, management and business growth.',
      chips: ['More Visibility', 'More Bookings', 'More Revenue'],
      primaryCta: { label: 'Start With Launch Pack', href: '#launch-pack' },
      secondaryCta: { label: 'Book a Consultation', href: '/contact' },
      growthPathCard: {
        title: 'Your Growth Path',
        steps: [
          {
            title: 'Analyse Foundation',
            detail: 'Brand • Website • Media • Systems',
          },
          {
            title: 'Launch Pack',
            detail: 'Fix the foundation before scaling.',
            price: 'R25 000',
            highlight: true,
          },
          {
            title: 'Monthly Growth Support',
            detail: 'Choose the retainer that fits your goals.',
          },
        ],
        retainerLabel: 'Monthly pillars',
        retainers: ['Content Creation', 'Content Management', 'Business Growth'],
      },
    },
    pricingLogic: {
      heading: 'How Our Pricing Works',
      intro:
        'Some businesses only need one service. Others need their whole media foundation fixed before marketing can work. That is why we offer both individual services and a package system.',
      cards: [
        {
          title: 'Analyse the Foundation',
          description:
            'We review your brand, website, media and systems to see what is strong and what is holding growth back.',
        },
        {
          title: 'Choose Individual Services or Launch Pack',
          description:
            'Need one asset? Choose à la carte. Need the full foundation fixed? Start with the Launch Pack at R25 000.',
        },
        {
          title: 'Fix the Foundation',
          description:
            'The Launch Pack builds your brand foundation — logo, website, store, video, and photography.',
        },
        {
          title: 'Scale Monthly',
          description:
            'Once the foundation is strong, choose monthly support across content creation, management and business growth.',
        },
      ],
    },
    journey: {
      steps: [
        {
          title: 'Launch Pack',
          description: "We lay your brand's foundation from the ground up.",
        },
        {
          title: 'Choose Monthly Support',
          description: 'Pick the growth support that fits your goals.',
        },
        {
          title: 'Add Once-Off Services',
          description: 'Enhance, upgrade or expand with flexible once-off solutions.',
        },
      ],
    },
    visualServices: [
      { title: 'Video Production', imageKey: 'videoProduction' as const },
      { title: 'Product Photography', imageKey: 'productPhotography' as const },
      { title: 'Social Media & Content', imageKey: 'socialContent' as const },
      { title: 'Strategy & Growth', imageKey: 'strategyGrowth' as const },
    ],
    launchPack: {
      label: 'FOUNDATION',
      heading: 'Launch Pack',
      copy: 'The Launch Pack is used when your business needs the full foundation fixed before monthly growth can work properly.',
      cta: { label: 'Start With Launch Pack', href: '/contact' },
      features: [
        { label: 'Logo design and email signature', icon: 'logo' as const },
        { label: 'Website', icon: 'website' as const },
        { label: 'Online store', icon: 'shop' as const },
        { label: 'Product promo video', icon: 'video' as const },
        { label: 'Cinema video of company', icon: 'cinema' as const },
        { label: '10 product photos', icon: 'photo' as const },
        { label: '5 business portfolio photos', icon: 'portfolio' as const },
      ],
    },
    monthlySupport: {
      label: 'MONTHLY RETAINERS',
      heading: 'Monthly Growth Support',
      subheading:
        'After the foundation is strong, we scale with monthly support across content, management and business growth.',
    },
    alaCarte: {
      label: 'À LA CARTE',
      heading: 'Individual Services',
      subheading:
        'Choose these when you already have a strong foundation and only need a specific asset.',
    },
    cta: {
      heading: 'Not sure what you need first?',
      headingHighlight: '',
      support:
        'Book a consultation and we will analyse your business foundation, identify what is missing, and recommend the best path forward.',
      submitLabel: 'Book a Consultation',
      secondaryCta: { label: 'View Portfolio', href: '/portfolio' },
    },
  },

  professionalServices: {
    hero: {
      eyebrow: 'Professional Services',
      headline: ['Build authority.', 'Earn trust.', 'Stay visible.'],
      support:
        'Professional websites, consultation systems and premium media content created for consultants, practices and professional service providers.',
      chips: ['Authority', 'Trust', 'Visibility'],
      primaryCta: { label: 'View Professional Plans', href: '#monthly-support' },
      secondaryCta: { label: 'Book a Consultation', href: '/contact' },
      growthPathCard: {
        title: 'Your Professional Path',
        steps: [
          {
            title: 'Analyse Foundation',
            detail: 'Brand • Website • Consultation flow • Media',
          },
          {
            title: 'Professional Practice Launch Pack',
            detail: 'Build a professional foundation first.',
            price: 'R25 000',
            highlight: true,
          },
          {
            title: 'Monthly Professional Support',
            detail: 'Grow authority with Silver, Gold or Platinum.',
          },
        ],
        retainerLabel: 'Monthly pillars',
        retainers: ['Content Creation', 'Content Management', 'Business Growth'],
      },
    },
    pricingLogic: {
      heading: 'How Professional Services Pricing Works',
      intro:
        'Professional media and digital solutions for consultants, practices and other professional service providers. These packages focus on authority, trust, education and making it easy for prospective clients to request a consultation.',
      cards: [
        {
          title: 'Analyse the Foundation',
          description:
            'We review your brand, website, consultation flow and media so prospective clients can find you and request help with confidence.',
        },
        {
          title: 'Launch Pack or Monthly Support',
          description:
            'Need the full professional foundation? Start with the Professional Practice Launch Pack at R25 000. Already set up? Choose monthly retainers.',
        },
        {
          title: 'Build Authority Assets',
          description:
            'Website, consultation-request system, cinematic intro video, professional photography and content direction — without an online shop.',
        },
        {
          title: 'Scale Monthly',
          description:
            'Once the foundation is strong, scale with Silver, Gold or Platinum support across content, management and growth.',
        },
      ],
    },
    launchPack: {
      label: 'FOUNDATION',
      heading: 'Professional Practice Launch Pack',
      copy: 'A complete professional foundation for consultants and practices that need a modern website, consultation-request system and premium media content.',
      cta: { label: 'Book a Consultation', href: '/contact' },
      features: [
        { label: 'Logo design or professional logo refinement', icon: 'logo' as const },
        { label: 'Professional email signature and social profiles', icon: 'logo' as const },
        { label: 'Custom professional practice website (up to 5 pages)', icon: 'website' as const },
        { label: 'Online consultation booking form', icon: 'consultation' as const },
        { label: 'Cinematic practice introduction video (60–90 sec)', icon: 'cinema' as const },
        { label: 'Two short professional authority videos', icon: 'video' as const },
        { label: '5 professional photos and 5 office photos', icon: 'photo' as const },
        { label: 'Initial professional content direction', icon: 'portfolio' as const },
      ],
    },
    monthlySupport: {
      label: 'MONTHLY RETAINERS',
      heading: 'Professional Monthly Support',
      subheading:
        'After the foundation is strong, we scale with monthly support across content creation, management and business growth — tailored for professional practices.',
    },
    cta: {
      heading: 'Ready to build professional authority?',
      headingHighlight: '',
      support:
        'Book a consultation and we will analyse your practice’s foundation, recommend the right Launch Pack or retainer path, and map the next steps.',
      submitLabel: 'Book a Consultation',
      secondaryCta: { label: 'View Business Pricing', href: '/pricing' },
    },
  },
} as const;

export type ContentConfig = typeof contentConfig;
