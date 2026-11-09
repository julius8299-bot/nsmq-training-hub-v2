"use client";

import { useCallback, useEffect, useState } from "react";
import { SubjectFilter } from "@/components/filters";
import { LoadState } from "@/components/load-state";
import { PageHeading } from "@/components/page-heading";
import { QuestionRunner } from "@/components/question-runner";
import { api, ApiError } from "@/lib/client/api";
import type { PublicQuestion } from "@/lib/types";

type Review = { questions: PublicQuestion[]; dueCount: number; nextDueAt: string | null; upcomingCount: number; mastered: number };

const when = (iso: string) => {
  const hours = Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000);
  return hours < 1 ? "within the hour" : hours < 24 ? `in about ${hours} hour${hours === 1 ? "" : "s"}` : `in ${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? "" : "s"}`;
};

export default function ReviewPage() {
  const [subject, setSubject] = useState("");
  const [data, setData] = useState<Review | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [runId, setRunId] = useState(0);
  const load = useCallback(() => {
    setError(null); setData(null);
    api<Review>(`/api/training/review?limit=10${subject ? `&subject=${subject}` : ""}`)
      .then((value) => { setData(value); setRunId((id) => id + 1); })
      .catch((caught) => setError(caught as ApiError));
  }, [subject]);
  useEffect(load, [load]);
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Practice loop" title="Mistake Review"
        description="Every question you miss comes back: straight away, then after 1, 3 and 7 days. Get it right four times in a row and it's mastered. Miss it again and the ladder restarts. Read the shortcut each time, even when you're right." />
      <div className="mb-5 grid gap-3 rounded-2xl bg-white p-4 shadow-soft sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <label className="text-sm font-bold">Subject<SubjectFilter value={subject} onChange={setSubject} includeAll /></label>
        <p className="text-sm"><span className="block text-xs font-bold uppercase text-ink/45">Due now</span><span className="font-display text-2xl font-semibold">{data?.dueCount ?? "–"}</span></p>
        <p className="text-sm"><span className="block text-xs font-bold uppercase text-ink/45">Scheduled</span><span className="font-display text-2xl font-semibold">{data?.upcomingCount ?? "–"}</span></p>
        <p className="text-sm"><span className="block text-xs font-bold uppercase text-ink/45">Mastered</span><span className="font-display text-2xl font-semibold text-emerald-700">{data?.mastered ?? "–"}</span></p>
      </div>
      <div className="max-w-4xl">
        <LoadState loading={!data && !error} error={error} onRetry={load} />
        {data && (data.questions.length
          ? <QuestionRunner runId={runId} questions={data.questions} mode="MISTAKE_REVIEW" onNewSet={load} />
          : <div className="panel p-8 text-center">
              <p className="font-display text-2xl font-semibold">Nothing due right now.</p>
              <p className="mt-2 text-ink/60">{data.nextDueAt ? `Your next review is due ${when(data.nextDueAt)}.` : "Missed questions from any round will appear here."}</p>
            </div>)}
      </div>
    </div>
  );
}
