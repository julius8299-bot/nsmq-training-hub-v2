import Link from "next/link";
import { BookOpen, Calculator } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { byStrand, LEARN_SUBJECTS, topicSlug } from "@/lib/learn/notes";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Teaching" title="Learn the topics"
        description="Every topic in the Ghana SHS syllabus, chapter by chapter, plus the first- and second-year university topics NSMQ finals reach. Each one has key ideas, a formula sheet, speed shortcuts with worked examples, and the traps examiners set. Read first, then drill." />
      <div className="grid gap-6 lg:grid-cols-2">
        {LEARN_SUBJECTS.map(({ slug, name }) => {
          const strands = byStrand(slug);
          return (
            <section key={slug} className="panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><BookOpen size={20} />{name}</h2>
                <Link href={`/learn/${slug}/formulas`} className="inline-flex items-center gap-1.5 text-sm font-bold text-chemistry underline"><Calculator size={15} />Formula sheet</Link>
              </div>
              {!strands.length && <p className="mt-4 text-sm text-ink/50">Notes for this subject are being written.</p>}
              {strands.map(([strand, topics]) => (
                <div key={strand} className="mt-5">
                  <p className="eyebrow">{strand}</p>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {topics.map((topic) => (
                      <li key={topic.topic}>
                        <Link href={`/learn/${slug}/${topicSlug(topic.topic)}`} className="block rounded-lg px-2 py-1.5 text-sm hover:bg-ink/5">
                          {topic.topic}{topic.university && <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-900">Uni</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
