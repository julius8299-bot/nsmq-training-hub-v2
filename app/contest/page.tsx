"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Save, Users } from "lucide-react";
import { LoadState } from "@/components/load-state";
import { PageHeading } from "@/components/page-heading";
import { QuestionRunner } from "@/components/question-runner";
import { Scoreboard } from "@/components/scoreboard";
import { api, ApiError } from "@/lib/client/api";
import {
  CONTEST_DIFFICULTY_LABELS,
  CONTEST_MIX,
  CONTEST_TARGETS,
  shuffleQuestions,
  type ContestDifficulty,
} from "@/lib/contest-mix";
import { ROUND_LABELS, ROUND_TYPES } from "@/lib/constants";
import type { PublicQuestion } from "@/lib/types";

const STORAGE_KEY = "nsmq-team-contest-v1";
type Board = { teams: [string, string, string]; scores: [number, number, number] };
const EMPTY_BOARD: Board = { teams: ["Team A", "Team B", "Team C"], scores: [0, 0, 0] };

function loadBoard(): Board {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.teams) && Array.isArray(saved.scores) && saved.teams.length === 3) return saved;
  } catch { /* Storage can be unavailable (private mode); fall back to an empty board. */ }
  return EMPTY_BOARD;
}

export default function ContestPage() {
  const [contestMode, setContestMode] = useState<"SOLO" | "TEAM">("SOLO");
  const [contestDifficulty, setContestDifficulty] = useState<ContestDifficulty>("STANDARD");
  const [roundIndex, setRoundIndex] = useState(0);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [version, setVersion] = useState(0);
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [activeTeam, setActiveTeam] = useState(0);
  const [canHost, setCanHost] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [soloScore, setSoloScore] = useState(0);
  const round = ROUND_TYPES[roundIndex];

  useEffect(() => { setBoard(loadBoard()); }, []);
  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board)); } catch { /* Not essential. */ } }, [board]);
  useEffect(() => {
    api<{ user: { permissions: string[] } }>("/api/auth/session")
      .then((data) => setCanHost(data.user.permissions.includes("contest:host"))).catch(() => setCanHost(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    const mix = CONTEST_MIX[contestDifficulty][round];
    Promise.all(Object.entries(mix).map(([difficulty, limit]) =>
      api<{ questions: PublicQuestion[] }>("/api/training/questions?" + new URLSearchParams({ roundType: round, difficulty, limit: String(limit) }))
        .then((data) => data.questions)))
      .then((groups) => {
        if (cancelled) return;
        const distinct = [...new Map(groups.flat().map((question) => [question.questionText, question])).values()];
        setQuestions(shuffleQuestions(distinct).slice(0, CONTEST_TARGETS[round]));
      })
      .catch((caught) => { if (!cancelled) setError(caught as ApiError); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [contestDifficulty, round, version]);

  const scores = useMemo(() => Object.fromEntries(board.teams.map((team, index) => [team, board.scores[index]])), [board]);
  const addPoints = (team: number, points: number) => setBoard((current) => {
    const next = [...current.scores] as Board["scores"];
    next[team] += points;
    return { ...current, scores: next };
  });
  const onScore = contestMode === "TEAM" ? (points: number) => addPoints(activeTeam, points) : (points: number) => setSoloScore((value) => value + points);

  const saveResult = async () => {
    setSaveMessage("");
    try {
      await api("/api/contests", { body: {
        title: `${CONTEST_DIFFICULTY_LABELS[contestDifficulty]} — ${new Date().toLocaleDateString("en-GB")}`,
        teams: board.teams.map((name, index) => ({ name, score: board.scores[index] })),
        roundReached: roundIndex + 1, difficulty: contestDifficulty,
      } });
      setSaveMessage("Result saved. Coaches can see it under Admin → Contests.");
    } catch (caught) { setSaveMessage((caught as ApiError).message); }
  };

  return (
    <div className="page-shell">
      <PageHeading eyebrow="Five-round simulation" title="Full Contest" description="Run a focused solo contest, or put three teams on the board. Team scores are kept on this device until you reset them, and coaches can save the final result." />
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="panel p-5">
          <p className="text-sm font-bold">Contest mode</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["SOLO", "TEAM"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setContestMode(value)} className={`rounded-xl px-3 py-2 text-sm font-bold ${contestMode === value ? "bg-ink text-white" : "bg-ink/5"}`}>{value}</button>
            ))}
          </div>
          {contestMode === "TEAM" && (
            <>
              <label className="mt-4 block text-sm font-bold">Answering team
                <select className="field mt-1" value={activeTeam} onChange={(event) => setActiveTeam(Number(event.target.value))}>
                  {board.teams.map((team, index) => <option key={index} value={index}>{team}</option>)}
                </select>
              </label>
              <div className="mt-3 grid gap-2">
                {board.teams.map((team, index) => (
                  <input key={index} aria-label={`Name of team ${index + 1}`} className="field" maxLength={60} value={team}
                    onChange={(event) => setBoard((current) => { const teams = [...current.teams] as Board["teams"]; teams[index] = event.target.value; return { ...current, teams }; })} />
                ))}
              </div>
            </>
          )}
          <label className="mt-4 block text-sm font-bold">Contest difficulty
            <select className="field mt-1" value={contestDifficulty} onChange={(event) => setContestDifficulty(event.target.value as ContestDifficulty)}>
              {Object.entries(CONTEST_DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <div>
          {contestMode === "TEAM" ? (
            <>
              <Scoreboard scores={scores} editable onChange={(team, amount) => addPoints(board.teams.indexOf(team), amount)} />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" className="button-secondary" onClick={() => { if (window.confirm("Reset all three scores to zero?")) setBoard((current) => ({ ...current, scores: [0, 0, 0] })); }}><RotateCcw size={16} /> Reset scores</button>
                {canHost && <button type="button" className="button-primary" onClick={() => void saveResult()}><Save size={16} /> Save result</button>}
                {saveMessage && <p className="text-sm font-bold text-chemistry">{saveMessage}</p>}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-ink p-5 text-white"><p className="text-xs font-bold uppercase text-white/50">Your contest score</p><p className="font-display text-4xl font-semibold text-gold">{soloScore}</p></div>
          )}
        </div>
      </div>
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-white">
        <button type="button" aria-label="Previous round" disabled={roundIndex === 0} onClick={() => setRoundIndex((value) => value - 1)} className="grid size-10 place-items-center rounded-full bg-white/10 disabled:opacity-30"><ChevronLeft /></button>
        <div className="text-center"><p className="text-xs font-bold uppercase text-gold">Round {roundIndex + 1} of 5</p><h2 className="font-display text-xl font-semibold">{ROUND_LABELS[round]}</h2></div>
        <button type="button" aria-label="Next round" disabled={roundIndex === 4} onClick={() => setRoundIndex((value) => value + 1)} className="grid size-10 place-items-center rounded-full bg-white/10 disabled:opacity-30"><ChevronRight /></button>
      </div>
      <div className="max-w-4xl">
        <LoadState loading={loading} error={error} onRetry={() => setVersion((value) => value + 1)} />
        {!loading && !error && (
          <QuestionRunner
            runId={version * 10 + roundIndex}
            questions={questions}
            mode={contestMode === "TEAM" ? "TEAM_CONTEST" : "FULL_CONTEST"}
            timed={round !== "RIDDLE"}
            onScore={onScore}
            onNewSet={() => setVersion((value) => value + 1)}
          />
        )}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-ink/50"><Users size={16} /> Round 1 answers earn 3 points. Speed Race and True/False wrong answers cost 1 point; running out of time costs nothing. Team answers are not added to anyone&apos;s personal record.</p>
    </div>
  );
}
