"use client";

import { useEffect, useState } from "react";
import { DifficultyFilter } from "@/components/filters";
import { PageHeading } from "@/components/page-heading";
import { PracticeRunner } from "@/components/practice-runner";
import type { Question } from "@/lib/types";

export default function TrueFalsePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [difficulty, setDifficulty] = useState("");
  useEffect(() => {
    const params = new URLSearchParams({
      roundType: "TRUE_FALSE",
      limit: "20",
      ...(difficulty && { difficulty }),
    });
    fetch(`/api/questions?${params}`).then((response) => response.json()).then(setQuestions);
  }, [difficulty]);
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Round 4" title="True or False" description="Read every word. A single qualifier can turn a familiar fact into a trap." />
      <div className="mb-5 rounded-2xl bg-white p-4 shadow-soft">
        <label className="block max-w-sm text-sm font-bold">Difficulty<DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll allLabel="Mixed" /></label>
      </div>
      <div className="max-w-4xl"><PracticeRunner questions={questions} mode="TRUE_FALSE" /></div>
    </div>
  );
}
