"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { PracticeRunner } from "@/components/practice-runner";
import { RiddleRunner } from "@/components/riddle-runner";
import { Scoreboard } from "@/components/scoreboard";
import { ROUND_LABELS, ROUND_TYPES } from "@/lib/constants";
import type { Question } from "@/lib/types";

export default function ContestPage() {
  const [contestMode, setContestMode] = useState<"SOLO" | "TEAM">("SOLO");
  const [roundIndex, setRoundIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scores, setScores] = useState({ "Team A": 0, "Team B": 0, "Team C": 0 });
  const [activeTeam, setActiveTeam] = useState("Team A");
  const round = ROUND_TYPES[roundIndex];

  useEffect(() => {
    fetch(`/api/questions?roundType=${round}&limit=${round === "PROBLEM_OF_THE_DAY" ? 1 : 5}`)
      .then((response) => response.json())
      .then(setQuestions);
  }, [round]);

  const scoreHandler = useMemo(
    () => (points: number) => {
      setScores((current) => ({ ...current, [activeTeam]: current[activeTeam as keyof typeof current] + points }));
    },
    [activeTeam],
  );

  return (
    <div className="page-shell">
      <PageHeading eyebrow="Five-round simulation" title="Full Contest" description="Run a focused solo contest or place three teams on the board. Coaches can adjust scores at any time." />
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="panel p-5">
          <p className="text-sm font-bold">Contest mode</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["SOLO", "TEAM"] as const).map((value) => <button key={value} type="button" onClick={() => setContestMode(value)} className={`rounded-xl px-3 py-2 text-sm font-bold ${contestMode === value ? "bg-ink text-white" : "bg-ink/5"}`}>{value}</button>)}
          </div>
          {contestMode === "TEAM" && (
            <label className="mt-4 block text-sm font-bold">Answering team
              <select className="field mt-1" value={activeTeam} onChange={(event) => setActiveTeam(event.target.value)}>{Object.keys(scores).map((team) => <option key={team}>{team}</option>)}</select>
            </label>
          )}
        </div>
        <Scoreboard scores={scores} editable={contestMode === "TEAM"} onChange={(team, amount) => setScores((current) => ({ ...current, [team]: current[team as keyof typeof current] + amount }))} />
      </div>
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-white">
        <button type="button" disabled={roundIndex === 0} onClick={() => setRoundIndex((value) => value - 1)} className="grid size-10 place-items-center rounded-full bg-white/10 disabled:opacity-30"><ChevronLeft /></button>
        <div className="text-center"><p className="text-xs font-bold uppercase text-gold">Round {roundIndex + 1} of 5</p><h2 className="font-display text-xl font-semibold">{ROUND_LABELS[round]}</h2></div>
        <button type="button" disabled={roundIndex === 4} onClick={() => setRoundIndex((value) => value + 1)} className="grid size-10 place-items-center rounded-full bg-white/10 disabled:opacity-30"><ChevronRight /></button>
      </div>
      <div className="max-w-4xl">
        {round === "RIDDLE" ? <RiddleRunner questions={questions} mode="FULL_CONTEST" onScore={contestMode === "TEAM" ? scoreHandler : undefined} /> : <PracticeRunner key={round} questions={questions} mode="FULL_CONTEST" timed={round !== "PROBLEM_OF_THE_DAY"} onScore={contestMode === "TEAM" ? scoreHandler : undefined} />}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-ink/50"><Users size={16} /> Round 1 main questions award 3 points. Coach-controlled bonus scoring is available from the scoreboard.</p>
    </div>
  );
}
