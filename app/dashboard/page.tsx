"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Flame, Target, Zap } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { MotivationCorner } from "@/components/MotivationCorner";
import { SUBJECT_STYLES } from "@/lib/constants";
import type { Question } from "@/lib/types";

type Stats = {
  attempts: number;
  accuracy: number;
  streak: number;
  subjects: {
    subject: string;
    attempted: number;
    accuracy: number;
    strongestTopic: string;
    weakestTopic: string;
    recommendedTopic: string;
    topics: { topic: string; attempted: number; accuracy: number }[];
  }[];
  difficultyStats: {
    difficulty: string;
    attempted: number;
    accuracy: number;
  }[];
  recommendedDifficulty: string;
  problem: Question | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { fetch("/api/dashboard").then((response) => response.json()).then(setStats); }, []);
  if (!stats) return <div className="page-shell text-ink/50">Loading your training record…</div>;

  return (
    <div className="page-shell">
      <PageHeading eyebrow="Demo student dashboard" title="Your training record" description="Track the patterns you own, the topics that need work, and your next best challenge." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [Target, "Accuracy", `${stats.accuracy}%`],
          [Zap, "Questions attempted", stats.attempts],
          [Flame, "Current streak", stats.streak],
        ].map(([Icon, label, value]) => {
          const Comp = Icon as typeof Target;
          return <div key={String(label)} className="panel p-5"><Comp className="text-gold" /><p className="mt-5 text-sm font-bold text-ink/50">{label as string}</p><p className="font-display text-4xl font-semibold">{String(value)}</p></div>;
        })}
      </div>
      <section className="panel mt-8 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Difficulty performance</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Accuracy by challenge level</h2>
          </div>
          <div className="rounded-2xl bg-gold/15 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">Recommended next difficulty</p>
            <p className="font-bold">{stats.recommendedDifficulty.replaceAll("_", " ")}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.difficultyStats.map((item) => (
            <div key={item.difficulty} className="rounded-2xl border border-ink/10 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{item.difficulty.replaceAll("_", " ")}</p>
              <p className="mt-2 font-display text-3xl font-semibold">{item.attempted ? `${item.accuracy}%` : "No data"}</p>
              <p className="mt-1 text-sm text-ink/45">{item.attempted} attempted</p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {stats.subjects.map((item) => {
          const style = SUBJECT_STYLES[item.subject];
          return (
            <div key={item.subject} className="panel p-5 sm:p-6">
              <div className="flex items-center justify-between"><h2 className={`font-display text-2xl font-semibold ${style.text}`}>{item.subject}</h2><span className="text-sm font-bold">{item.accuracy}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10"><div className={`h-full ${style.accent}`} style={{ width: `${item.accuracy}%` }} /></div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><p className="text-ink/45">Strongest</p><p className="font-bold">{item.strongestTopic}</p></div><div><p className="text-ink/45">Needs work</p><p className="font-bold">{item.weakestTopic}</p></div></div>
              <div className="mt-6 border-t border-ink/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">Topic breakdown</p>
                <div className="mt-3 grid gap-3">
                  {item.topics.map((topic) => (
                    <div key={topic.topic}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold">{topic.topic}</span>
                        <span className="text-ink/45">{topic.attempted ? `${topic.accuracy}%` : "No data yet"}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                        <div className={`h-full ${style.accent}`} style={{ width: `${topic.accuracy}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink/[0.04] p-4">
                <div><p className="text-xs font-bold uppercase text-ink/40">Recommended next</p><p className="font-bold">{item.recommendedTopic}</p></div>
                <Link className="button-primary" href={`/practice?subject=${item.subject}&topic=${encodeURIComponent(item.recommendedTopic)}`}>Train this weak area</Link>
              </div>
            </div>
          );
        })}
      </div>
      {stats.problem && (
        <div className="panel mt-8 overflow-hidden bg-ink p-7 text-white">
          <p className="eyebrow text-gold">Problem of the Day</p>
          <h2 className="mt-3 max-w-3xl font-display text-2xl font-semibold">{stats.problem.questionText}</h2>
          <Link href="/problem-of-the-day" className="mt-6 inline-flex items-center gap-2 font-bold text-gold">Solve today’s problem <ArrowRight size={17} /></Link>
        </div>
      )}
      <MotivationCorner />
    </div>
  );
}
