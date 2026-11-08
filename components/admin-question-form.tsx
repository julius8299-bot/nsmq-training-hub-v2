"use client";

import { useState } from "react";
import { ShortcutEditor } from "@/components/shortcut-editor";
import { Minus, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { DIFFICULTIES, PERMISSION_STATUSES, ROUND_LABELS, ROUND_TYPES, SOURCE_TYPES, SUBJECTS } from "@/lib/constants";
import type { Question } from "@/lib/types";

const RIDDLE_POINTS = [5, 4, 3, 3, 3];

/** Stored lists are JSON arrays; in the form they are one item per line, so commas inside answers ("1,000") are safe. */
function toLines(value: unknown) {
  if (Array.isArray(value)) return value.join("\n");
  try { const parsed = JSON.parse(String(value ?? "[]")); if (Array.isArray(parsed)) return parsed.join("\n"); } catch { /* fall through */ }
  return String(value ?? "");
}
const fromLines = (value: unknown) => String(value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);

const initial: Record<string, unknown> = {
  subject: "MATHEMATICS", topic: "", subtopic: "", roundType: "ROUND_ONE", difficulty: "MEDIUM",
  timeLimitSeconds: 30, questionText: "", answer: "", acceptedAnswers: "", shortcutSolution: "",
  fullSolution: "", commonTrap: "", encouragement: "You missed the pattern, not the whole topic. Try 3 more from this pattern.",
  repeatedPattern: "", patternFamily: "", sourceType: "ORIGINAL", sourceName: "", sourceUrl: "",
  sourceYear: "", contestStage: "", videoTimestamp: "", permissionStatus: "ORIGINAL", tags: "", isGhanaContext: false,
  isPastQuestion: false, markingScheme: "", examinerFocus: "", numericTolerance: "", preamble: "",
};

export function AdminQuestionForm({ onSaved, question, onCancel }: { onSaved?: () => void; question?: Question | null; onCancel?: () => void }) {
  const [form, setForm] = useState<Record<string, unknown>>(() => question
    ? Object.fromEntries(Object.keys(initial).map((key) => {
      const value = (question as unknown as Record<string, unknown>)[key];
      if (key === "acceptedAnswers" || key === "tags") return [key, toLines(value)];
      if (key === "isGhanaContext") return [key, Boolean(question.isGhanaContext || question.ghanaContext)];
      return [key, value ?? ""];
    }))
    : initial);
  const [clues, setClues] = useState<string[]>(question?.riddleClues?.length ? question.riddleClues.map((clue) => clue.clueText) : ["", "", "", ""]);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (name: string, value: unknown) => setForm((current) => ({ ...current, [name]: value }));
  const field = (name: string) => ({ value: String(form[name] ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(name, event.target.value) });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage(null);
    const payload = {
      ...form,
      timeLimitSeconds: Number(form.timeLimitSeconds),
      acceptedAnswers: fromLines(form.acceptedAnswers),
      tags: fromLines(form.tags),
      ghanaContext: Boolean(form.isGhanaContext),
      riddleClues: form.roundType === "RIDDLE" ? clues.map((clueText, index) => ({ clueNumber: index + 1, clueText })) : [],
    };
    try {
      const saved = await api<{ pendingEdit?: boolean }>(question ? `/api/questions/${question.id}` : "/api/questions", { method: question ? "PUT" : "POST", body: payload });
      setMessage({ tone: "ok", text: question
        ? saved.pendingEdit ? "Edit saved for review. Students keep seeing the current version until it is approved." : "Question updated and sent back to the review queue."
        : "Question saved. It will appear for students once a reviewer approves it." });
      if (!question) { setForm(initial); setClues(["", "", "", ""]); }
      onSaved?.();
    } catch (error) { setMessage({ tone: "error", text: (error as ApiError).message }); }
    finally { setBusy(false); }
  };

  return (
    <form className="panel p-5 sm:p-7" onSubmit={submit}>
      <h2 className="font-display text-2xl font-semibold">{question ? "Edit question" : "Add a question"}</h2>
      <p className="mt-1 text-sm text-ink/55">Every question needs a shortcut that gets a strong student to the answer within the time limit.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-bold">Subject<select className="field" {...field("subject")}>{SUBJECTS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-bold">Topic<input required className="field" {...field("topic")} /></label>
        <label className="text-sm font-bold">Subtopic<input required className="field" {...field("subtopic")} /></label>
        <label className="text-sm font-bold">Round<select className="field" {...field("roundType")}>{ROUND_TYPES.map((value) => <option key={value} value={value}>{ROUND_LABELS[value]}</option>)}</select></label>
        <label className="text-sm font-bold">Difficulty<select className="field" {...field("difficulty")}>{DIFFICULTIES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
        <label className="text-sm font-bold">Time limit (seconds)<input className="field" type="number" min={5} max={3600} required {...field("timeLimitSeconds")} /></label>
        <label className="text-sm font-bold sm:col-span-2 lg:col-span-3">Question<textarea required className="field min-h-24" {...field("questionText")} /></label>
        <label className="text-sm font-bold">Answer<input required className="field" {...field("answer")} /></label>
        <label className="text-sm font-bold">Other accepted answers <span className="font-normal text-ink/50">(one per line)</span><textarea className="field min-h-20" placeholder={"24\n24 m s^-1"} {...field("acceptedAnswers")} /></label>
        <label className="text-sm font-bold">Numeric tolerance <span className="font-normal text-ink/50">(optional)</span><input className="field" type="number" step="any" min={0} placeholder="default 0.5%" {...field("numericTolerance")} /></label>
        <ShortcutEditor value={String(form.shortcutSolution ?? "")} onChange={(value) => set("shortcutSolution", value)} />
        {[["fullSolution", "Full solution"], ["commonTrap", "Common trap"], ["encouragement", "Coach's note"]].map(([name, label]) => (
          <label key={name} className="text-sm font-bold sm:col-span-2 lg:col-span-3">{label}<textarea required className="field min-h-20" {...field(name)} /></label>
        ))}
        {form.roundType === "PROBLEM_OF_THE_DAY" && (
          <>
            <label className="text-sm font-bold sm:col-span-2 lg:col-span-3">Marking scheme<textarea className="field min-h-20" {...field("markingScheme")} /></label>
            <label className="text-sm font-bold sm:col-span-2 lg:col-span-3">What the examiner is testing<textarea className="field min-h-16" {...field("examinerFocus")} /></label>
          </>
        )}
        <label className="text-sm font-bold">Repeated pattern<input required className="field" {...field("repeatedPattern")} /></label>
        <label className="text-sm font-bold">Pattern family<input required className="field" {...field("patternFamily")} /></label>
        <label className="text-sm font-bold">Tags <span className="font-normal text-ink/50">(one per line)</span><textarea className="field min-h-16" placeholder={"motion\nkinematics"} {...field("tags")} /></label>
        <label className="text-sm font-bold">Source type<select className="field" {...field("sourceType")}>{SOURCE_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-bold">Source name<input className="field" placeholder="e.g. NSMQ 2019 quarter-final" {...field("sourceName")} /></label>
        <label className="text-sm font-bold">Source year<input className="field" type="number" min={1900} max={2200} {...field("sourceYear")} /></label>
        <label className="text-sm font-bold">Source URL<input className="field" type="url" {...field("sourceUrl")} /></label>
        <label className="text-sm font-bold">Contest stage<input className="field" {...field("contestStage")} /></label>
        <label className="text-sm font-bold">Permission status<select className="field" {...field("permissionStatus")}>{PERMISSION_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="flex items-center gap-2 self-end rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-bold"><input type="checkbox" checked={Boolean(form.isGhanaContext)} onChange={(event) => set("isGhanaContext", event.target.checked)} /> Ghana-context question</label>
        <label className="flex items-center gap-2 self-end rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-bold"><input type="checkbox" checked={Boolean(form.isPastQuestion)} onChange={(event) => set("isPastQuestion", event.target.checked)} /> Past NSMQ question</label>
        {form.roundType === "RIDDLE" && (
          <div className="grid gap-3 sm:col-span-2 lg:col-span-3">
            {clues.map((clue, index) => (
              <label key={index} className="text-sm font-bold">Clue {index + 1} ({RIDDLE_POINTS[index]} points)
                <textarea required className="field min-h-16" value={clue} onChange={(event) => setClues((current) => current.map((value, clueIndex) => clueIndex === index ? event.target.value : value))} />
              </label>
            ))}
            <div className="flex gap-2">
              {clues.length < 5 && <button type="button" className="button-secondary" onClick={() => setClues((current) => [...current, ""])}><Plus size={16} /> Add fifth clue</button>}
              {clues.length > 4 && <button type="button" className="button-secondary" onClick={() => setClues((current) => current.slice(0, 4))}><Minus size={16} /> Remove fifth clue</button>}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button className="button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : question ? "Save changes" : "Save question"}</button>
        {question && <button className="button-secondary" type="button" onClick={onCancel}>Cancel edit</button>}
        {message && <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm font-bold ${message.tone === "error" ? "text-red-700" : "text-chemistry"}`}>{message.text}</p>}
      </div>
    </form>
  );
}
