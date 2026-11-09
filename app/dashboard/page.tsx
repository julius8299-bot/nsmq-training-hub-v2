"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Medal } from "lucide-react";
import { LoadState } from "@/components/load-state";
import { PageHeading } from "@/components/page-heading";
import { MotivationCorner } from "@/components/MotivationCorner";
import { api, ApiError } from "@/lib/client/api";
import { DailyPlan } from "@/components/daily-plan";
import { TrainingRecord, type DashboardStats } from "@/components/training-record";

type Leader = { userId: string; name: string; points: number; attempted: number; accuracy: number };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leaders, setLeaders] = useState<{ leaders: Leader[]; you: string } | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    setError(null);
    api<DashboardStats>("/api/dashboard").then(setStats).catch((caught) => setError(caught as ApiError));
    api<{ leaders: Leader[]; you: string }>("/api/leaderboard").then(setLeaders).catch(() => setLeaders(null));
  }, [version]);
  if (!stats) return <div className="page-shell"><LoadState loading={!error} error={error} onRetry={() => setVersion((value) => value + 1)} label="Loading your training record…" /></div>;

  return (
    <div className="page-shell">
      <PageHeading eyebrow="Your dashboard" title="Your training record" description="Track the patterns you own, the topics that need work, and your next best challenge." />
      <div className="mb-8"><DailyPlan /></div>
      <TrainingRecord stats={stats} />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {stats.problem && (
          <div className="panel overflow-hidden bg-ink p-7 text-white">
            <p className="eyebrow text-gold">Problem of the Day</p>
            <h2 className="mt-3 line-clamp-4 font-display text-2xl font-semibold">{stats.problem.questionText}</h2>
            <Link href="/problem-of-the-day" className="mt-6 inline-flex items-center gap-2 font-bold text-gold">Solve today&apos;s problem <ArrowRight size={17} /></Link>
          </div>
        )}
        <div className="panel p-6">
          <div className="flex items-center gap-2"><Medal className="text-gold" /><h2 className="font-display text-2xl font-semibold">This week&apos;s leaders</h2></div>
          {!leaders?.leaders.length ? <p className="mt-4 text-sm text-ink/50">No points yet this week. Be the first.</p> : (
            <ol className="mt-4 grid gap-2">
              {leaders.leaders.slice(0, 10).map((leader, index) => (
                <li key={leader.userId} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${leader.userId === leaders.you ? "bg-gold/20 font-bold" : "bg-ink/[0.03]"}`}>
                  <span><span className="mr-2 inline-block w-5 text-ink/40">{index + 1}</span>{leader.name}</span>
                  <span>{leader.points} pts · {leader.accuracy}%</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      <MotivationCorner />
    </div>
  );
}
