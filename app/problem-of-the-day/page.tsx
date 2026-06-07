"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { PotdRunner } from "@/components/potd-runner";
import type { Question } from "@/lib/types";

export default function ProblemPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  useEffect(() => { fetch("/api/questions?roundType=PROBLEM_OF_THE_DAY&limit=1").then((response) => response.json()).then(setQuestions); }, []);
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Round 3" title="Problem of the Day" description="Set out your thinking clearly. For the MVP, your final answer is checked automatically and a coach can award method marks manually." />
      <div className="max-w-4xl">{questions[0] ? <PotdRunner question={questions[0]} /> : <div className="panel p-8">Loading today&apos;s problem...</div>}</div>
    </div>
  );
}
