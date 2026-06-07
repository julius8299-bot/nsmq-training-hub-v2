"use client";

import { DIFFICULTIES, ROUND_LABELS, ROUND_TYPES, SUBJECTS } from "@/lib/constants";

export function SubjectFilter({ value, onChange, includeAll = false }: { value: string; onChange: (value: string) => void; includeAll?: boolean }) {
  return (
    <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
      {includeAll && <option value="">All subjects</option>}
      {SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}
    </select>
  );
}

export function TopicFilter({ value, onChange, topics }: { value: string; onChange: (value: string) => void; topics: string[] }) {
  return (
    <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">All topics</option>
      {topics.map((topic) => <option key={topic}>{topic}</option>)}
    </select>
  );
}

export function RoundSelector({ value, onChange, includeAll = false }: { value: string; onChange: (value: string) => void; includeAll?: boolean }) {
  return (
    <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
      {includeAll && <option value="">All round types</option>}
      {ROUND_TYPES.map((round) => <option key={round} value={round}>{ROUND_LABELS[round]}</option>)}
    </select>
  );
}

export function DifficultyFilter({ value, onChange, includeAll = false }: { value: string; onChange: (value: string) => void; includeAll?: boolean }) {
  return (
    <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
      {includeAll && <option value="">All difficulties</option>}
      {DIFFICULTIES.map((difficulty) => <option key={difficulty}>{difficulty.replaceAll("_", " ")}</option>)}
    </select>
  );
}
