import { NextResponse } from "next/server";
import { DIFFICULTIES, SUBJECTS, SUBJECT_TOPICS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await prisma.user.findUnique({ where: { email: "student@nsmqhub.local" } });
  const attempts = user
    ? await prisma.attempt.findMany({
        where: { userId: user.id },
        include: { question: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const subjects = SUBJECTS.map((subject) => {
    const items = attempts.filter((attempt) => attempt.question.subject === subject);
    const correct = items.filter((attempt) => attempt.isCorrect).length;
    const topicStats = new Map<string, { total: number; correct: number }>();
    items.forEach((attempt) => {
      const current = topicStats.get(attempt.question.topic) ?? { total: 0, correct: 0 };
      current.total += 1;
      current.correct += attempt.isCorrect ? 1 : 0;
      topicStats.set(attempt.question.topic, current);
    });
    const topics = SUBJECT_TOPICS[subject].map((topic) => {
      const stats = topicStats.get(topic) ?? { total: 0, correct: 0 };
      return {
        topic,
        attempted: stats.total,
        accuracy: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
      };
    });
    const attemptedTopics = topics.filter((topic) => topic.attempted > 0);
    const sorted = [...attemptedTopics].sort(
      (a, b) => b.accuracy - a.accuracy,
    );
    const recommended =
      [...topics].sort((a, b) => {
        if (a.attempted === 0 && b.attempted !== 0) return -1;
        if (b.attempted === 0 && a.attempted !== 0) return 1;
        return a.accuracy - b.accuracy;
      })[0]?.topic ?? "Start training";
    return {
      subject,
      attempted: items.length,
      accuracy: items.length ? Math.round((correct / items.length) * 100) : 0,
      strongestTopic: sorted[0]?.topic ?? "Start training",
      weakestTopic: sorted.at(-1)?.topic ?? "No data yet",
      recommendedTopic: recommended,
      topics,
    };
  });

  let streak = 0;
  for (const attempt of attempts) {
    if (!attempt.isCorrect) break;
    streak += 1;
  }

  const difficultyStats = DIFFICULTIES.map((difficulty) => {
    const items = attempts.filter((attempt) => attempt.question.difficulty === difficulty);
    const correct = items.filter((attempt) => attempt.isCorrect).length;
    return {
      difficulty,
      attempted: items.length,
      accuracy: items.length ? Math.round((correct / items.length) * 100) : 0,
    };
  });
  const weakAttemptedLevel = difficultyStats.find((item) => item.attempted > 0 && item.accuracy < 60);
  const masteredIndex = difficultyStats.reduce(
    (highest, item, index) => item.attempted >= 3 && item.accuracy >= 75 ? index : highest,
    -1,
  );
  const recommendedDifficulty =
    weakAttemptedLevel?.difficulty ??
    DIFFICULTIES[Math.min(masteredIndex + 1, DIFFICULTIES.length - 1)];

  const problem = await prisma.question.findFirst({
    where: { roundType: "PROBLEM_OF_THE_DAY" },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    attempts: attempts.length,
    accuracy: attempts.length
      ? Math.round((attempts.filter((attempt) => attempt.isCorrect).length / attempts.length) * 100)
      : 0,
    streak,
    subjects,
    difficultyStats,
    recommendedDifficulty,
    problem,
  });
}
