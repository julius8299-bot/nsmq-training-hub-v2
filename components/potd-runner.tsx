"use client";

import { useRef, useState } from "react";
import { ClipboardCheck, Eye, Lightbulb } from "lucide-react";
import { QuestionCard } from "@/components/question-card";
import { Timer } from "@/components/timer";
import type { Question } from "@/lib/types";

export function PotdRunner({ question }: { question: Question }) {
  const [answer, setAnswer] = useState("");
  const [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const startedAt = useRef(Date.now());

  const reveal = async (section: string) => {
    if (!saved) {
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          userAnswer: answer || "Self-check reveal",
          timeTakenSeconds: (Date.now() - startedAt.current) / 1000,
          mode: "PROBLEM_OF_THE_DAY",
          selfCheck: true,
        }),
      });
      setSaved(true);
    }
    setRevealed((current) => current.includes(section) ? current : [...current, section]);
  };

  const sections = [
    ["marking", "Marking scheme", question.markingScheme],
    ["shortcut", "Shortcut method", question.shortcutSolution],
    ["solution", "Full solution", question.fullSolution],
    ["examiner", "What the examiner is testing", question.examinerFocus],
  ] as const;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Timer seconds={question.timeLimitSeconds} running={!saved} resetKey={question.id} />
      </div>
      <QuestionCard question={question}>
        <textarea
          className="field min-h-40"
          placeholder="Set out your working and final answer here..."
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
        />
        <p className="mt-3 text-sm text-ink/50">Use self-check when you are ready. Revealing any section saves this as an attempted question.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {sections.map(([key, label]) => (
            <button key={key} type="button" className="button-secondary" onClick={() => reveal(key)}>
              {key === "shortcut" ? <Lightbulb size={17} /> : key === "marking" ? <ClipboardCheck size={17} /> : <Eye size={17} />}
              Reveal {label.toLowerCase()}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {sections.map(([key, label, content]) => revealed.includes(key) && (
            <div key={key} className={`rounded-2xl border p-5 ${key === "shortcut" ? "border-ink bg-ink text-white" : "border-ink/10 bg-ink/[0.03]"}`}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6">{content || "Not provided yet."}</p>
            </div>
          ))}
        </div>
      </QuestionCard>
    </div>
  );
}
