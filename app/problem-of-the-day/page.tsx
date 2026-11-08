"use client";

import { useEffect, useMemo, useState } from "react";
import { DifficultyFilter } from "@/components/filters";
import { LoadState } from "@/components/load-state";
import { PageHeading } from "@/components/page-heading";
import { QuestionRunner } from "@/components/question-runner";
import { api, ApiError } from "@/lib/client/api";
import type { PublicQuestion } from "@/lib/types";

type Today = { problem: PublicQuestion | null; date?: string; attemptedToday?: boolean };

export default function ProblemPage() {
  const [difficulty, setDifficulty] = useState("");
  const [today, setToday] = useState<Today | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [version, setVersion] = useState(0);
  const questions = useMemo(() => (today?.problem ? [today.problem] : []), [today]);
  useEffect(() => {
    setToday(null); setError(null);
    api<Today>("/api/potd" + (difficulty ? "?difficulty=" + difficulty : "")).then(setToday).catch((caught) => setError(caught as ApiError));
  }, [difficulty, version]);
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Round 3" title="Problem of the Day" description="One problem for the whole team, new every day at midnight. Set out your working, then give your final answer — it is checked automatically, and the marking scheme shows how the method marks are earned." />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-white p-4 shadow-soft">
        <label className="block w-full max-w-sm text-sm font-bold">Difficulty
          <DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll allLabel="Today's problem" difficulties={["MEDIUM", "HARD", "NSMQ_FINAL_LEVEL"]} />
        </label>
        {today?.date && <p className="text-sm font-bold text-ink/50">{new Date(today.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>}
      </div>
      {today?.attemptedToday && <p className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">You have already tried today&apos;s problem. Another try is saved as practice.</p>}
      <div className="max-w-4xl">
        <LoadState loading={!today && !error} error={error} onRetry={() => setVersion((value) => value + 1)} label="Loading today's problem…" />
        {today && <QuestionRunner questions={questions} mode="PROBLEM_OF_THE_DAY" emptyMessage="No Problem of the Day is available for this difficulty yet." />}
      </div>
    </div>
  );
}
