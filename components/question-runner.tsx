"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import { AnswerInput } from "@/components/answer-input";
import { FeedbackPanel } from "@/components/feedback-panel";
import { QuestionCard } from "@/components/question-card";
import { Timer } from "@/components/timer";
import { api, ApiError, signInHref } from "@/lib/client/api";
import type { AttemptResult, Draw, PublicQuestion, RiddleClue } from "@/lib/types";

type Props = {
  questions: PublicQuestion[];
  mode: string;
  /** Practice / element drills: the student's chosen clock (null = untimed). Other modes use the question's limit. */
  timeLimitSeconds?: number | null;
  timed?: boolean;
  onScore?: (points: number) => void;
  /** Called from the end-of-set screen to load a fresh random set. */
  onNewSet?: () => void;
  emptyMessage?: string;
  /** Changes when the page loads a new set, so a repeat of the same questions still starts fresh. */
  runId?: number;
};

type Tally = { answered: number; correct: number; points: number };

/** A new set of questions (different IDs) starts a fresh run with a clean score. */
export function QuestionRunner(props: Props) {
  return <Runner key={(props.runId ?? 0) + ":" + props.questions.map((question) => question.id).join(",")} {...props} />;
}

function Runner({ questions, mode, timeLimitSeconds, timed = true, onScore, onNewSet, emptyMessage }: Props) {
  const [index, setIndex] = useState(0);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [clues, setClues] = useState<RiddleClue[]>([]);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [tally, setTally] = useState<Tally>({ answered: 0, correct: 0, points: 0 });
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const startedFor = useRef<string | null>(null);
  const submitting = useRef(false);

  const start = useCallback(async () => {
    if (!question) return;
    setError(null); setDraw(null); setClues([]); setResult(null); setAnswer("");
    try {
      const next = await api<Draw>("/api/training/draws", {
        body: { questionId: question.id, mode, ...(timeLimitSeconds !== undefined && { timeLimitSeconds }) },
      });
      setDraw(next); setClues(next.clues);
    } catch (caught) { setError(caught as ApiError); }
  }, [question, mode, timeLimitSeconds]);

  useEffect(() => {
    // One draw per question shown (React may run effects twice in development).
    const key = question ? question.id + ":" + index : null;
    if (!key || startedFor.current === key) return;
    startedFor.current = key;
    void start();
  }, [question, index, start]);

  const submit = useCallback(async (options: { answer?: string; timedOut?: boolean; reveal?: boolean } = {}) => {
    const value = (options.answer ?? answer).trim();
    if (!draw || result || submitting.current) return;
    if (!value && !options.timedOut && !options.reveal) return;
    submitting.current = true; setBusy(true); setError(null);
    try {
      const outcome = await api<AttemptResult>("/api/attempts", {
        body: { drawId: draw.drawId, userAnswer: value, ...(options.timedOut && { timedOut: true }), ...(options.reveal && { reveal: true }) },
      });
      setResult(outcome);
      if (!outcome.revealOnly) {
        setTally((current) => ({ answered: current.answered + 1, correct: current.correct + (outcome.isCorrect ? 1 : 0), points: current.points + outcome.pointsAwarded }));
        onScore?.(outcome.pointsAwarded);
      }
    } catch (caught) {
      setError(caught as ApiError);
    } finally { submitting.current = false; setBusy(false); }
  }, [answer, draw, result, onScore]);

  const revealClue = async () => {
    if (!draw || result) return;
    setBusy(true); setError(null);
    try { setClues((await api<{ clues: RiddleClue[] }>(`/api/training/draws/${draw.drawId}/clue`, { body: {} })).clues); }
    catch (caught) { setError(caught as ApiError); }
    finally { setBusy(false); }
  };

  const next = () => {
    if (index === questions.length - 1) { setFinished(true); return; }
    setIndex((value) => value + 1);
  };

  if (!questions.length) {
    return <div className="panel p-8 text-center text-ink/55">{emptyMessage ?? "No questions match this training set yet. Try other filters."}</div>;
  }

  if (finished) {
    const accuracy = tally.answered ? Math.round((tally.correct / tally.answered) * 100) : 0;
    return (
      <div className="panel p-8 text-center">
        <Trophy className="mx-auto text-gold" size={36} />
        <h2 className="mt-4 font-display text-3xl font-semibold">Set complete</h2>
        <p className="mt-2 text-ink/60">{tally.correct} of {tally.answered} correct ({accuracy}%) · {tally.points} point{tally.points === 1 ? "" : "s"}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onNewSet && <button type="button" className="button-primary" onClick={onNewSet}><RotateCcw size={17} /> New set of questions</button>}
          <Link href="/dashboard" className="button-secondary">See my progress</Link>
        </div>
      </div>
    );
  }

  const riddle = question.roundType === "RIDDLE";
  const potd = question.roundType === "PROBLEM_OF_THE_DAY";
  const limit = draw?.timeLimitSeconds ?? null;
  const currentPoints = clues.at(-1)?.points ?? 5;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full bg-chemistry transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm font-bold text-ink/50">{tally.points} pts</span>
        {timed && limit !== null && draw && (
          <Timer seconds={limit} running={!result && !busy} resetKey={draw.drawId} onExpire={() => void submit({ timedOut: true })} />
        )}
      </div>
      <QuestionCard question={question} index={index} total={questions.length}>
        {error && (
          <div role="alert" className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
            <p className="font-bold">{error.message}</p>
            {error.status === 401
              ? <Link className="mt-2 inline-block font-bold underline" href={signInHref()}>Sign in again</Link>
              : !draw ? <button type="button" className="mt-2 font-bold underline" onClick={() => void start()}>Try again</button> : null}
          </div>
        )}
        {!draw && !error && <p className="text-sm text-ink/50">Getting your question ready…</p>}
        {draw && riddle && (
          <div className="mb-5 space-y-3">
            {clues.map((clue) => (
              <div key={clue.clueNumber} className="flex gap-3 rounded-2xl bg-ink/5 p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-bold text-gold">{clue.clueNumber}</span>
                <div><p className="text-xs font-bold uppercase text-ink/40">{clue.points} points</p><p className="mt-1">{clue.clueText}</p></div>
              </div>
            ))}
            {!result && clues.length < question.clueCount && (
              <button type="button" className="button-secondary" disabled={busy} onClick={() => void revealClue()}><Eye size={17} /> Reveal next clue</button>
            )}
            {!result && <p className="flex items-center gap-2 text-sm font-bold text-chemistry"><Lightbulb size={16} /> Answer now for {currentPoints} points.</p>}
          </div>
        )}
        {draw && (
          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSubmit={(value) => void submit({ answer: value })}
            disabled={busy || Boolean(result)}
            multiline={potd}
            trueFalse={question.roundType === "TRUE_FALSE"}
          />
        )}
        {draw && potd && !result && (
          <button type="button" className="button-secondary mt-3" disabled={busy} onClick={() => void submit({ reveal: true })}>
            <Eye size={17} /> I&apos;m stuck — show the solution
          </button>
        )}
        {result && <FeedbackPanel result={result} />}
        {result && (
          <button type="button" className="button-primary mt-5 w-full sm:w-auto" onClick={next}>
            {index === questions.length - 1 ? "Finish set" : "Next question"} <ArrowRight size={17} />
          </button>
        )}
      </QuestionCard>
    </div>
  );
}
