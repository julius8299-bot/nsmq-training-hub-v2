import biology from "./content/biology.json";
import chemistry from "./content/chemistry.json";
import mathematics from "./content/mathematics.json";
import physics from "./content/physics.json";

export type Formula = { name: string; formula: string; note?: string };
export type Shortcut = { name: string; rule: string; example: string };
export type TopicNotes = {
  topic: string; strand: string; university: boolean; summary: string; keyIdeas: string[];
  formulas: Formula[]; shortcuts: Shortcut[]; traps: string[]; nsmqTips: string[];
};
export type SubjectNotes = { subject: string; topics: TopicNotes[] };

export const LEARN_SUBJECTS = [
  { slug: "mathematics", subject: "MATHEMATICS", name: "Mathematics" },
  { slug: "physics", subject: "PHYSICS", name: "Physics" },
  { slug: "chemistry", subject: "CHEMISTRY", name: "Chemistry" },
  { slug: "biology", subject: "BIOLOGY", name: "Biology" },
] as const;

const NOTES: Record<string, SubjectNotes> = {
  mathematics: mathematics as SubjectNotes, physics: physics as SubjectNotes,
  chemistry: chemistry as SubjectNotes, biology: biology as SubjectNotes,
};

export const topicSlug = (topic: string) => topic.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const subjectBySlug = (slug: string) => LEARN_SUBJECTS.find((item) => item.slug === slug);
export const notesFor = (slug: string) => NOTES[slug]?.topics ?? [];
export const findTopic = (slug: string, topic: string) => notesFor(slug).find((item) => topicSlug(item.topic) === topic);

/** Topics grouped by curriculum strand, in syllabus order. */
export function byStrand(slug: string) {
  const groups = new Map<string, TopicNotes[]>();
  for (const topic of notesFor(slug)) groups.set(topic.strand, [...(groups.get(topic.strand) ?? []), topic]);
  return [...groups.entries()];
}
