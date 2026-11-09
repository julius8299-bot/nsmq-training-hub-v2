"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client/api";

type Contest = { id: string; title: string; teamAScore: number; teamBScore: number; teamCScore: number; currentRound: number; createdAt: string; stateJson: string; quizmaster: { name: string } | null };

export function ContestHistory() {
  const [contests, setContests] = useState<Contest[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<{ contests: Contest[] }>("/api/contests").then((data) => setContests(data.contests)).catch((caught) => setError((caught as ApiError).message)); }, []);
  if (error) return <p role="alert" className="panel p-5 text-sm text-red-700">{error}</p>;
  if (!contests) return <p className="panel p-5 text-ink/50">Loading contests…</p>;
  if (!contests.length) return <p className="panel p-8 text-center text-ink/55">No saved contests yet. Run a team contest from Full Contest and press &ldquo;Save result&rdquo;.</p>;
  return (
    <div className="grid gap-3">
      {contests.map((contest) => {
        let teams = ["Team A", "Team B", "Team C"];
        try { const state = JSON.parse(contest.stateJson); if (Array.isArray(state.teams)) teams = state.teams; } catch { /* legacy record */ }
        const scores = [contest.teamAScore, contest.teamBScore, contest.teamCScore];
        const top = Math.max(...scores);
        return (
          <article key={contest.id} className="panel p-5">
            <p className="font-bold">{contest.title}</p>
            <p className="text-xs text-ink/50">{new Date(contest.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · reached round {contest.currentRound}{contest.quizmaster ? ` · ${contest.quizmaster.name}` : ""}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {teams.map((team, index) => <div key={index} className={`rounded-xl p-3 text-sm ${scores[index] === top ? "bg-gold/20 font-bold" : "bg-ink/[0.03]"}`}>{team}: {scores[index]}</div>)}
            </div>
          </article>
        );
      })}
    </div>
  );
}
