import type { ImageMetadata } from 'astro';
import { raster } from '@/assets/raster';

export interface BeforeAfterItem {
  title: string;
  subtitle: string;
  before: ImageMetadata;
  after: ImageMetadata;
}

export interface PortfolioGalleryImage {
  src: ImageMetadata;
  alt: string;
}

const { foodPhotography, realEstate, behindScenes, beforeAfter } = raster.portfolio;

export const portfolioGalleryConfig = {
  beforeAfter: {
    eyebrow: 'SEE THE DIFFERENCE',
    heading: 'Before & After',
    subheading: 'A quick look at the visual difference premium media makes.',
    items: [
      {
        title: 'Product Photography',
        subtitle: 'Coffee product transformation',
        before: beforeAfter.coffeeBefore,
        after: beforeAfter.coffeeAfter,
      },
      {
        title: 'Real Estate Photography',
        subtitle: 'Property image transformation',
        before: beforeAfter.houseBefore,
        after: beforeAfter.houseAfter,
      },
    ] satisfies BeforeAfterItem[],
  },
  foodPhotography: {
    eyebrow: 'CULINARY VISUALS',
    heading: 'Food Photography',
    subheading:
      'Premium food styling and photography that makes dishes look fresh, appetising, and ready for menus, social, and campaigns.',
    images: [
      {
        src: foodPhotography.gourmetSaladBowl,
        alt: 'Gourmet salad bowl with grains, chickpeas, and fresh greens',
      },
      {
        src: foodPhotography.braisedLambShank,
        alt: 'Braised lamb shank with mashed potatoes and seasonal vegetables',
      },
      {
        src: foodPhotography.artisanBreadSpread,
        alt: 'Artisan bread loaf with cheese breadsticks and rosemary',
      },
      {
        src: foodPhotography.seafoodPasta,
        alt: 'Seafood pasta with shrimp, mussels, and parmesan shavings',
      },
    ] satisfies PortfolioGalleryImage[],
  },
  realEstate: {
    eyebrow: 'PROPERTY SHOWCASE',
    heading: 'Real Estate Photography',
    subheading:
      'Interior, exterior, lifestyle, and twilight property visuals crafted to make listings look premium and memorable.',
    images: [
      {
        src: realEstate.hospitalityRestaurantDining,
        alt: 'Restaurant dining room with twilight view over the landscape',
      },
      {
        src: realEstate.hospitalityRestaurantInterior,
        alt: 'Upscale restaurant interior with sunset views through floor-to-ceiling windows',
      },
      {
        src: realEstate.hospitalityBarLounge,
        alt: 'Modern bar and lounge area photographed at twilight',
      },
      {
        src: realEstate.hospitalityBarCounter,
        alt: 'Hospitality bar counter with warm lighting and dusk city views',
      },
      {
        src: realEstate.luxurySuitePatio,
        alt: 'Luxury suite patio overlooking the interior living area',
      },
      {
        src: realEstate.livingRoomSeating,
        alt: 'Bright living room real estate photograph',
      },
      {
        src: realEstate.oceanViewBedroom,
        alt: 'Ocean-view bedroom real estate photograph',
      },
      {
        src: realEstate.modernHomeExteriorDusk,
        alt: 'Modern home exterior photographed at dusk',
      },
      {
        src: realEstate.staircaseEntryHall,
        alt: 'Entry hall staircase real estate photograph',
      },
      {
        src: realEstate.longDiningRoom,
        alt: 'Large dining area real estate photograph',
      },
      {
        src: realEstate.infinityPoolSunset,
        alt: 'Infinity pool photographed at sunset',
      },
      {
        src: realEstate.sunsetEntranceLodge,
        alt: 'Luxury entrance photographed at twilight',
      },
      {
        src: realEstate.nightEstateView,
        alt: 'Estate exterior photographed at night',
      },
    ] satisfies PortfolioGalleryImage[],
  },
  behindScenes: {
    eyebrow: 'HOW WE WORK',
    heading: 'Behind the Scenes',
    subheading: 'A look inside the production environment behind the content we create.',
    images: [
      {
        src: behindScenes.podcastCameraSetup,
        alt: 'Podcast camera setup behind the scenes',
      },
      {
        src: behindScenes.blueLitStudioSetup,
        alt: 'Blue-lit studio production setup',
      },
      {
        src: behindScenes.stageLightingSetup,
        alt: 'Stage lighting production setup',
      },
      {
        src: behindScenes.micStageFocus,
        alt: 'Microphone stage focus behind the scenes',
      },
      {
        src: behindScenes.wideStageProduction,
        alt: 'Wide stage production setup',
      },
      {
        src: behindScenes.godoxLightCloseup,
        alt: 'Godox light close-up behind the scenes',
      },
      {
        src: behindScenes.atmosphereWorshipBts,
        alt: 'Atmosphere Worship event behind the scenes',
      },
    ] satisfies PortfolioGalleryImage[],
  },
} as const;

export function getPortfolioLightboxImages(): PortfolioGalleryImage[] {
  return [
    ...portfolioGalleryConfig.foodPhotography.images,
    ...portfolioGalleryConfig.realEstate.images,
    ...portfolioGalleryConfig.behindScenes.images,
  ];
}
