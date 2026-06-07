export type GalleryItem = {
  title: string;
  caption: string;
  src: string;
  alt: string;
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
    title: "Riddle Bonanza Winners",
    caption: "Composure, clue recognition, and teamwork under pressure.",
    src: "/gallery/ghanata-riddle-winners.png",
    alt: "Ghanata SHS students receiving a Riddle Bonanza winner award",
    category: "team",
  },
  {
    title: "Our NSMQ Journey",
    caption: "Years of students stepping forward, learning, and representing the school.",
    src: "/gallery/ghanata-journey.jpg",
    alt: "Collage documenting Ghanata SHS NSMQ appearances from 2015 to 2019",
    category: "journey",
  },
  {
    title: "The Team Beyond the Team",
    caption: "Champions carry the belief of classmates, teachers, families, and supporters.",
    src: "/gallery/ghanata-supporters.jpg",
    alt: "Students and supporters cheering during an NSMQ event",
    category: "audience",
  },
  {
    title: "Built Together",
    caption: "Coaches set the standard; students turn repetition into mastery.",
    src: "/gallery/ghanata-coaches-students.jpg",
    alt: "Ghanata SHS students and coaches gathered in a classroom",
    category: "team",
  }
];

export const heroGalleryItem = galleryItems[1];
export const trophyGalleryItem = galleryItems[0];
export const journeyGalleryItem = galleryItems[2];
