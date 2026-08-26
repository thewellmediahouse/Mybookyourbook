/**
 * Royalty-free style references, not customer commercials and not testimonials.
 * Mixkit clips: people talking on camera and showing products (Stock Video Free License).
 * Pexels clips: cinematic place / craft references.
 */
export type ExampleClip = {
  id: string;
  src: string;
  title: string;
  subtitle: string;
};

export const AD_CLIPS: ExampleClip[] = [
  {
    id: "mix-50417",
    src: "/examples/mix-50417.mp4",
    title: "Showing the product",
    subtitle: "On camera, explaining what they sell.",
  },
  {
    id: "mix-50415",
    src: "/examples/mix-50415.mp4",
    title: "Talking through the offer",
    subtitle: "A person holding the product, speaking to you.",
  },
  {
    id: "mix-41272",
    src: "/examples/mix-41272.mp4",
    title: "The presenter",
    subtitle: "Someone talking straight to the customer.",
  },
  {
    id: "mix-4834",
    src: "/examples/mix-4834.mp4",
    title: "A service, explained",
    subtitle: "The face of the business, speaking in their space.",
  },
  {
    id: "mix-51216",
    src: "/examples/mix-51216.mp4",
    title: "Selling in the room",
    subtitle: "Showing the goods and talking them through.",
  },
  {
    id: "mix-42278",
    src: "/examples/mix-42278.mp4",
    title: "A product ad",
    subtitle: "Bright, direct, built to sell.",
  },
];

export const PLACE_CLIPS: ExampleClip[] = [
  { id: "2098989", src: "/examples/2098989.mp4", title: "On the floor", subtitle: "A working space, not a studio set." },
  { id: "2278095", src: "/examples/2278095.mp4", title: "Close and personal", subtitle: "The face customers already know." },
  { id: "2495382", src: "/examples/2495382.mp4", title: "After hours", subtitle: "City light, real places." },
  { id: "3141208", src: "/examples/3141208.mp4", title: "Hands at work", subtitle: "The craft behind the offer." },
  { id: "3195396", src: "/examples/3195396.mp4", title: "Service, in motion", subtitle: "People, not stock actors." },
  { id: "3209298", src: "/examples/3209298.mp4", title: "The room", subtitle: "Where the business actually happens." },
  { id: "3571264", src: "/examples/3571264.mp4", title: "Street level", subtitle: "Outside the door, on the street." },
  { id: "4990244", src: "/examples/4990244.mp4", title: "Quiet focus", subtitle: "Still enough to hold a 30-second story." },
];

export const EXAMPLE_CLIPS: ExampleClip[] = [...AD_CLIPS, ...PLACE_CLIPS];

export const EXAMPLE_DISCLAIMER =
  "These clips are royalty-free style references so you can see product ads with people talking on camera. They are not Production30 customer commercials, and they are not testimonials.";

export const HERO_CLIP = {
  id: "hero",
  src: "/examples/hero.mp4",
  title: "A finished commercial",
  subtitle: "A Production30 advert, starring the business.",
} as const;
