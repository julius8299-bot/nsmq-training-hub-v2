"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { PracticeRunner } from "@/components/practice-runner";
import type { Question } from "@/lib/types";

export default function TrueFalsePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  useEffect(() => { fetch("/api/questions?roundType=TRUE_FALSE&limit=20").then((response) => response.json()).then(setQuestions); }, []);
  return <div className="page-shell"><PageHeading eyebrow="Round 4" title="True or False" description="Read every word. A single qualifier can turn a familiar fact into a trap." /><div className="max-w-4xl"><PracticeRunner questions={questions} mode="TRUE_FALSE" /></div></div>;
}
