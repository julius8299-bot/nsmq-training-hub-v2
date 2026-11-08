import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Lightbulb, Target } from "lucide-react";
import { MathText } from "@/components/math-text";
import { ShortcutLibrary } from "@/components/shortcut-library";
import { findTopic, notesFor, subjectBySlug, topicSlug } from "@/lib/learn/notes";

type Params = { params: Promise<{ subject: string; topic: string }> };

export async function generateMetadata({ params }: Params) {
  const { subject, topic } = await params;
  return { title: findTopic(subject, topic)?.topic ?? "Learn" };
}

export default async function TopicPage({ params }: Params) {
  const { subject: slug, topic: topicParam } = await params;
  const subject = subjectBySlug(slug);
  const notes = findTopic(slug, topicParam);
  if (!subject || !notes) notFound();
  const list = notesFor(slug);
  const index = list.indexOf(notes);
  const [previous, next] = [list[index - 1], list[index + 1]];
  return (
    <div className="page-shell max-w-5xl">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"><ArrowLeft size={15} />All topics</Link>
      <p className="eyebrow mt-6">{subject.name} · {notes.strand}{notes.university && " · University year 1–2"}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{notes.topic}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70"><MathText>{notes.summary}</MathText></p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="button-primary" href={`/practice?subject=${subject.subject}&topic=${encodeURIComponent(notes.topic)}`}><Target size={16} />Practise this topic</Link>
        <Link className="button-secondary" href={`/learn/${slug}/formulas`}>Whole formula sheet</Link>
      </div>

      <section className="panel mt-8 p-6">
        <h2 className="font-display text-2xl font-semibold">Key ideas</h2>
        <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-6">{notes.keyIdeas.map((idea) => <li key={idea}><MathText>{idea}</MathText></li>)}</ul>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="font-display text-2xl font-semibold">Formulas and facts</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {notes.formulas.map((formula) => (
            <div key={formula.name + formula.formula} className="rounded-xl bg-ink/[0.03] p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">{formula.name}</dt>
              <dd className="mt-1 font-mono text-[0.95rem]"><MathText>{formula.formula}</MathText></dd>
              {formula.note && <dd className="mt-1 text-xs text-ink/60"><MathText>{formula.note}</MathText></dd>}
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 rounded-[1.5rem] bg-ink p-6 text-white">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><Lightbulb className="text-gold" />Speed shortcuts</h2>
        <div className="mt-4 grid gap-4">
          {notes.shortcuts.map((shortcut) => (
            <div key={shortcut.name} className="rounded-xl bg-white/[0.06] p-4">
              <p className="font-bold text-gold">{shortcut.name}</p>
              <p className="mt-1 text-sm"><MathText>{shortcut.rule}</MathText></p>
              <p className="mt-2 text-sm text-white/70"><span className="font-bold text-white/90">Example: </span><MathText>{shortcut.example}</MathText></p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><AlertTriangle size={18} />Traps</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-6">{notes.traps.map((trap) => <li key={trap}><MathText>{trap}</MathText></li>)}</ul>
        </section>
        <section className="panel p-6">
          <h2 className="font-display text-xl font-semibold">How NSMQ asks it</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-6">{notes.nsmqTips.map((tip) => <li key={tip}><MathText>{tip}</MathText></li>)}</ul>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Worked shortcuts from past questions</h2>
        <p className="mb-4 mt-1 text-sm text-ink/60">One example per question pattern in the bank. Learn the move, then drill the pattern.</p>
        <ShortcutLibrary subject={subject.subject} topic={notes.topic} />
      </section>

      <nav className="mt-10 flex flex-wrap justify-between gap-3 text-sm font-bold">
        {previous ? <Link href={`/learn/${slug}/${topicSlug(previous.topic)}`}>← {previous.topic}</Link> : <span />}
        {next && <Link href={`/learn/${slug}/${topicSlug(next.topic)}`}>{next.topic} →</Link>}
      </nav>
    </div>
  );
}
