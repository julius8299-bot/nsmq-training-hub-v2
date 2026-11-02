export type GalleryItem = {
  src: string;
  alt: string;
  title: string;
  caption: string;
  objectPosition?: string;
};

export const galleryItems: GalleryItem[] = [
  {
    src: "/gallery/nsmq-trophy.jpg",
    alt: "NSMQ champion trophy on the contest stage",
    title: "The Standard",
    caption: "A visible reminder that disciplined daily training has a destination.",
  },
  {
    src: "/gallery/ghanata-team.jpg",
    alt: "Ghanata SHS students receiving a Riddle Bonanza winner award",
    title: "Riddle Bonanza Winners",
    caption: "Composure, clue recognition, and teamwork under pressure.",
  },
  {
    src: "/gallery/ghanata-journey.png",
    alt: "Collage documenting Ghanata SHS NSMQ appearances from 2015 to 2019",
    title: "Our NSMQ Journey",
    caption: "Years of students stepping forward, learning, and representing the school.",
  },
  {
    src: "/gallery/ghanata-supporters.jpg",
    alt: "Students and supporters cheering during an NSMQ event",
    title: "The Team Beyond the Team",
    caption: "Champions carry the belief of classmates, teachers, families, and supporters.",
  },
  {
    src: "/gallery/ghanata-qualifiers.jpg",
    alt: "Ghanata SHS team at the 2025 regional qualifiers",
    title: "Regional Qualifiers",
    caption: "Every stage rewards preparation, clarity, and courage.",
  },
  {
    src: "/gallery/ghanata-coaches-students.jpg",
    alt: "Ghanata SHS students and coaches gathered in a classroom",
    title: "Built Together",
    caption: "Coaches set the standard; students turn repetition into mastery.",
  },
];

export const motivationQuotes = [
  "Champions are trained, not discovered.",
  "Every round mastered is one step closer to the NSMQ stage.",
  "Discipline, speed, clarity, and composure under pressure.",
  "Future champions are built daily.",
];
