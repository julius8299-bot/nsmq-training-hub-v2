"use client";

import { useState } from "react";
import { DifficultyFilter, SubjectFilter } from "@/components/filters";
import { LoadState } from "@/components/load-state";
import { PageHeading } from "@/components/page-heading";
import { QuestionRunner } from "@/components/question-runner";
import { useTrainingSet } from "@/lib/client/use-training-set";

export default function RiddlesPage() {
  const [difficulty, setDifficulty] = useState("");
  const [subject, setSubject] = useState("");
  const set = useTrainingSet({ roundType: "RIDDLE", limit: "10", difficulty, subject });
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Round 5" title="Riddles" description="Commit early for more points or reveal another clue. You get one answer per riddle — recognition under pressure is the skill." />
      <div className="mb-5 grid max-w-2xl gap-3 rounded-2xl bg-white p-4 shadow-soft sm:grid-cols-2">
        <label className="block text-sm font-bold">Subject<SubjectFilter value={subject} onChange={setSubject} includeAll /></label>
        <label className="block text-sm font-bold">Difficulty<DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll allLabel="Mixed" /></label>
      </div>
      <div className="max-w-4xl">
        <LoadState loading={set.loading} error={set.error} onRetry={set.reload} label="Loading riddles…" />
        {!set.loading && !set.error && <QuestionRunner runId={set.version} questions={set.questions} mode="RIDDLE" timed={false} onNewSet={set.reload} />}
      </div>
    </div>
  );
}
