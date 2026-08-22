/**
 * Royalty-free Pexels clips hosted locally. These are style references,
 * not customer commercials and not testimonials.
 */
export type ExampleClip = {
  id: string;
  src: string;
  title: string;
  subtitle: string;
};

export const EXAMPLE_CLIPS: ExampleClip[] = [
  { id: "2098989", src: "/examples/2098989.mp4", title: "On the floor", subtitle: "A working space, not a studio set." },
  { id: "2278095", src: "/examples/2278095.mp4", title: "Close and personal", subtitle: "The face customers already know." },
  { id: "2495382", src: "/examples/2495382.mp4", title: "After hours", subtitle: "City light, real places." },
  { id: "3141208", src: "/examples/3141208.mp4", title: "Hands at work", subtitle: "The craft behind the offer." },
  { id: "3195396", src: "/examples/3195396.mp4", title: "Service, in motion", subtitle: "People, not stock actors." },
  { id: "3209298", src: "/examples/3209298.mp4", title: "The room", subtitle: "Where the business actually happens." },
  { id: "3571264", src: "/examples/3571264.mp4", title: "Street level", subtitle: "Outside the door, on the street." },
  { id: "4990244", src: "/examples/4990244.mp4", title: "Quiet focus", subtitle: "Still enough to hold a 30-second story." },
];

export const EXAMPLE_DISCLAIMER =
  "These clips are royalty-free style references so you can see the cinematic look. They are not Production30 customer commercials, and they are not testimonials.";
