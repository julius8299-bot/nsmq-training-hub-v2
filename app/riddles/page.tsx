"use client";

import { useEffect, useState } from "react";
import { DifficultyFilter } from "@/components/filters";
import { PageHeading } from "@/components/page-heading";
import { RiddleRunner } from "@/components/riddle-runner";
import type { Question } from "@/lib/types";

export default function RiddlesPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [difficulty, setDifficulty] = useState("");
  useEffect(() => {
    const params = new URLSearchParams({
      roundType: "RIDDLE",
      limit: "20",
      ...(difficulty && { difficulty }),
    });
    fetch(`/api/questions?${params}`).then((response) => response.json()).then(setQuestions);
  }, [difficulty]);
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Round 5" title="Riddles" description="Commit early for more points or reveal another clue. Recognition under pressure is the skill." />
      <div className="mb-5 rounded-2xl bg-white p-4 shadow-soft">
        <label className="block max-w-sm text-sm font-bold">Difficulty<DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll allLabel="Mixed" /></label>
      </div>
      <div className="max-w-4xl"><RiddleRunner questions={questions} /></div>
    </div>
  );
}
