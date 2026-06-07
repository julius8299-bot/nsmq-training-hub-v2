"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { AnswerInput } from "@/components/answer-input";
import { FeedbackPanel } from "@/components/feedback-panel";
import { QuestionCard } from "@/components/question-card";
import { Timer } from "@/components/timer";
import type { AttemptResult, Question } from "@/lib/types";

export function PracticeRunner({
  questions,
  mode,
  timed = true,
  onScore,
}: {
  questions: Question[];
  mode: string;
  timed?: boolean;
  onScore?: (points: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(Date.now());
  const question = questions[index];

  useEffect(() => {
    startedAt.current = Date.now();
  }, [index]);

  const submit = useCallback(async (answerOverride?: string) => {
    const submittedAnswer = answerOverride ?? answer;
    if (!question || submitting || result || !submittedAnswer.trim()) return;
    setSubmitting(true);
    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        userAnswer: submittedAnswer,
        timeTakenSeconds: (Date.now() - startedAt.current) / 1000,
        mode,
      }),
    });
    const data = await response.json();
    setResult(data);
    onScore?.(data.pointsAwarded);
    setSubmitting(false);
  }, [answer, mode, onScore, question, result, submitting]);

  if (!questions.length) {
    return <div className="panel p-8 text-center text-ink/55">No questions match this training set yet.</div>;
  }

  const next = () => {
    setIndex((value) => (value + 1) % questions.length);
    setAnswer("");
    setResult(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full bg-chemistry transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        {timed && (
          <Timer
            seconds={question.timeLimitSeconds}
            running={!result}
            resetKey={question.id}
          />
        )}
      </div>
      <QuestionCard question={question} index={index} total={questions.length}>
        <AnswerInput
          value={answer}
          onChange={setAnswer}
          onSubmit={submit}
          disabled={submitting || Boolean(result)}
          multiline={question.roundType === "PROBLEM_OF_THE_DAY"}
          trueFalse={question.roundType === "TRUE_FALSE"}
        />
        {result && <FeedbackPanel question={question} isCorrect={result.isCorrect} points={result.pointsAwarded} />}
        {result && (
          <button type="button" className="button-primary mt-5 w-full sm:w-auto" onClick={next}>
            {index === questions.length - 1 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
            {index === questions.length - 1 ? "Train again" : "Next question"}
          </button>
        )}
      </QuestionCard>
    </div>
  );
}
