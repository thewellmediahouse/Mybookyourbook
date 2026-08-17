/**
 * Raster import registry for Astro build-time image optimization.
 * PNG/WebP/JPEG sources live here; SVGs, favicons, and videos stay in public/.
 */
import wmhLogoWhite from './brand/wmh-logo-white.webp';
import logoWhiteHeader from './brand/logo-white-header.webp';
import logoWhiteFull from './brand/logo-white-full.webp';
import heroCameraGrowth from './images/hero/hero-camera-growth.webp';
import aboutTeam from './images/hero/about-team.webp';
import portfolioCollage from './images/hero/portfolio-collage.webp';
import contactMeeting from './images/hero/contact-meeting.webp';
import badMediaGreatMediaBanner from './images/banners/bad-media-great-media-banner.webp';
import growthScorePanelBg from './images/interactive/growth-score-panel-bg.webp';
import growthScoreGauge from './images/interactive/growth-score-gauge.webp';
import interactiveSectionBg from './images/interactive/section-bg.webp';
import simolaCard from './images/client-showcase/simola-card.webp';
import conradCard from './images/client-showcase/conrad-card.webp';
import wellDreamCentreCard from './images/client-showcase/well-dream-centre-card.webp';
import wellDreamCentreLogo from './images/client-logos/well-dream-centre.webp';
import muzoNetworkLogo from './images/client-logos/muzo-network.webp';
import chefLogo from './images/client-logos/chef.webp';
import emaGlobalConsultingLogo from './images/client-logos/ema-global-consulting.webp';
import linkFonteineParkPharmacyLogo from './images/client-logos/link-fonteine-park-pharmacy.webp';
import simolaHotelLogo from './images/client-logos/simola-hotel.webp';
import serviceCinematicVideos from './images/services/cinematic-videos.webp';
import serviceProductPhotography from './images/services/product-photography.webp';
import serviceWebsiteDesign from './images/services/website-design.webp';
import serviceMarketingStrategy from './images/services/marketing-strategy.webp';
import ogDefault from './images/og/og-default.jpg';
import growthPartnerBg from './images/backgrounds/growth-partner.webp';
import ctaGrowthBg from './images/backgrounds/cta-growth.webp';
import testimonialAdri from './images/testimonials/adri-labuschagne.webp';
import testimonialWillem from './images/testimonials/willem-du-preez.webp';
import testimonialBarbara from './images/testimonials/barbara-claassen.webp';
import pricingHeroInterview from './images/packages/pricing-hero-interview.webp';
import singleServicesVsPackage from './images/packages/single-services-vs-package.webp';
import packageVideoProduction from './images/packages/service-video-production.webp';
import packageProductPhotography from './images/packages/service-product-photography.webp';
import packageSocialContent from './images/packages/service-social-content.webp';
import packageStrategyGrowth from './images/packages/service-strategy-growth.webp';
import launchPackBrandBox from './images/packages/launch-pack-brand-box.webp';
import ctaDirectorChair from './images/packages/cta-director-chair.webp';
import portfolioCompanyPromo from './images/portfolio/company-promo.webp';
import portfolioProductDemo from './images/portfolio/product-demo.webp';
import portfolioWebsiteDesign from './images/portfolio/website-design.webp';
import portfolioProductPhotography from './images/portfolio/product-photography.webp';
import thumbSimolaHotel from './images/portfolio/simola-hotel-luxury-stay.png';
import thumbSimolaPadel from './images/portfolio/simola-padel-courts.png';
import thumbSimolaDining from './images/portfolio/simola-dining-food.png';
import thumbConradLight from './images/portfolio/conrad-light-fade-with-me.png';
import simolaRestaurant1 from './images/portfolio/SimolaRestaurant1.webp';
import simolaRestaurant2 from './images/portfolio/SimolaRestaurant2.webp';
import simolaRestaurant3 from './images/portfolio/SimolaRestaurant3.webp';
import simolaRestaurant4 from './images/portfolio/SimolaRestaurant4.webp';
import gourmetSaladBowl from './images/portfolio/food-photography/01-gourmet-salad-bowl.webp';
import braisedLambShank from './images/portfolio/food-photography/02-braised-lamb-shank.webp';
import artisanBreadSpread from './images/portfolio/food-photography/03-artisan-bread-spread.webp';
import seafoodPasta from './images/portfolio/food-photography/04-seafood-pasta.webp';
import luxurySuitePatio from './images/portfolio/real-estate/01-luxury-suite-patio.webp';
import livingRoomSeating from './images/portfolio/real-estate/02-living-room-seating.webp';
import oceanViewBedroom from './images/portfolio/real-estate/03-ocean-view-bedroom.webp';
import modernHomeExteriorDusk from './images/portfolio/real-estate/04-modern-home-exterior-dusk.webp';
import staircaseEntryHall from './images/portfolio/real-estate/05-staircase-entry-hall.webp';
import longDiningRoom from './images/portfolio/real-estate/06-long-dining-room.webp';
import infinityPoolSunset from './images/portfolio/real-estate/07-infinity-pool-sunset.webp';
import sunsetEntranceLodge from './images/portfolio/real-estate/08-sunset-entrance-lodge.webp';
import nightEstateView from './images/portfolio/real-estate/09-night-estate-view.webp';
import hospitalityRestaurantDining from './images/portfolio/real-estate/hospitality-01-restaurant-dining-twilight.webp';
import hospitalityRestaurantInterior from './images/portfolio/real-estate/hospitality-02-restaurant-interior-sunset.webp';
import hospitalityBarLounge from './images/portfolio/real-estate/hospitality-03-bar-lounge-twilight.webp';
import hospitalityBarCounter from './images/portfolio/real-estate/hospitality-04-hospitality-bar-counter.webp';
import podcastCameraSetup from './images/portfolio/behind-scenes/01-podcast-camera-setup.webp';
import blueLitStudioSetup from './images/portfolio/behind-scenes/02-blue-lit-studio-setup.webp';
import stageLightingSetup from './images/portfolio/behind-scenes/03-stage-lighting-setup.webp';
import micStageFocus from './images/portfolio/behind-scenes/04-mic-stage-focus.webp';
import wideStageProduction from './images/portfolio/behind-scenes/05-wide-stage-production.webp';
import godoxLightCloseup from './images/portfolio/behind-scenes/06-godox-light-closeup.webp';
import atmosphereWorshipBts from './images/portfolio/behind-scenes/07-atmosphere-worship-bts.webp';
import coffeeBefore from './images/portfolio/ab/coffee-before.webp';
import coffeeAfter from './images/portfolio/ab/coffee-after.webp';
import houseBefore from './images/portfolio/ab/house-before.webp';
import houseAfter from './images/portfolio/ab/house-after.webp';

