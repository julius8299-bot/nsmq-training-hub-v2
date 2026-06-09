"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
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
  const [isGhanaContext, setIsGhanaContext] = useState(false);
  const [facets, setFacets] = useState<{ topics: string[]; subtopics: string[]; patternFamilies: string[] }>({ topics: [], subtopics: [], patternFamilies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "24", ...(search && { search }), ...(subject && { subject }), ...(topic && { topic }), ...(subtopic && { subtopic }), ...(roundType && { roundType }), ...(difficulty && { difficulty }), ...(sourceType && { sourceType }), ...(pattern && { repeatedPattern: pattern }), ...(patternFamily && { patternFamily }), ...(timeLimit && { timeLimit }), ...(isGhanaContext && { isGhanaContext: "true" }) });
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => fetch(`/api/questions?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Question Bank request failed with status ${response.status}.`);
        }
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.questions) || typeof data.total !== "number") {
          throw new Error("Question Bank returned an invalid response.");
        }
        setQuestions(data.questions);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((requestError: Error) => {
        if (requestError.name === "AbortError") return;
        setQuestions([]);
        setTotal(0);
        setTotalPages(1);
        setError("The Question Bank could not load. Please refresh the page and try again.");
      })
      .finally(() => setLoading(false)), 150);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, search, subject, topic, subtopic, roundType, difficulty, sourceType, pattern, patternFamily, timeLimit, isGhanaContext]);

  useEffect(() => {
    fetch("/api/questions?metadata=true").then((response) => response.json()).then(setFacets);
  }, []);

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setPage(1);
    setter(value);
  };
  const clearFilters = () => {
    setSearch("");
    setSubject("");
    setTopic("");
    setSubtopic("");
    setRoundType("");
    setDifficulty("");
    setSourceType("");
    setPattern("");
    setPatternFamily("");
    setTimeLimit("");
    setIsGhanaContext(false);
    setOpenId(null);
    setPage(1);
  };

  return (
    <div className="page-shell">
      <PageHeading eyebrow="Study the patterns" title="Question Bank" description="Search original and properly tracked practice material. Open any question to study its answer, shortcut, and full reasoning." />
      <div className="panel mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="relative sm:col-span-2"><Search className="absolute left-3 top-3 text-ink/35" size={18} /><input className="field pl-10" placeholder="Search questions or tags" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} /></label>
        <SubjectFilter value={subject} onChange={(value) => { setPage(1); setSubject(value); setTopic(""); setSubtopic(""); }} includeAll />
        <TopicFilter value={topic} onChange={(value) => { setPage(1); setTopic(value); setSubtopic(""); }} topics={facets.topics} />
        <select className="field" value={subtopic} onChange={(event) => updateFilter(setSubtopic, event.target.value)}><option value="">All subtopics</option>{facets.subtopics.map((value) => <option key={value}>{value}</option>)}</select>
        <RoundSelector value={roundType} onChange={(value) => updateFilter(setRoundType, value)} includeAll />
        <DifficultyFilter value={difficulty} onChange={(value) => updateFilter(setDifficulty, value)} includeAll />
        <select className="field" value={sourceType} onChange={(event) => updateFilter(setSourceType, event.target.value)}><option value="">All sources</option>{SOURCE_TYPES.map((value) => <option key={value}>{value}</option>)}</select>
        <select className="field" value={patternFamily} onChange={(event) => updateFilter(setPatternFamily, event.target.value)}><option value="">All pattern families</option>{facets.patternFamilies.map((value) => <option key={value}>{value}</option>)}</select>
        <select className="field" value={timeLimit} onChange={(event) => updateFilter(setTimeLimit, event.target.value)}><option value="">Any time limit</option><option value="15">15 seconds or less</option><option value="30">30 seconds or less</option><option value="60">60 seconds or less</option><option value="300">Up to 5 minutes</option></select>
        <input className="field" placeholder="Repeated pattern" value={pattern} onChange={(event) => { setPage(1); setPattern(event.target.value); }} />
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 text-sm font-bold"><input type="checkbox" checked={isGhanaContext} onChange={(event) => { setPage(1); setIsGhanaContext(event.target.checked); }} /> Ghana-context only</label>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-ink/50">
        <p>{loading ? "Loading questions..." : error || `${total.toLocaleString()} question${total === 1 ? "" : "s"} found`}</p>
        {!loading && total > 0 && <p>Page {page} of {totalPages}</p>}
      </div>
      {!loading && error && (
        <div className="panel mb-6 p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">Question Bank unavailable</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/55">{error}</p>
        </div>
      )}
      {!loading && !error && questions.length === 0 && (
        <div className="panel mb-6 p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">No questions match these filters yet.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/55">
            Try clearing Ghana-context only or changing the round type.
          </p>
          <button type="button" className="button-primary mt-5" onClick={clearFilters}>
            <RotateCcw size={17} /> Clear filters
          </button>
        </div>
      )}
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
                  {(question.isGhanaContext || question.ghanaContext) && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Ghana Context</span>}
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
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button type="button" className="button-secondary" disabled={page === 1} onClick={() => { setPage((value) => value - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}><ChevronLeft size={17} /> Previous</button>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold">Page {page} / {totalPages}</span>
          <button type="button" className="button-primary" disabled={page === totalPages} onClick={() => { setPage((value) => value + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Next <ChevronRight size={17} /></button>
        </div>
      )}
    </div>
  );
}
