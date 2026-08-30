/**
 * Royalty-free style references, not customer commercials and not testimonials.
 * Mixkit clips: people talking on camera and showing products (Stock Video Free License).
 * Pexels clips: cinematic place / craft references.
 */
export type ExampleClip = {
  id: string;
  src: string;
  poster: string;
  title: string;
  subtitle: string;
};

function clip(id: string, title: string, subtitle: string): ExampleClip {
  return {
    id,
    src: `/examples/${id}.mp4`,
    poster: `/examples/posters/${id}.jpg`,
    title,
    subtitle,
  };
}

export const AD_CLIPS: ExampleClip[] = [
  clip("mix-50417", "Showing the product", "On camera, explaining what they sell."),
  clip("mix-50415", "Talking through the offer", "A person holding the product, speaking to you."),
  clip("mix-41272", "The presenter", "Someone talking straight to the customer."),
  clip("mix-4834", "A service, explained", "The face of the business, speaking in their space."),
  clip("mix-51216", "Selling in the room", "Showing the goods and talking them through."),
  clip("mix-42278", "A product ad", "Bright, direct, built to sell."),
];

export const PLACE_CLIPS: ExampleClip[] = [
  clip("2098989", "On the floor", "A working space, not a studio set."),
  clip("2278095", "Close and personal", "The face customers already know."),
  clip("2495382", "After hours", "City light, real places."),
  clip("3141208", "Hands at work", "The craft behind the offer."),
  clip("3195396", "Service, in motion", "People, not stock actors."),
  clip("3209298", "The room", "Where the business actually happens."),
  clip("3571264", "Street level", "Outside the door, on the street."),
  clip("4990244", "Quiet focus", "Still enough to hold a 30-second story."),
];

export const EXAMPLE_CLIPS: ExampleClip[] = [...AD_CLIPS, ...PLACE_CLIPS];

export const EXAMPLE_DISCLAIMER =
  "These clips are royalty-free style references so you can see product ads with people talking on camera. They are not Production30 customer commercials, and they are not testimonials.";

export const HERO_CLIP = {
  ...clip("hero", "A finished commercial", "A Production30 advert, starring the business."),
} as const;
