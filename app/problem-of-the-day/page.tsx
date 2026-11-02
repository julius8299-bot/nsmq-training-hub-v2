"use client";

import { useEffect, useState } from "react";
import { DifficultyFilter } from "@/components/filters";
import { PageHeading } from "@/components/page-heading";
import { PotdRunner } from "@/components/potd-runner";
import type { Question } from "@/lib/types";

export default function ProblemPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [difficulty, setDifficulty] = useState("");
  useEffect(() => {
    const params = new URLSearchParams({
      roundType: "PROBLEM_OF_THE_DAY",
      limit: "1",
      ...(difficulty && { difficulty }),
    });
    fetch(`/api/questions?${params}`).then((response) => response.json()).then(setQuestions);
  }, [difficulty]);
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Round 3" title="Problem of the Day" description="Set out your thinking clearly. For the MVP, your final answer is checked automatically and a coach can award method marks manually." />
      <div className="mb-5 rounded-2xl bg-white p-4 shadow-soft">
        <label className="block max-w-sm text-sm font-bold">Difficulty
          <DifficultyFilter
            value={difficulty}
            onChange={setDifficulty}
            includeAll
            allLabel="Mixed"
            difficulties={["MEDIUM", "HARD", "NSMQ_FINAL_LEVEL"]}
          />
        </label>
      </div>
      <div className="max-w-4xl">{questions[0] ? <PotdRunner question={questions[0]} /> : <div className="panel p-8">Loading today&apos;s problem...</div>}</div>
    </div>
  );
}
