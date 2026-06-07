"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { RiddleRunner } from "@/components/riddle-runner";
import type { Question } from "@/lib/types";

export default function RiddlesPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  useEffect(() => { fetch("/api/questions?roundType=RIDDLE&limit=20").then((response) => response.json()).then(setQuestions); }, []);
  return <div className="page-shell"><PageHeading eyebrow="Round 5" title="Riddles" description="Commit early for more points or reveal another clue. Recognition under pressure is the skill." /><div className="max-w-4xl"><RiddleRunner questions={questions} /></div></div>;
}
