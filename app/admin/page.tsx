"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { AdminQuestionForm } from "@/components/admin-question-form";
import { PageHeading } from "@/components/page-heading";
import { QuestionImportUploader } from "@/components/question-import-uploader";
import type { Question } from "@/lib/types";

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | null>(null);
  const load = useCallback(() => { fetch("/api/questions?limit=100&includePrivate=true").then((response) => response.json()).then(setQuestions); }, []);
  useEffect(load, [load]);
  const remove = async (id: string) => {
    if (!window.confirm("Delete this question?")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    load();
  };
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Coach tools" title="Question administration" description="Create original material, import structured question sets, and keep a clear permission trail for every sourced item." />
      <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><ShieldCheck className="shrink-0" /><p><strong>Copyright guardrail:</strong> Seed data is original. Mark copied material as PRIVATE_REVIEW or NEEDS_PERMISSION until its use is confirmed.</p></div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]"><AdminQuestionForm key={editing?.id ?? "new"} question={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} /><QuestionImportUploader onImported={load} /></div>
      <section className="mt-10">
        <div className="flex items-center justify-between"><h2 className="font-display text-3xl font-semibold">Manage questions</h2><span className="text-sm font-bold text-ink/45">{questions.length} loaded</span></div>
        <div className="mt-4 grid gap-3">
          {questions.map((question) => (
            <div key={question.id} className="panel flex items-start justify-between gap-4 p-4">
              <div><p className="text-xs font-bold uppercase text-chemistry">{question.subject} · {question.roundType} · {question.sourceType}</p><p className="mt-1 font-semibold">{question.questionText}</p><p className="mt-1 text-xs text-ink/45">Permission: {question.permissionStatus} · Pattern: {question.repeatedPattern}</p></div>
              <div className="flex shrink-0 gap-1"><button type="button" aria-label="Edit question" className="grid size-9 place-items-center rounded-full bg-ink/5" onClick={() => { setEditing(question); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={16} /></button><button type="button" aria-label="Delete question" className="grid size-9 place-items-center rounded-full bg-red-50 text-red-600" onClick={() => remove(question.id)}><Trash2 size={16} /></button></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
