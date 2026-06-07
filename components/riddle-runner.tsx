"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Lightbulb } from "lucide-react";
import { AnswerInput } from "@/components/answer-input";
import { FeedbackPanel } from "@/components/feedback-panel";
import { QuestionCard } from "@/components/question-card";
import type { AttemptResult, Question } from "@/lib/types";

export function RiddleRunner({ questions, mode = "RIDDLE", onScore }: { questions: Question[]; mode?: string; onScore?: (points: number) => void }) {
  const [index, setIndex] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const started = useRef(Date.now());
  const question = questions[index];
  useEffect(() => { started.current = Date.now(); }, [index]);

  if (!question) return <div className="panel p-8">Loading riddles…</div>;
  const clues = question.riddleClues ?? [];
  const currentPoints = clues[Math.max(0, cluesShown - 1)]?.points ?? Math.max(2, 6 - cluesShown);

  const submit = async (answerOverride?: string) => {
    const submittedAnswer = answerOverride ?? answer;
    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, userAnswer: submittedAnswer, timeTakenSeconds: (Date.now() - started.current) / 1000, mode, riddlePoints: currentPoints }),
    });
    const data = await response.json();
    setResult(data);
    onScore?.(data.pointsAwarded);
  };

  const next = () => {
    setIndex((value) => (value + 1) % questions.length);
    setCluesShown(1);
    setAnswer("");
    setResult(null);
  };

  return (
    <QuestionCard question={question} index={index} total={questions.length}>
      <div className="space-y-3">
        {clues.slice(0, cluesShown).map((clue) => (
          <div key={clue.clueNumber} className="flex gap-3 rounded-2xl bg-ink/5 p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-bold text-gold">{clue.clueNumber}</span>
            <div><p className="text-xs font-bold uppercase text-ink/40">{clue.points} points</p><p className="mt-1">{clue.clueText}</p></div>
          </div>
        ))}
      </div>
      {!result && cluesShown < 4 && (
        <button type="button" className="button-secondary mt-4" onClick={() => setCluesShown((value) => value + 1)}><Eye size={17} /> Reveal next clue</button>
      )}
      <div className="mt-5"><AnswerInput value={answer} onChange={setAnswer} onSubmit={submit} disabled={Boolean(result)} /></div>
      {!result && <p className="mt-3 flex items-center gap-2 text-sm font-bold text-chemistry"><Lightbulb size={16} /> Answer now for {currentPoints} points.</p>}
      {result && <FeedbackPanel question={question} isCorrect={result.isCorrect} points={result.pointsAwarded} />}
      {result && <button type="button" className="button-primary mt-5" onClick={next}>Next riddle</button>}
    </QuestionCard>
  );
}
