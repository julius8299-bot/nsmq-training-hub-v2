"use client";

import { useState } from "react";
import { DifficultyFilter, SubjectFilter } from "@/components/filters";
import { LoadState } from "@/components/load-state";
import { PageHeading } from "@/components/page-heading";
import { QuestionRunner } from "@/components/question-runner";
import { useTrainingSet } from "@/lib/client/use-training-set";

export default function SpeedRacePage() {
  const [difficulty, setDifficulty] = useState("");
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState(0);
  const set = useTrainingSet({ roundType: "SPEED_RACE", limit: "20", difficulty, subject });
  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-4"><PageHeading eyebrow="Round 2" title="Speed Race" description="The clock starts as soon as the question appears. When it hits zero the answer is locked. Fast is useful; fast and correct wins contests." /><div className="mb-8 rounded-2xl bg-ink px-6 py-4 text-white"><p className="text-xs font-bold uppercase text-white/50">Race score</p><p className="font-display text-4xl font-semibold text-gold">{score}</p></div></div>
      <div className="mb-5 grid gap-3 rounded-2xl bg-white p-4 shadow-soft sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm font-bold">Subject<SubjectFilter value={subject} onChange={(value) => { setSubject(value); setScore(0); }} includeAll /></label>
        <label className="text-sm font-bold">Difficulty<DifficultyFilter value={difficulty} onChange={(value) => { setDifficulty(value); setScore(0); }} includeAll allLabel="Mixed" /></label>
        <p className="text-sm font-bold text-ink/55">Wrong answer = −1. No answer = 0.</p>
      </div>
      <div className="max-w-4xl">
        <LoadState loading={set.loading} error={set.error} onRetry={set.reload} />
        {!set.loading && !set.error && <QuestionRunner runId={set.version} questions={set.questions} mode="SPEED_RACE" onScore={(points) => setScore((value) => value + points)} onNewSet={() => { setScore(0); set.reload(); }} />}
      </div>
    </div>
  );
}
