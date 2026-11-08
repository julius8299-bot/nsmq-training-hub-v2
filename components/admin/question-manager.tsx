"use client";

import { useEffect, useState } from "react";
import { Archive, Pencil, Search } from "lucide-react";
import { DifficultyFilter, RoundSelector, SubjectFilter } from "@/components/filters";
import { api, ApiError } from "@/lib/client/api";
import { ROUND_LABELS } from "@/lib/constants";
import type { Question } from "@/lib/types";
import type { StaffUser } from "@/components/admin-dashboard";
import { formatList, type QuestionPage } from "./review-queue";

const STATUS_LABELS: Record<string, string> = {
  live: "Live", queue: "Waiting for review", pending: "New (pending)", edits: "Proposed edits", rejected: "Rejected", archived: "Archived", all: "Everything",
};
const BADGE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-900", LEGACY_UNREVIEWED: "bg-ink/5 text-ink/70", AUTO_VERIFIED: "bg-blue-100 text-blue-900",
  PENDING_REVIEW: "bg-amber-100 text-amber-900", REJECTED: "bg-red-100 text-red-800",
};

export function QuestionManager({ user, onEdit }: { user: StaffUser; onEdit: (question: Question) => void }) {
  const [status, setStatus] = useState("live");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [roundType, setRoundType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<QuestionPage | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const query = new URLSearchParams({ status, page: String(page), pageSize: "20", ...(search && { search }), ...(subject && { subject }), ...(roundType && { roundType }), ...(difficulty && { difficulty }) });
    const timer = window.setTimeout(() => {
      api<QuestionPage>("/api/admin/questions?" + query).then(setData).catch((caught) => setMessage((caught as ApiError).message));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [status, search, subject, roundType, difficulty, page, version]);

  const filter = (apply: () => void) => { setPage(1); apply(); };
  const archive = async (id: string) => {
    if (!window.confirm("Archive this question? Students will no longer see it. Their past answers are kept.")) return;
    try { await api(`/api/questions/${id}`, { method: "DELETE" }); setVersion((value) => value + 1); }
    catch (caught) { setMessage((caught as ApiError).message); }
  };

  return (
    <section>
      <div className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="relative sm:col-span-2"><Search className="absolute left-3 top-3 text-ink/35" size={18} /><input className="field pl-10" placeholder="Search question, answer, topic or tag" value={search} onChange={(event) => filter(() => setSearch(event.target.value))} /></label>
        <select className="field" value={status} onChange={(event) => filter(() => setStatus(event.target.value))}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}{data?.counts[value] !== undefined ? ` (${data.counts[value]})` : ""}</option>)}
        </select>
        <SubjectFilter value={subject} onChange={(value) => filter(() => setSubject(value))} includeAll />
        <RoundSelector value={roundType} onChange={(value) => filter(() => setRoundType(value))} includeAll />
        <DifficultyFilter value={difficulty} onChange={(value) => filter(() => setDifficulty(value))} includeAll />
      </div>
      {message && <p role="alert" className="mb-3 text-sm font-bold text-red-700">{message}</p>}
      <p className="mb-3 text-sm font-bold text-ink/50">{data ? `${data.total.toLocaleString()} question${data.total === 1 ? "" : "s"}` : "Loading…"}</p>
      <div className="grid gap-3">
        {data?.questions.map((question) => (
          <article key={question.id} className="panel p-4">
            <div className="flex items-start justify-between gap-4">
              <button type="button" className="text-left" onClick={() => setOpenId(openId === question.id ? null : question.id)}>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
                  <span className={`rounded-full px-2.5 py-1 ${BADGE[question.reviewStatus] ?? "bg-ink/5"}`}>{question.archivedAt ? "ARCHIVED" : question.reviewStatus.replaceAll("_", " ")}</span>
                  {question.pendingEdit && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-900">Edit waiting</span>}
                  <span className="text-chemistry">{question.subject} · {ROUND_LABELS[question.roundType] ?? question.roundType} · {question.difficulty.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-2 font-semibold">{question.questionText}</p>
                <p className="mt-1 text-xs text-ink/45">Answer: {question.answer} · {question.topic} · Permission: {question.permissionStatus}{question.createdBy ? ` · by ${question.createdBy.name}` : ""}</p>
              </button>
              {!question.archivedAt && (
                <div className="flex shrink-0 gap-1">
                  <button type="button" aria-label="Edit question" title="Edit" className="grid size-9 place-items-center rounded-full bg-ink/5" onClick={() => onEdit({ ...question, riddleClues: question.riddleClues } as unknown as Question)}><Pencil size={16} /></button>
                  {(user.role === "ADMIN" || (question.createdBy?.id === user.id && question.isPrivateOnly)) && (
                    <button type="button" aria-label="Archive question" title="Archive" className="grid size-9 place-items-center rounded-full bg-red-50 text-red-600" onClick={() => void archive(question.id)}><Archive size={16} /></button>
                  )}
                </div>
              )}
            </div>
            {openId === question.id && (
              <div className="mt-4 grid gap-2 border-t border-ink/10 pt-4 text-sm md:grid-cols-2">
                <p><strong>Also accepted:</strong> {formatList(question.acceptedAnswers) || "—"}</p>
                <p><strong>Pattern:</strong> {question.repeatedPattern} · {question.patternFamily}</p>
                <p className="md:col-span-2"><strong>Shortcut:</strong> {question.shortcutSolution}</p>
                <p className="md:col-span-2"><strong>Full solution:</strong> {question.fullSolution}</p>
                {question.riddleClues.length > 0 && <ol className="list-decimal pl-5 md:col-span-2">{question.riddleClues.map((clue) => <li key={clue.clueNumber}>{clue.clueText} ({clue.points} pts)</li>)}</ol>}
                {question.reviews[0] && <p className="text-ink/55 md:col-span-2">Last review: {question.reviews[0].decision} by {question.reviews[0].reviewer.name} — {question.reviews[0].notes}</p>}
              </div>
            )}
          </article>
        ))}
      </div>
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" className="button-secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span className="text-sm font-bold">Page {page} / {data.totalPages}</span>
          <button type="button" className="button-secondary" disabled={page === data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}
