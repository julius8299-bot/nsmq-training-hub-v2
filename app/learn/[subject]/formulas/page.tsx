import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MathText } from "@/components/math-text";
import { PrintButton } from "@/components/print-button";
import { byStrand, subjectBySlug, topicSlug } from "@/lib/learn/notes";

type Params = { params: Promise<{ subject: string }> };

export async function generateMetadata({ params }: Params) {
  return { title: `${subjectBySlug((await params).subject)?.name ?? ""} formula sheet` };
}

/** Every formula and shortcut rule for a subject on one printable page. */
export default async function FormulaSheet({ params }: Params) {
  const { subject: slug } = await params;
  const subject = subjectBySlug(slug);
  if (!subject) notFound();
  return (
    <div className="page-shell max-w-6xl print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/learn" className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"><ArrowLeft size={15} />All topics</Link>
        <PrintButton />
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold">{subject.name} formula sheet</h1>
      <p className="mt-2 text-sm text-ink/60">Formulas, key facts and one-line shortcut rules, topic by topic.</p>
      {byStrand(slug).map(([strand, topics]) => (
        <section key={strand} className="mt-8 break-inside-avoid-page">
          <h2 className="eyebrow">{strand}</h2>
          <div className="mt-3 columns-1 gap-6 md:columns-2">
            {topics.map((topic) => (
              <div key={topic.topic} className="mb-5 break-inside-avoid rounded-xl border border-ink/10 bg-white p-4">
                <h3 className="font-display text-lg font-semibold"><Link href={`/learn/${slug}/${topicSlug(topic.topic)}`}>{topic.topic}</Link></h3>
                <ul className="mt-2 grid gap-1.5 text-sm">
                  {topic.formulas.map((formula) => (
                    <li key={formula.name + formula.formula}><span className="text-ink/55">{formula.name}: </span><span className="font-mono"><MathText>{formula.formula}</MathText></span></li>
                  ))}
                </ul>
                {topic.shortcuts.length > 0 && (
                  <ul className="mt-3 grid gap-1 border-t border-ink/10 pt-2 text-xs text-ink/70">
                    {topic.shortcuts.map((shortcut) => <li key={shortcut.name}><strong>⚡ {shortcut.name}:</strong> <MathText>{shortcut.rule}</MathText></li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
