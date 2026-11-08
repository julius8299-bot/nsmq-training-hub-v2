"use client";

import { useCallback, useEffect, useState } from "react";
import { ShortcutView } from "@/components/math-text";
import { Check, X } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { ROUND_LABELS, ROUND_TYPES, SUBJECT_LABELS, SUBJECTS } from "@/lib/constants";
import type { StaffUser } from "@/components/admin-dashboard";

type Clue = { clueNumber: number; clueText: string; points: number };
type PendingEdit = { fields: Record<string, unknown>; clues: string[]; proposedById: string; proposedByName: string; proposedAt: string };
export type StaffQuestion = {
  id: string; subject: string; topic: string; subtopic: string; roundType: string; difficulty: string; timeLimitSeconds: number;
  questionText: string; answer: string; acceptedAnswers: string; shortcutSolution: string; fullSolution: string; commonTrap: string;
  encouragement: string; repeatedPattern: string; patternFamily: string; sourceType: string; sourceName: string | null; permissionStatus: string;
  isPastQuestion: boolean; isGhanaContext: boolean; ghanaContext: boolean; tags: string; markingScheme: string | null; examinerFocus: string | null;
  reviewStatus: string; revision: number; isPrivateOnly: boolean; archivedAt: string | null; updatedAt: string; preamble: string | null;
  sourceUrl: string | null; sourceYear: number | null; contestStage: string | null; videoTimestamp: string | null; numericTolerance: number | null;
  riddleClues: Clue[]; createdBy: { id: string; name: string } | null; pendingEdit: PendingEdit | null;
  reviews: { decision: string; notes: string; createdAt: string; reviewer: { name: string } }[];
};
export type QuestionPage = { questions: StaffQuestion[]; total: number; page: number; totalPages: number; counts: Record<string, number> };

const SHOWN_FIELDS: [string, string][] = [
  ["questionText", "Question"], ["answer", "Answer"], ["acceptedAnswers", "Also accepted"], ["shortcutSolution", "Shortcut"],
  ["fullSolution", "Full solution"], ["commonTrap", "Common trap"], ["markingScheme", "Marking scheme"],
  ["subject", "Subject"], ["topic", "Topic"], ["subtopic", "Subtopic"], ["roundType", "Round"], ["difficulty", "Difficulty"],
  ["timeLimitSeconds", "Time limit (s)"], ["sourceType", "Source type"], ["sourceName", "Source"], ["permissionStatus", "Permission"],
];

export function formatList(value: unknown) {
  if (typeof value !== "string") return String(value ?? "");
  try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.join(" · "); } catch { /* plain text */ }
  return value;
}

