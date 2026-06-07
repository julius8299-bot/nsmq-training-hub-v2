"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { DifficultyFilter, RoundSelector, SubjectFilter, TopicFilter } from "@/components/filters";
import { PageHeading } from "@/components/page-heading";
import { PracticeRunner } from "@/components/practice-runner";
import type { Question } from "@/lib/types";

export default function PracticePage() {
  const [subject, setSubject] = useState("MATHEMATICS");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [roundType, setRoundType] = useState("ROUND_ONE");
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState("5");
  const [timeMode, setTimeMode] = useState("30");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSubject = params.get("subject");
    const requestedTopic = params.get("topic");
    if (requestedSubject) setSubject(requestedSubject);
    if (requestedTopic && requestedTopic !== "Start training") setTopic(requestedTopic);
  }, []);

  useEffect(() => {
    fetch(`/api/questions?subject=${subject}&limit=100`)
      .then((response) => response.json())
      .then(setAllQuestions);
  }, [subject]);

  const topics = useMemo(() => [...new Set(allQuestions.map((item) => item.topic))].sort(), [allQuestions]);
  const subtopics = useMemo(
    () => [...new Set(allQuestions.filter((item) => !topic || item.topic === topic).map((item) => item.subtopic))].sort(),
    [allQuestions, topic],
  );

  const start = async () => {
    const params = new URLSearchParams({
      subject,
      roundType,
      limit: count,
      ...(topic && { topic }),
      ...(subtopic && { subtopic }),
      ...(difficulty && { difficulty }),
    });
    const data: Question[] = await fetch(`/api/questions?${params}`).then((response) => response.json());
    setQuestions(
      data.map((question) => ({
        ...question,
        timeLimitSeconds: timeMode === "untimed" ? question.timeLimitSeconds : Number(timeMode),
      })),
    );
    setStarted(true);
  };

  return (
    <div className="page-shell">
      <PageHeading
        eyebrow="Targeted training"
        title="Self Practice"
        description="Choose the exact skill you want to sharpen. After every attempt, study the shortcut before the full method."
      />
      {!started ? (
        <div className="panel max-w-4xl p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-ink text-gold"><SlidersHorizontal size={19} /></span>
            <div><h2 className="font-display text-2xl font-semibold">Build your session</h2><p className="text-sm text-ink/50">Focused repetition beats random practice.</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold">Subject<SubjectFilter value={subject} onChange={(value) => { setSubject(value); setTopic(""); setSubtopic(""); }} /></label>
            <label className="text-sm font-bold">Topic<TopicFilter value={topic} onChange={(value) => { setTopic(value); setSubtopic(""); }} topics={topics} /></label>
            <label className="text-sm font-bold">Subtopic
              <select className="field" value={subtopic} onChange={(event) => setSubtopic(event.target.value)}>
                <option value="">All subtopics</option>{subtopics.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Round type<RoundSelector value={roundType} onChange={setRoundType} /></label>
            <label className="text-sm font-bold">Difficulty<DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll /></label>
            <label className="text-sm font-bold">Number of questions
              <select className="field" value={count} onChange={(event) => setCount(event.target.value)}>{[3, 5, 10, 20].map((value) => <option key={value}>{value}</option>)}</select>
            </label>
            <label className="text-sm font-bold">Time mode
              <select className="field" value={timeMode} onChange={(event) => setTimeMode(event.target.value)}>
                <option value="untimed">Untimed</option><option value="10">10 seconds</option><option value="30">30 seconds</option><option value="60">60 seconds</option>
              </select>
            </label>
          </div>
          <button type="button" className="button-primary mt-7" onClick={start}>Start focused session</button>
        </div>
      ) : (
        <div className="max-w-4xl">
          <button type="button" className="button-secondary mb-4" onClick={() => setStarted(false)}>Change filters</button>
          <PracticeRunner questions={questions} mode="SELF_PRACTICE" timed={timeMode !== "untimed"} />
        </div>
      )}
    </div>
  );
}
