export type GalleryItem = {
  title: string;
  caption: string;
  src: string;
  alt: string;
  objectPosition?: string;
  category: "logo" | "trophy" | "team" | "journey" | "audience";
};

export const galleryItems: GalleryItem[] = [
  {
    title: "The Standard",
    caption: "A visible reminder that disciplined daily training has a destination.",
    src: "/gallery/nsmq-trophy.jpg",
    alt: "NSMQ champion trophy on stage",
    category: "trophy",
  },
  {
    title: "Regional Competition Winners",
    caption: "Victory earned through teamwork, preparation, and composure.",
    src: "/gallery/ghanata-regional-competition-winners.jpg",
    alt: "Ghanata SHS students receiving a regional competition winner award",
    category: "team",
  },
  {
    title: "Regional Winners",
    caption: "A reminder that preparation can become public victory.",
    src: "/gallery/ghanata-regional-winners.jpg",
    alt: "Ghanata SHS regional winners holding a winner cheque",
    category: "team",
  },
  {
    title: "Prepared for the Stage",
    caption: "Students carrying the discipline and identity of Ghanata SHS.",
    src: "/gallery/ghanata-nsmq-backdrop-team.jpg",
    alt: "Ghanata SHS students standing in front of an NSMQ backdrop",
    category: "team",
  },
  {
    title: "Our NSMQ Journey",
    caption: "Years of students stepping forward, learning, and representing the school.",
    src: "/gallery/ghanata-journey.jpg",
    alt: "Ghanata SHS students representing the school on the NSMQ stage",
    category: "journey",
  },
  {
    title: "Ghanata Supporters",
    caption: "The energy behind the team — classmates, teachers, and supporters lifting the school spirit.",
    src: "/gallery/ghanata-supporters.jpg",
    alt: "Ghanata SHS supporters cheering during an NSMQ event",
    category: "audience",
  },
  {
    title: "The Team Beyond the Team",
    caption: "Champions carry the belief of classmates, teachers, families, and supporters.",
    src: "/gallery/ghanata-coaches-students.jpg",
    alt: "Ghanata SHS students and coaches gathered in a classroom",
    category: "audience",
  },

  {
    title: "Ghanata SHS 2019 Contestants",
    caption: "Representing Ghanata SHS on the NSMQ stage.",
    src: "/gallery/ghanata-2019-contestants.jpg",
    alt: "Ghanata SHS contestants seated at the NSMQ desk in 2019",
    category: "team",
  },
];

export const heroGalleryItem = galleryItems[1];
export const trophyGalleryItem = galleryItems[0];
export const journeyGalleryItem = galleryItems[4];

export const motivationQuotes = [
  "Champions are trained, not discovered.",
  "Every round mastered is one step closer to the NSMQ stage.",
  "Discipline, speed, clarity, and composure under pressure.",
  "Future champions are built daily.",
  "Great contestants recognize patterns quickly.",
  "Speed matters, but calm thinking matters more.",
  "Preparation turns pressure into performance."
];
