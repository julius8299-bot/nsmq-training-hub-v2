"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { DifficultyFilter, RoundSelector, SubjectFilter, TopicFilter } from "@/components/filters";
import { LoadState } from "@/components/load-state";
import { PageHeading } from "@/components/page-heading";
import { QuestionRunner } from "@/components/question-runner";
import { api } from "@/lib/client/api";
import { useTrainingSet } from "@/lib/client/use-training-set";

type Facets = { topics: string[]; subtopics: string[]; patternFamilies: string[] };
const TIME_MODES = [["untimed", "Untimed"], ["10", "10 seconds"], ["30", "30 seconds"], ["60", "60 seconds"], ["120", "2 minutes"]] as const;

export default function PracticePage() {
  const [subject, setSubject] = useState("MATHEMATICS");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [roundType, setRoundType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [patternFamily, setPatternFamily] = useState("");
  const [isGhanaContext, setIsGhanaContext] = useState(false);
  const [count, setCount] = useState("10");
  const [timeMode, setTimeMode] = useState("30");
  const [facets, setFacets] = useState<Facets>({ topics: [], subtopics: [], patternFamilies: [] });
  const [session, setSession] = useState<Record<string, string | undefined> | null>(null);
  const set = useTrainingSet(session);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSubject = params.get("subject");
    const requestedTopic = params.get("topic");
    if (requestedSubject) setSubject(requestedSubject);
    if (requestedTopic && requestedTopic !== "Start training") setTopic(requestedTopic);
  }, []);

  // Every topic in the bank for this subject (not just those in the first page of questions).
  useEffect(() => {
    const query = new URLSearchParams({ metadata: "true", subject, ...(topic && { topic }) });
    api<Facets>("/api/questions?" + query).then(setFacets).catch(() => setFacets({ topics: [], subtopics: [], patternFamilies: [] }));
  }, [subject, topic]);

  const start = () => setSession({
    subject, roundType, limit: count, topic, subtopic, difficulty, patternFamily,
    isGhanaContext: isGhanaContext ? "true" : undefined,
  });
  const timeLimitSeconds = timeMode === "untimed" ? null : Number(timeMode);

  return (
    <div className="page-shell">
      <PageHeading
        eyebrow="Targeted training"
        title="Self Practice"
        description="Choose the exact skill you want to sharpen. Each set is drawn at random, so you see new questions every time. After every attempt, study the shortcut before the full method."
      />
      {!session ? (
        <div className="panel max-w-4xl p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-ink text-gold"><SlidersHorizontal size={19} /></span>
            <div><h2 className="font-display text-2xl font-semibold">Build your session</h2><p className="text-sm text-ink/50">Focused repetition beats random practice.</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold">Subject<SubjectFilter value={subject} onChange={(value) => { setSubject(value); setTopic(""); setSubtopic(""); }} /></label>
            <label className="text-sm font-bold">Topic<TopicFilter value={topic} onChange={(value) => { setTopic(value); setSubtopic(""); }} topics={facets.topics} /></label>
            <label className="text-sm font-bold">Subtopic
              <select className="field" value={subtopic} onChange={(event) => setSubtopic(event.target.value)}>
                <option value="">All subtopics</option>{(topic ? facets.subtopics : []).map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Round type<RoundSelector value={roundType} onChange={setRoundType} includeAll /></label>
            <label className="text-sm font-bold">Difficulty<DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll allLabel="Mixed" /></label>
            <label className="text-sm font-bold">Pattern family
              <select className="field" value={patternFamily} onChange={(event) => setPatternFamily(event.target.value)}>
                <option value="">All pattern families</option>
                {facets.patternFamilies.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Number of questions
              <select className="field" value={count} onChange={(event) => setCount(event.target.value)}>{[5, 10, 20, 30].map((value) => <option key={value}>{value}</option>)}</select>
            </label>
            <label className="text-sm font-bold">Time per question
              <select className="field" value={timeMode} onChange={(event) => setTimeMode(event.target.value)}>
                {TIME_MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 self-end rounded-xl border border-ink/15 bg-white px-3 text-sm font-bold">
              <input type="checkbox" checked={isGhanaContext} onChange={(event) => setIsGhanaContext(event.target.checked)} />
              Ghana-context only
            </label>
          </div>
          <button type="button" className="button-primary mt-7" onClick={start}>Start focused session</button>
        </div>
      ) : (
        <div className="max-w-4xl">
          <button type="button" className="button-secondary mb-4" onClick={() => setSession(null)}>Change filters</button>
          <LoadState loading={set.loading} error={set.error} onRetry={set.reload} />
          {!set.loading && !set.error && (
            <QuestionRunner
              runId={set.version}
              questions={set.questions}
              mode="SELF_PRACTICE"
              timeLimitSeconds={timeLimitSeconds}
              timed={timeLimitSeconds !== null}
              onNewSet={set.reload}
            />
          )}
        </div>
      )}
    </div>
  );
}