export function ReviewCard({ question, user, onDone }: { question: StaffQuestion; user: StaffUser; onDone: () => void }) {
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const edit = question.pendingEdit;
  const proposedBy = edit ? edit.proposedById : question.createdBy?.id;
  const own = proposedBy === user.id && user.role !== "ADMIN";
  const candidate = edit ? { ...question, ...edit.fields } as Record<string, unknown> : question as unknown as Record<string, unknown>;
  const sourced = Boolean(candidate.isPastQuestion) || candidate.sourceType !== "ORIGINAL";
  const shortcutMissing = String(candidate.shortcutSolution ?? "").trimStart().startsWith("[Shortcut pending]");
  const clues = edit ? edit.clues : question.riddleClues.map((clue) => clue.clueText);

  const decide = async (decision: "APPROVED" | "REJECTED") => {
    setBusy(true); setMessage("");
    try {
      await api(`/api/questions/${question.id}/review`, { body: { decision, notes, revision: question.revision, ...(sourced && { permissionConfirmed: confirm }) } });
      onDone();
    } catch (error) { setMessage((error as ApiError).message); }
    finally { setBusy(false); }
  };

  return (
    <article className="panel p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
        <span className={`rounded-full px-2.5 py-1 ${edit ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900"}`}>{edit ? "Proposed edit to a live question" : "New question"}</span>
        <span className="rounded-full bg-ink/5 px-2.5 py-1">{question.subject} · {ROUND_LABELS[question.roundType] ?? question.roundType}</span>
        <span className="rounded-full bg-ink/5 px-2.5 py-1">rev {question.revision}</span>
        <span className="text-ink/45">by {edit ? edit.proposedByName : question.createdBy?.name ?? "legacy import"}</span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {SHOWN_FIELDS.map(([key, label]) => {
          const value = candidate[key];
          if (value === null || value === undefined || value === "" || value === "[]") return null;
          const changed = edit && key in edit.fields && String(edit.fields[key] ?? "") !== String((question as unknown as Record<string, unknown>)[key] ?? "");
          const wide = ["questionText", "shortcutSolution", "fullSolution", "commonTrap", "markingScheme"].includes(key);
          return (
            <div key={key} className={`${wide ? "sm:col-span-2" : ""} rounded-xl p-3 ${changed ? "bg-blue-50 ring-1 ring-blue-200" : "bg-ink/[0.03]"}`}>
              <dt className="text-xs font-bold uppercase text-ink/45">{label}{changed && " · changed"}</dt>
              <dd className="mt-1 whitespace-pre-line">{key === "shortcutSolution" ? <ShortcutView text={String(value)} dark={false} /> : formatList(value)}</dd>
              {changed && <dd className="mt-2 whitespace-pre-line text-xs text-ink/45 line-through">{formatList((question as unknown as Record<string, unknown>)[key])}</dd>}
            </div>
          );
        })}
        {clues.length > 0 && (
          <div className="rounded-xl bg-purple-50 p-3 sm:col-span-2">
            <dt className="text-xs font-bold uppercase text-ink/45">Riddle clues</dt>
            <dd className="mt-1"><ol className="list-decimal pl-5">{clues.map((clue, index) => <li key={index}>{clue}</li>)}</ol></dd>
          </div>
        )}
      </dl>
      {shortcutMissing && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This imported question has no shortcut yet. You can reject it or fix it in Question bank, but it can't be approved until a shortcut is added.</p>}
      {own ? (
        <p className="mt-4 rounded-xl bg-ink/5 p-3 text-sm">You wrote this, so another coach or an administrator needs to approve it.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-bold">Review note (what you checked)
            <textarea className="field mt-1 min-h-16" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="e.g. Checked the answer, units and shortcut against the syllabus." />
          </label>
          {sourced && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} />
              <span>This is sourced or past material. I confirm the team has permission to use it for training, and the source is recorded.</span>
            </label>
          )}
          {message && <p role="alert" className="text-sm font-bold text-red-700">{message}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="button-primary" disabled={busy || shortcutMissing || notes.trim().length < 10} onClick={() => void decide("APPROVED")}><Check size={16} /> Approve{edit ? " edit" : " and publish"}</button>
            <button type="button" className="button-secondary" disabled={busy || notes.trim().length < 10} onClick={() => void decide("REJECTED")}><X size={16} /> {edit ? "Reject edit (keep live version)" : "Reject"}</button>
          </div>
        </div>
      )}
    </article>
  );
}

export function ReviewQueue({ user }: { user: StaffUser }) {
  const [data, setData] = useState<QuestionPage | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [roundType, setRoundType] = useState("");
  const [shortcut, setShortcut] = useState("ready");
  const load = useCallback(() => {
    setError("");
    const query = new URLSearchParams({ status: "queue", page: String(page), pageSize: "10", subject, roundType, shortcut });
    api<QuestionPage>(`/api/admin/questions?${query}`).then(setData).catch((caught) => setError((caught as ApiError).message));
  }, [page, subject, roundType, shortcut]);
  const filter = (set: (value: string) => void) => (event: React.ChangeEvent<HTMLSelectElement>) => { set(event.target.value); setPage(1); };
  useEffect(load, [load]);
  if (error) return <p role="alert" className="panel p-5 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="panel p-5 text-ink/50">Loading review queue…</p>;
  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2">
        <select aria-label="Subject" className="input w-auto" value={subject} onChange={filter(setSubject)}>
          <option value="">All subjects</option>{SUBJECTS.map((value) => <option key={value} value={value}>{SUBJECT_LABELS[value]}</option>)}
        </select>
        <select aria-label="Round" className="input w-auto" value={roundType} onChange={filter(setRoundType)}>
          <option value="">All rounds</option>{ROUND_TYPES.map((value) => <option key={value} value={value}>{ROUND_LABELS[value]}</option>)}
        </select>
        <select aria-label="Shortcut" className="input w-auto" value={shortcut} onChange={filter(setShortcut)}>
          <option value="ready">Ready to review (has a shortcut)</option>
          <option value="missing">Imported, shortcut still being written</option>
          <option value="">Everything waiting</option>
        </select>
      </div>
      <p className="mb-4 text-sm text-ink/60">{data.total} waiting · {data.counts.pending ?? 0} new questions · {data.counts.edits ?? 0} proposed edits. Approving publishes the question to students; rejecting an edit keeps the live version unchanged.</p>
      {!data.questions.length && <div className="panel p-8 text-center text-ink/55">Nothing to review. New and edited questions will appear here.</div>}
      <div className="grid gap-4">{data.questions.map((question) => <ReviewCard key={question.id + ":" + question.revision} question={question} user={user} onDone={load} />)}</div>
      {data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" className="button-secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span className="text-sm font-bold">Page {page} / {data.totalPages}</span>
          <button type="button" className="button-secondary" disabled={page === data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}
