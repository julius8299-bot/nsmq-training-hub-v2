import type { PrismaClient } from "@prisma/client";
import { DIFFICULTIES, SUBJECTS, SUBJECT_TOPICS } from "@/lib/constants";
import { problemOfTheDay } from "./questions";

type AttemptRow = {
  isCorrect: boolean; pointsAwarded: number; createdAt: Date;
  question: { subject: string; topic: string; difficulty: string };
};
const DAY = 86_400_000;
const dayNumber = (date: Date) => Math.floor(date.getTime() / DAY); // GMT = Ghana time

/** Consecutive days with at least one counted answer, ending today or yesterday. */
export function dailyStreak(dates: Date[], now = new Date()) {
  const days = new Set(dates.map(dayNumber));
  let day = dayNumber(now);
  if (!days.has(day)) day -= 1;
  let streak = 0;
  while (days.has(day)) { streak += 1; day -= 1; }
  return streak;
}

function accuracy(items: { isCorrect: boolean }[]) {
  return items.length ? Math.round((items.filter((item) => item.isCorrect).length / items.length) * 100) : 0;
}

export function summarize(attempts: AttemptRow[], now = new Date()) {
  const ordered = [...attempts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  let currentRun = 0;
  for (const attempt of ordered) { if (!attempt.isCorrect) break; currentRun += 1; }
  let bestRun = 0; let run = 0;
  for (const attempt of [...ordered].reverse()) { run = attempt.isCorrect ? run + 1 : 0; bestRun = Math.max(bestRun, run); }
  const weekAgo = now.getTime() - 7 * DAY;

  const subjects = SUBJECTS.map((subject) => {
    const items = attempts.filter((attempt) => attempt.question.subject === subject);
    const byTopic = new Map<string, AttemptRow[]>();
    for (const item of items) byTopic.set(item.question.topic, [...(byTopic.get(item.question.topic) ?? []), item]);
    const topicNames = [...new Set([...SUBJECT_TOPICS[subject], ...byTopic.keys()])];
    const topics = topicNames.map((topic) => ({ topic, attempted: byTopic.get(topic)?.length ?? 0, accuracy: accuracy(byTopic.get(topic) ?? []) }));
    const attempted = topics.filter((topic) => topic.attempted > 0).sort((a, b) => b.accuracy - a.accuracy);
    const recommended = [...topics].sort((a, b) => {
      if (a.attempted === 0 && b.attempted !== 0) return -1;
      if (b.attempted === 0 && a.attempted !== 0) return 1;
      return a.accuracy - b.accuracy;
    })[0]?.topic ?? "Start training";
    return {
      subject, attempted: items.length, accuracy: accuracy(items),
      strongestTopic: attempted[0]?.topic ?? "Start training",
      weakestTopic: attempted.length > 1 ? attempted.at(-1)!.topic : "No data yet",
      recommendedTopic: recommended, topics,
    };
  });

  const difficultyStats = DIFFICULTIES.map((difficulty) => {
    const items = attempts.filter((attempt) => attempt.question.difficulty === difficulty);
    return { difficulty, attempted: items.length, accuracy: accuracy(items) };
  });
  const weak = difficultyStats.find((item) => item.attempted > 0 && item.accuracy < 60);
  const mastered = difficultyStats.reduce((highest, item, index) => item.attempted >= 3 && item.accuracy >= 75 ? index : highest, -1);
  const recommendedDifficulty = weak?.difficulty ?? DIFFICULTIES[Math.min(mastered + 1, DIFFICULTIES.length - 1)];

  const activity = Array.from({ length: 14 }, (_, offset) => {
    const day = dayNumber(now) - 13 + offset;
    const items = attempts.filter((attempt) => dayNumber(attempt.createdAt) === day);
    return { date: new Date(day * DAY).toISOString().slice(0, 10), attempted: items.length, correct: items.filter((item) => item.isCorrect).length };
  });

  return {
    attempts: attempts.length,
    accuracy: accuracy(attempts),
    points: attempts.reduce((sum, attempt) => sum + attempt.pointsAwarded, 0),
    pointsThisWeek: attempts.filter((attempt) => attempt.createdAt.getTime() >= weekAgo).reduce((sum, attempt) => sum + attempt.pointsAwarded, 0),
    dailyStreak: dailyStreak(attempts.map((attempt) => attempt.createdAt), now),
    currentRun, bestRun,
    // Kept for older clients: "streak" used to mean consecutive correct answers.
    streak: currentRun,
    lastActiveAt: ordered[0]?.createdAt ?? null,
    subjects, difficultyStats, recommendedDifficulty, activity,
  };
}

export async function loadStudentAttempts(db: PrismaClient, userId: string) {
  return db.attempt.findMany({
    where: { userId, countsTowardStats: true },
    select: { isCorrect: true, pointsAwarded: true, createdAt: true, question: { select: { subject: true, topic: true, difficulty: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function buildDashboard(db: PrismaClient, userId: string) {
  const [attempts, potd] = await Promise.all([loadStudentAttempts(db, userId), problemOfTheDay(db)]);
  return { ...summarize(attempts), problem: potd?.question ?? null };
}

/** Coach overview: one row per student. */
export async function studentOverview(db: PrismaClient) {
  const students = await db.user.findMany({
    where: { roleId: "STUDENT" },
    select: { id: true, name: true, email: true, status: true, lastLoginAt: true },
    orderBy: { name: "asc" },
  });
  const since = new Date(Date.now() - 120 * DAY);
  const attempts = await db.attempt.findMany({
    where: { userId: { in: students.map((student) => student.id) }, countsTowardStats: true, createdAt: { gte: since } },
    select: { userId: true, isCorrect: true, pointsAwarded: true, createdAt: true, question: { select: { subject: true, topic: true, difficulty: true } } },
  });
  const byUser = new Map<string, AttemptRow[]>();
  for (const { userId, ...attempt } of attempts) byUser.set(userId, [...(byUser.get(userId) ?? []), attempt]);
  return students.map((student) => {
    const summary = summarize(byUser.get(student.id) ?? []);
    const weakest = summary.subjects.filter((subject) => subject.attempted >= 3).sort((a, b) => a.accuracy - b.accuracy)[0];
    return {
      ...student,
      attempts: summary.attempts, accuracy: summary.accuracy, pointsThisWeek: summary.pointsThisWeek,
      dailyStreak: summary.dailyStreak, lastActiveAt: summary.lastActiveAt,
      subjects: summary.subjects.map(({ subject, attempted, accuracy }) => ({ subject, attempted, accuracy })),
      weakestSubject: weakest?.subject ?? null,
      activity: summary.activity,
    };
  });
}

/** Weekly points among students (counted attempts only). */
export async function weeklyLeaderboard(db: PrismaClient, limit = 20) {
  const since = new Date(Date.now() - 7 * DAY);
  const totals = await db.attempt.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since }, countsTowardStats: true, user: { roleId: "STUDENT", status: "ACTIVE" } },
    _sum: { pointsAwarded: true }, _count: { _all: true },
  });
  const correct = await db.attempt.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since }, countsTowardStats: true, isCorrect: true, user: { roleId: "STUDENT", status: "ACTIVE" } },
    _count: { _all: true },
  });
  const correctBy = new Map(correct.map((row) => [row.userId, row._count._all]));
  const names = new Map((await db.user.findMany({ where: { id: { in: totals.map((row) => row.userId) } }, select: { id: true, name: true } })).map((user) => [user.id, user.name]));
  return totals
    .map((row) => ({
      userId: row.userId, name: names.get(row.userId) ?? "Student",
      points: row._sum.pointsAwarded ?? 0, attempted: row._count._all,
      accuracy: row._count._all ? Math.round(((correctBy.get(row.userId) ?? 0) / row._count._all) * 100) : 0,
    }))
    .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy)
    .slice(0, limit);
}