export const raster = {
  brand: {
    wmhLogoWhite,
    logoWhiteHeader,
    logoWhiteFull,
  },
  hero: {
    cameraGrowth: heroCameraGrowth,
    aboutTeam,
    portfolioCollage,
    contactMeeting,
  },
  banners: {
    badMediaGreatMedia: badMediaGreatMediaBanner,
  },
  backgrounds: {
    growthPartner: growthPartnerBg,
    ctaGrowth: ctaGrowthBg,
  },
  interactive: {
    sectionBg: interactiveSectionBg,
    growthScorePanelBg,
    growthScoreGauge,
  },
  clientShowcase: {
    simolaCard,
    conradCard,
    wellDreamCentreCard,
  },
  clientLogos: {
    wellDreamCentre: wellDreamCentreLogo,
    muzoNetwork: muzoNetworkLogo,
    chef: chefLogo,
    emaGlobalConsulting: emaGlobalConsultingLogo,
    linkFonteineParkPharmacy: linkFonteineParkPharmacyLogo,
    simolaHotel: simolaHotelLogo,
  },
  services: {
    cinematicVideos: serviceCinematicVideos,
    productPhotography: serviceProductPhotography,
    websiteDesign: serviceWebsiteDesign,
    marketingStrategy: serviceMarketingStrategy,
  },
  testimonials: {
    adriLabuschagne: testimonialAdri,
    willemDuPreez: testimonialWillem,
    barbaraClaassen: testimonialBarbara,
  },
  packages: {
    pricingHeroInterview,
    singleServicesVsPackage,
    videoProduction: packageVideoProduction,
    productPhotography: packageProductPhotography,
    socialContent: packageSocialContent,
    strategyGrowth: packageStrategyGrowth,
    launchPack: launchPackBrandBox,
    ctaDirectorChair,
  },
  portfolio: {
    companyPromo: portfolioCompanyPromo,
    productDemo: portfolioProductDemo,
    websiteDesign: portfolioWebsiteDesign,
    productPhotography: portfolioProductPhotography,
    thumbs: {
      simolaHotel: thumbSimolaHotel,
      simolaPadel: thumbSimolaPadel,
      simolaDining: thumbSimolaDining,
      conradLight: thumbConradLight,
    },
    simolaRestaurant: {
      one: simolaRestaurant1,
      two: simolaRestaurant2,
      three: simolaRestaurant3,
      four: simolaRestaurant4,
    },
    foodPhotography: {
      gourmetSaladBowl,
      braisedLambShank,
      artisanBreadSpread,
      seafoodPasta,
    },
    realEstate: {
      hospitalityRestaurantDining,
      hospitalityRestaurantInterior,
      hospitalityBarLounge,
      hospitalityBarCounter,
      luxurySuitePatio,
      livingRoomSeating,
      oceanViewBedroom,
      modernHomeExteriorDusk,
      staircaseEntryHall,
      longDiningRoom,
      infinityPoolSunset,
      sunsetEntranceLodge,
      nightEstateView,
    },
    behindScenes: {
      podcastCameraSetup,
      blueLitStudioSetup,
      stageLightingSetup,
      micStageFocus,
      wideStageProduction,
      godoxLightCloseup,
      atmosphereWorshipBts,
    },
    beforeAfter: {
      coffeeBefore,
      coffeeAfter,
      houseBefore,
      houseAfter,
    },
  },
  og: {
    default: ogDefault,
  },
} as const;

export type PackageRasterKey = keyof typeof raster.packages;
