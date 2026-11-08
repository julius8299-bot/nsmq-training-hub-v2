import type { PrismaClient } from "@prisma/client";
import { SUBJECTS } from "@/lib/constants";
import { studentVisible } from "@/lib/questions/visibility";
import { dailyStreak } from "./stats";
import { reviewSchedule } from "./review";

const DAY = 86_400_000;
const SUBJECT_NAMES: Record<string, string> = { MATHEMATICS: "Maths", PHYSICS: "Physics", CHEMISTRY: "Chemistry", BIOLOGY: "Biology" };
/** A different round gets extra practice each weekday, so every NSMQ round is trained every week. */
const ROTATION = [
  { mode: "RIDDLE", title: "Riddles", href: "/riddles", target: 3, detail: "Answer from the earliest clue you can." },
  { mode: "TRUE_FALSE", title: "True or false", href: "/true-false", target: 10, detail: "Decide in under 5 seconds; a wrong call costs a point." },
  { mode: "ELEMENT_DRILL", title: "Element drills", href: "/elements", target: 10, detail: "Symbols, groups and configurations at 10 seconds each." },
  { mode: "RIDDLE", title: "Riddles", href: "/riddles", target: 3, detail: "Answer from the earliest clue you can." },
  { mode: "TRUE_FALSE", title: "True or false", href: "/true-false", target: 10, detail: "Decide in under 5 seconds; a wrong call costs a point." },
  { mode: "ELEMENT_DRILL", title: "Element drills", href: "/elements", target: 10, detail: "Symbols, groups and configurations at 10 seconds each." },
  { mode: "FULL_CONTEST", title: "Full contest", href: "/full-contest", target: 10, detail: "Weekly dress rehearsal across all rounds." },
];

export type PlanStep = { id: string; title: string; detail: string; href: string; target: number; done: number; complete: boolean };

/**
 * Today's plan (Ghana time = GMT): Problem of the Day, mistakes due for review, the weakest topic,
 * a speed race, and one rotating round. Progress counts today's answers in each mode.
 */
export async function dailyPlan(db: PrismaClient, userId: string, now = new Date()) {
  const dayStart = new Date(Math.floor(now.getTime() / DAY) * DAY);
  const [today, recent, schedule, history] = await Promise.all([
    db.attempt.findMany({ where: { userId, createdAt: { gte: dayStart } }, select: { mode: true, question: { select: { subject: true, topic: true } } } }),
    db.attempt.findMany({
      where: { userId, countsTowardStats: true, createdAt: { gte: new Date(now.getTime() - 30 * DAY) }, mode: { notIn: ["ELEMENT_DRILL", "TEAM_CONTEST"] } },
      select: { isCorrect: true, question: { select: { subject: true, topic: true } } },
    }),
    reviewSchedule(db, userId, now),
    db.attempt.findMany({ where: { userId, countsTowardStats: true, createdAt: { gte: new Date(now.getTime() - 400 * DAY) } }, select: { createdAt: true } }),
  ]);
  const doneIn = (mode: string) => today.filter((attempt) => attempt.mode === mode).length;

  // Weakest topic: lowest accuracy with at least 5 answers in 30 days; otherwise a subject of the day.
  const topics = new Map<string, { subject: string; topic: string; total: number; correct: number }>();
  for (const attempt of recent) {
    const key = attempt.question.subject + "|" + attempt.question.topic;
    const entry = topics.get(key) ?? { subject: attempt.question.subject, topic: attempt.question.topic, total: 0, correct: 0 };
    entry.total += 1; if (attempt.isCorrect) entry.correct += 1;
    topics.set(key, entry);
  }
  const weakest = [...topics.values()].filter((entry) => entry.total >= 5).sort((a, b) => a.correct / a.total - b.correct / b.total)[0];
  let focus: { subject: string; topic: string; reason: string };
  if (weakest && weakest.correct / weakest.total < 0.8) {
    focus = { subject: weakest.subject, topic: weakest.topic, reason: `${Math.round((weakest.correct / weakest.total) * 100)}% in the last 30 days — your weakest topic.` };
  } else {
    const subject = SUBJECTS[Math.floor(now.getTime() / DAY) % SUBJECTS.length];
    const untried = await db.question.groupBy({ by: ["topic"], where: { subject, ...studentVisible }, _count: true, orderBy: { _count: { topic: "desc" } }, take: 30 });
    const seen = new Set([...topics.values()].filter((entry) => entry.subject === subject).map((entry) => entry.topic));
    const topic = untried.find((row) => !seen.has(row.topic))?.topic ?? untried[0]?.topic ?? "";
    focus = { subject, topic, reason: weakest ? "No weak topic right now, so cover new ground." : "Build your record: start with a core topic." };
  }
  const focusDone = today.filter((attempt) => attempt.mode === "SELF_PRACTICE" && attempt.question.subject === focus.subject && attempt.question.topic === focus.topic).length;
  const reviewTarget = Math.min(schedule.due.length + doneIn("MISTAKE_REVIEW"), 15);
  const rotation = ROTATION[new Date(now).getUTCDay()];

  const steps: PlanStep[] = [
    { id: "potd", title: "Problem of the Day", detail: "One long problem, full working, then study the marking scheme.", href: "/problem-of-the-day", target: 1, done: doneIn("PROBLEM_OF_THE_DAY"), complete: false },
    { id: "review", title: "Mistake review", detail: schedule.due.length ? `${schedule.due.length} missed question${schedule.due.length === 1 ? "" : "s"} due again. Each correct retry pushes it further out; four in a row and it's mastered.` : "Nothing due. Questions you miss come back here.", href: "/review", target: reviewTarget, done: doneIn("MISTAKE_REVIEW"), complete: false },
    { id: "focus", title: `Focus: ${focus.topic || SUBJECT_NAMES[focus.subject]}`, detail: `${SUBJECT_NAMES[focus.subject]} · ${focus.reason} Read the notes first, then 10 questions.`, href: `/practice?subject=${focus.subject}${focus.topic ? `&topic=${encodeURIComponent(focus.topic)}` : ""}`, target: 10, done: focusDone, complete: false },
    { id: "speed", title: "Speed race", detail: "10 quick questions. Use the shortcut, not the long method.", href: "/speed-race", target: 10, done: doneIn("SPEED_RACE"), complete: false },
    { id: "rotation", title: rotation.title, detail: rotation.detail, href: rotation.href, target: rotation.target, done: doneIn(rotation.mode), complete: false },
  ];
  for (const step of steps) step.complete = step.done >= step.target;
  return {
    date: dayStart.toISOString().slice(0, 10),
    steps,
    completed: steps.filter((step) => step.complete).length,
    streak: dailyStreak(history.map((attempt) => attempt.createdAt), now),
    review: { due: schedule.due.length, upcoming: schedule.upcoming.length, mastered: schedule.mastered, nextDueAt: schedule.upcoming[0]?.dueAt ?? null },
    focus,
  };
}
