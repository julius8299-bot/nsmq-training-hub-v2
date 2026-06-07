"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { DifficultyFilter, RoundSelector, SubjectFilter, TopicFilter } from "@/components/filters";
import { PageHeading } from "@/components/page-heading";
import { ROUND_LABELS, SOURCE_TYPES, SUBJECT_STYLES } from "@/lib/constants";
import type { Question } from "@/lib/types";

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [roundType, setRoundType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [pattern, setPattern] = useState("");
  const [patternFamily, setPatternFamily] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [ghanaContext, setGhanaContext] = useState(false);
  const [catalog, setCatalog] = useState<Question[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "200", ...(search && { search }), ...(subject && { subject }), ...(topic && { topic }), ...(subtopic && { subtopic }), ...(roundType && { roundType }), ...(difficulty && { difficulty }), ...(sourceType && { sourceType }), ...(pattern && { repeatedPattern: pattern }), ...(patternFamily && { patternFamily }), ...(timeLimit && { timeLimit }), ...(ghanaContext && { ghanaContext: "true" }) });
    const timeout = window.setTimeout(() => fetch(`/api/questions?${params}`).then((response) => response.json()).then(setQuestions), 150);
    return () => window.clearTimeout(timeout);
  }, [search, subject, topic, subtopic, roundType, difficulty, sourceType, pattern, patternFamily, timeLimit, ghanaContext]);

  useEffect(() => {
    fetch("/api/questions?limit=200").then((response) => response.json()).then(setCatalog);
  }, []);

  const topics = [...new Set(catalog.filter((item) => !subject || item.subject === subject).map((item) => item.topic))].sort();
  const subtopics = [...new Set(catalog.filter((item) => (!subject || item.subject === subject) && (!topic || item.topic === topic)).map((item) => item.subtopic))].sort();
  const patternFamilies = [...new Set(catalog.map((item) => item.patternFamily))].sort();

  return (
    <div className="page-shell">
      <PageHeading eyebrow="Study the patterns" title="Question Bank" description="Search original and properly tracked practice material. Open any question to study its answer, shortcut, and full reasoning." />
      <div className="panel mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="relative sm:col-span-2"><Search className="absolute left-3 top-3 text-ink/35" size={18} /><input className="field pl-10" placeholder="Search questions or tags" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <SubjectFilter value={subject} onChange={(value) => { setSubject(value); setTopic(""); setSubtopic(""); }} includeAll />
        <TopicFilter value={topic} onChange={(value) => { setTopic(value); setSubtopic(""); }} topics={topics} />
        <select className="field" value={subtopic} onChange={(event) => setSubtopic(event.target.value)}><option value="">All subtopics</option>{subtopics.map((value) => <option key={value}>{value}</option>)}</select>
        <RoundSelector value={roundType} onChange={setRoundType} includeAll />
        <DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll />
        <select className="field" value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option value="">All sources</option>{SOURCE_TYPES.map((value) => <option key={value}>{value}</option>)}</select>
        <select className="field" value={patternFamily} onChange={(event) => setPatternFamily(event.target.value)}><option value="">All pattern families</option>{patternFamilies.map((value) => <option key={value}>{value}</option>)}</select>
        <select className="field" value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)}><option value="">Any time limit</option><option value="15">15 seconds or less</option><option value="30">30 seconds or less</option><option value="60">60 seconds or less</option><option value="300">Up to 5 minutes</option></select>
        <input className="field" placeholder="Repeated pattern" value={pattern} onChange={(event) => setPattern(event.target.value)} />
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 text-sm font-bold"><input type="checkbox" checked={ghanaContext} onChange={(event) => setGhanaContext(event.target.checked)} /> Ghana-context only</label>
      </div>
      <p className="mb-4 text-sm font-bold text-ink/50">{questions.length} question{questions.length === 1 ? "" : "s"} found</p>
      <div className="grid gap-4">
        {questions.map((question) => {
          const style = SUBJECT_STYLES[question.subject];
          return (
            <article key={question.id} className="panel overflow-hidden">
              <button type="button" className="w-full p-5 text-left" onClick={() => setOpenId(openId === question.id ? null : question.id)}>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
                  <span className={`${style.bg} ${style.text} rounded-full px-2.5 py-1`}>{question.subject}</span>
                  <span className="rounded-full bg-ink/5 px-2.5 py-1">{ROUND_LABELS[question.roundType]}</span>
                  <span className={`rounded-full px-2.5 py-1 ${question.difficulty === "HARD" || question.difficulty === "NSMQ_FINAL_LEVEL" ? "bg-amber-100 text-amber-900" : "bg-ink/5"}`}>{question.difficulty.replaceAll("_", " ")}</span>
                  {question.ghanaContext && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Ghana Context</span>}
                  {question.roundType === "SPEED_RACE" && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800">Speed Race</span>}
                  {question.roundType === "RIDDLE" && <span className="rounded-full bg-purple-100 px-2.5 py-1 text-purple-800">Riddle</span>}
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold">{question.questionText}</h2>
                <p className="mt-2 text-sm text-ink/45">{question.topic} · {question.subtopic} · Pattern: {question.repeatedPattern}</p>
              </button>
              {openId === question.id && <div className="grid gap-3 border-t border-ink/10 bg-ink/[0.02] p-5 md:grid-cols-3"><div><p className="eyebrow">Answer</p><p className="mt-2 font-bold">{question.answer}</p></div><div><p className="eyebrow">Shortcut</p><p className="mt-2 text-sm leading-6">{question.shortcutSolution}</p></div><div><p className="eyebrow">Full solution</p><p className="mt-2 text-sm leading-6">{question.fullSolution}</p></div></div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
