"use client";

import { useEffect, useState } from "react";
import { DifficultyFilter } from "@/components/filters";
import { PageHeading } from "@/components/page-heading";
import { PracticeRunner } from "@/components/practice-runner";
import type { Question } from "@/lib/types";

export default function SpeedRacePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [difficulty, setDifficulty] = useState("");
  const [score, setScore] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams({
      roundType: "SPEED_RACE",
      limit: "20",
      ...(difficulty && { difficulty }),
    });
    setScore(0);
    fetch(`/api/questions?${params}`).then((response) => response.json()).then(setQuestions);
  }, [difficulty]);
  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-4"><PageHeading eyebrow="Round 2" title="Speed Race" description="The timer starts immediately. Fast is useful; fast and correct wins contests." /><div className="mb-8 rounded-2xl bg-ink px-6 py-4 text-white"><p className="text-xs font-bold uppercase text-white/50">Race score</p><p className="font-display text-4xl font-semibold text-gold">{score}</p></div></div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-soft">
        <label className="min-w-64 text-sm font-bold">Difficulty<DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll allLabel="Mixed" /></label>
        <p className="text-sm font-bold text-ink/55">Contest note: wrong answer = -1 point.</p>
      </div>
      <div className="max-w-4xl"><PracticeRunner questions={questions} mode="SPEED_RACE" onScore={(points) => setScore((value) => value + points)} /></div>
    </div>
  );
}
