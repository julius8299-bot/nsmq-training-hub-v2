"use client";

import Link from "next/link";
import { CalendarCheck, Flame, Target, Zap } from "lucide-react";
import { SUBJECT_STYLES } from "@/lib/constants";
import type { PublicQuestion } from "@/lib/types";

export type DashboardStats = {
  attempts: number;
  accuracy: number;
  points: number;
  pointsThisWeek: number;
  dailyStreak: number;
  currentRun: number;
  bestRun: number;
  subjects: {
    subject: string;
    attempted: number;
    accuracy: number;
    strongestTopic: string;
    weakestTopic: string;
    recommendedTopic: string;
    topics: { topic: string; attempted: number; accuracy: number }[];
  }[];
  difficultyStats: { difficulty: string; attempted: number; accuracy: number }[];
  recommendedDifficulty: string;
  activity: { date: string; attempted: number; correct: number }[];
  problem: PublicQuestion | null;
};

export function TrainingRecord({ stats, practiceLinks = true }: { stats: DashboardStats; practiceLinks?: boolean }) {
  const maxDay = Math.max(1, ...stats.activity.map((day) => day.attempted));
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Target, "Accuracy", `${stats.accuracy}%`, `${stats.attempts} answered`],
          [CalendarCheck, "Daily streak", `${stats.dailyStreak} day${stats.dailyStreak === 1 ? "" : "s"}`, "Practise every day to grow it"],
          [Zap, "Points this week", stats.pointsThisWeek, `${stats.points} all time`],
          [Flame, "Correct in a row", stats.currentRun, `Best run: ${stats.bestRun}`],
        ].map(([Icon, label, value, note]) => {
          const Comp = Icon as typeof Target;
          return (
            <div key={String(label)} className="panel p-5">
              <Comp className="text-gold" />
              <p className="mt-5 text-sm font-bold text-ink/50">{label as string}</p>
              <p className="font-display text-4xl font-semibold">{String(value)}</p>
              <p className="mt-1 text-xs text-ink/45">{note as string}</p>
            </div>
          );
        })}
      </div>
      <section className="panel mt-8 p-5 sm:p-6">
        <p className="eyebrow">Last 14 days</p>
        <div className="mt-4 flex h-28 items-end gap-1.5" aria-label="Questions answered per day over the last 14 days">
          {stats.activity.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1" title={`${day.date}: ${day.correct}/${day.attempted} correct`}>
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t bg-chemistry/80" style={{ height: `${(day.attempted / maxDay) * 100}%`, minHeight: day.attempted ? 4 : 0 }} />
              </div>
              <span className="text-[10px] text-ink/40">{new Date(day.date + "T12:00:00Z").getUTCDate()}</span>
            </div>
          ))}
        </div>
      </section>
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
              <div className="flex items-center justify-between"><h2 className={`font-display text-2xl font-semibold ${style.text}`}>{item.subject}</h2><span className="text-sm font-bold">{item.attempted ? `${item.accuracy}%` : "—"}</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10"><div className={`h-full ${style.accent}`} style={{ width: `${item.accuracy}%` }} /></div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><p className="text-ink/45">Strongest</p><p className="font-bold">{item.strongestTopic}</p></div><div><p className="text-ink/45">Needs work</p><p className="font-bold">{item.weakestTopic}</p></div></div>
              <div className="mt-6 border-t border-ink/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">Topic breakdown</p>
                <div className="mt-3 grid gap-3">
                  {item.topics.map((topic) => (
                    <div key={topic.topic}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold">{topic.topic}</span>
                        <span className="text-ink/45">{topic.attempted ? `${topic.accuracy}% of ${topic.attempted}` : "No data yet"}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                        <div className={`h-full ${style.accent}`} style={{ width: `${topic.accuracy}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {practiceLinks && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink/[0.04] p-4">
                  <div><p className="text-xs font-bold uppercase text-ink/40">Recommended next</p><p className="font-bold">{item.recommendedTopic}</p></div>
                  <Link className="button-primary" href={`/practice?subject=${item.subject}&topic=${encodeURIComponent(item.recommendedTopic)}`}>Train this area</Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

