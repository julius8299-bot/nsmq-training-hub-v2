"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { MathText, ShortcutView } from "@/components/math-text";

type Family = { patternFamily: string; topic: string; count: number; example: { id: string; questionText: string; preamble: string | null; answer: string; shortcutSolution: string } };

/** Worked shortcuts from the published bank, one per pattern family. */
export function ShortcutLibrary({ subject, topic }: { subject: string; topic?: string }) {
  const [families, setFamilies] = useState<Family[] | null>(null);
  useEffect(() => {
    const query = new URLSearchParams({ subject, ...(topic ? { topic } : {}) });
    api<{ families: Family[] }>("/api/learn/shortcuts?" + query).then((data) => setFamilies(data.families)).catch(() => setFamilies([]));
  }, [subject, topic]);
  if (!families) return <p className="text-sm text-ink/50">Loading worked shortcuts…</p>;
  if (!families.length) return <p className="text-sm text-ink/50">Worked examples from the question bank appear here as coaches approve them.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {families.map((family) => (
        <article key={family.patternFamily} className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/45">{family.topic} · {family.count} question{family.count === 1 ? "" : "s"}</p>
          <h3 className="mt-1 font-display text-lg font-semibold">{family.patternFamily}</h3>
          {family.example.preamble && <p className="mt-2 text-sm text-ink/60"><MathText>{family.example.preamble}</MathText></p>}
          <p className="mt-2 text-sm font-semibold"><MathText>{family.example.questionText}</MathText></p>
          <p className="mt-1 text-sm">Answer: <strong><MathText>{family.example.answer}</MathText></strong></p>
          <div className="mt-3 rounded-xl bg-ink p-4 text-sm text-white"><ShortcutView text={family.example.shortcutSolution} /></div>
          <Link className="mt-3 inline-block text-sm font-bold text-chemistry underline" href={`/practice?patternFamily=${encodeURIComponent(family.patternFamily)}`}>Drill this pattern</Link>
        </article>
      ))}
    </div>
  );
}
