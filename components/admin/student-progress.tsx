"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TrainingRecord, type DashboardStats } from "@/components/training-record";
import { api, ApiError } from "@/lib/client/api";
import { ROUND_LABELS } from "@/lib/constants";

type Overview = {
  id: string; name: string; email: string; status: string; lastLoginAt: string | null; lastActiveAt: string | null;
  attempts: number; accuracy: number; pointsThisWeek: number; dailyStreak: number; weakestSubject: string | null;
  subjects: { subject: string; attempted: number; accuracy: number }[];
};
type Detail = {
  student: { id: string; name: string; email: string };
  dashboard: DashboardStats;
  recent: { id: string; userAnswer: string; isCorrect: boolean; pointsAwarded: number; timeTakenSeconds: number; mode: string; createdAt: string; lateSubmission: boolean; question: { subject: string; roundType: string; questionText: string; answer: string } }[];
};

const ago = (value: string | null) => {
  if (!value) return "never";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
};

export function StudentProgress() {
  const [students, setStudents] = useState<Overview[] | null>(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"name" | "accuracy" | "points" | "active">("points");
  const [detail, setDetail] = useState<Detail | null>(null);
  useEffect(() => { api<{ students: Overview[] }>("/api/admin/students").then((data) => setStudents(data.students)).catch((caught) => setError((caught as ApiError).message)); }, []);
  const sorted = useMemo(() => [...(students ?? [])].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "accuracy") return b.accuracy - a.accuracy;
    if (sort === "active") return (b.lastActiveAt ?? "").localeCompare(a.lastActiveAt ?? "");
    return b.pointsThisWeek - a.pointsThisWeek;
  }), [students, sort]);

  if (error) return <p role="alert" className="panel p-5 text-sm text-red-700">{error}</p>;
  if (detail) {
    return (
      <section>
        <button type="button" className="button-secondary mb-4" onClick={() => setDetail(null)}><ArrowLeft size={16} /> All students</button>
        <h2 className="mb-4 font-display text-3xl font-semibold">{detail.student.name} <span className="text-base font-normal text-ink/50">{detail.student.email}</span></h2>
        <TrainingRecord stats={detail.dashboard} practiceLinks={false} />
        <section className="panel mt-8 overflow-x-auto p-5">
          <h3 className="font-display text-2xl font-semibold">Latest answers</h3>
          <table className="mt-4 w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-ink/45"><tr><th className="py-2">When</th><th>Round</th><th>Question</th><th>Their answer</th><th>Result</th></tr></thead>
            <tbody>
              {detail.recent.map((item) => (
                <tr key={item.id} className="border-t border-ink/10 align-top">
                  <td className="py-2 pr-3 text-ink/55">{new Date(item.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="pr-3">{ROUND_LABELS[item.question.roundType]?.split(" - ")[1] ?? item.question.roundType}</td>
                  <td className="max-w-xs pr-3">{item.question.questionText.slice(0, 140)}</td>
                  <td className="pr-3">{item.userAnswer || "—"}<div className="text-xs text-ink/45">Key: {item.question.answer}</div></td>
                  <td className={item.isCorrect ? "text-emerald-700" : "text-red-700"}>{item.isCorrect ? "Correct" : "Wrong"}{item.lateSubmission ? " (late)" : ""} · {item.pointsAwarded} pts · {item.timeTakenSeconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    );
  }
  return (
    <section className="panel overflow-x-auto p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/60">{students ? `${students.length} students · last 120 days` : "Loading students…"}</p>
        <label className="text-sm font-bold">Sort by <select className="field ml-2 inline-block w-auto" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="points">Points this week</option><option value="accuracy">Accuracy</option><option value="active">Last active</option><option value="name">Name</option>
        </select></label>
      </div>
      <table className="mt-4 w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase text-ink/45"><tr><th className="py-2">Student</th><th>Answered</th><th>Accuracy</th><th>Pts (7 days)</th><th>Streak</th><th>Maths</th><th>Physics</th><th>Chem</th><th>Bio</th><th>Last active</th></tr></thead>
        <tbody>
          {sorted.map((student) => (
            <tr key={student.id} className="cursor-pointer border-t border-ink/10 hover:bg-ink/[0.03]" onClick={() => api<Detail>(`/api/admin/students/${student.id}`).then(setDetail).catch((caught) => setError((caught as ApiError).message))}>
              <td className="py-2 pr-3"><span className="font-bold underline decoration-ink/20">{student.name}</span>{student.status !== "ACTIVE" && <span className="ml-2 text-xs text-ink/45">({student.status.toLowerCase()})</span>}</td>
              <td>{student.attempts}</td>
              <td>{student.attempts ? `${student.accuracy}%` : "—"}</td>
              <td>{student.pointsThisWeek}</td>
              <td>{student.dailyStreak}d</td>
              {student.subjects.map((subject) => <td key={subject.subject} className={subject.attempted && subject.accuracy < 50 ? "font-bold text-red-700" : ""}>{subject.attempted ? `${subject.accuracy}%` : "—"}</td>)}
              <td className="text-ink/55">{ago(student.lastActiveAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {students && !students.length && <p className="mt-4 text-sm text-ink/55">No students yet. Invite them from the Members tab.</p>}
    </section>
  );
}
