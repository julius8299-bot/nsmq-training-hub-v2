"use client";

import { useState } from "react";
import { DIFFICULTIES, PERMISSION_STATUSES, ROUND_TYPES, SOURCE_TYPES, SUBJECTS } from "@/lib/constants";
import type { Question } from "@/lib/types";

const initial = {
  subject: "MATHEMATICS", topic: "", subtopic: "", roundType: "ROUND_ONE", difficulty: "MEDIUM",
  timeLimitSeconds: 30, questionText: "", answer: "", acceptedAnswers: "", shortcutSolution: "",
  fullSolution: "", commonTrap: "", encouragement: "You missed the pattern, not the whole topic. Try 3 more from this pattern.",
  repeatedPattern: "", patternFamily: "", sourceType: "ORIGINAL", sourceName: "", sourceUrl: "",
  sourceYear: "", contestStage: "", videoTimestamp: "", permissionStatus: "ORIGINAL", tags: "", ghanaContext: false, isGhanaContext: false,
  isPastQuestion: false, isPrivateOnly: false,
};

export function AdminQuestionForm({ onSaved, question, onCancel }: { onSaved?: () => void; question?: Question | null; onCancel?: () => void }) {
  const startingForm = question
    ? {
        ...question,
        acceptedAnswers: (() => { try { return JSON.parse(question.acceptedAnswers).join(", "); } catch { return question.acceptedAnswers; } })(),
        tags: (() => { try { return JSON.parse(question.tags).join(", "); } catch { return question.tags; } })(),
        sourceYear: question.sourceYear ?? "",
      }
    : initial;
  const [form, setForm] = useState<Record<string, unknown>>(startingForm);
  const [clues, setClues] = useState(
    question?.riddleClues?.length
      ? question.riddleClues.map((clue) => clue.clueText)
      : ["", "", "", ""],
  );
  const [message, setMessage] = useState("");
  const field = (name: string) => ({ value: String(form[name] ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [name]: event.target.value }) });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      acceptedAnswers: JSON.stringify(String(form.acceptedAnswers || "").split(",").map((value) => value.trim()).filter(Boolean)),
      tags: JSON.stringify(String(form.tags || "").split(",").map((value) => value.trim()).filter(Boolean)),
      riddleClues: form.roundType === "RIDDLE"
        ? clues.map((clueText, index) => ({ clueNumber: index + 1, clueText, points: [5, 4, 3, 3, 3][index] }))
        : [],
    };
    const response = await fetch(question ? `/api/questions/${question.id}` : "/api/questions", { method: question ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setMessage(response.ok ? `Question ${question ? "updated" : "added"} successfully.` : data.error || "Could not save this question.");
    if (response.ok) { setForm(initial); onSaved?.(); }
  };
  return (
    <form className="panel p-5 sm:p-7" onSubmit={submit}>
      <h2 className="font-display text-2xl font-semibold">{question ? "Edit question" : "Add a question"}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-bold">Subject<select className="field" {...field("subject")}>{SUBJECTS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-bold">Topic<input required className="field" {...field("topic")} /></label>
        <label className="text-sm font-bold">Subtopic<input required className="field" {...field("subtopic")} /></label>
        <label className="text-sm font-bold">Round type<select className="field" {...field("roundType")}>{ROUND_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-bold">Difficulty<select className="field" {...field("difficulty")}>{DIFFICULTIES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-bold">Time limit (seconds)<input className="field" type="number" min="1" {...field("timeLimitSeconds")} /></label>
        <label className="text-sm font-bold sm:col-span-2 lg:col-span-3">Question<textarea required className="field min-h-24" {...field("questionText")} /></label>
        <label className="text-sm font-bold">Answer<input required className="field" {...field("answer")} /></label>
        <label className="text-sm font-bold">Accepted answers (comma-separated)<input className="field" placeholder="24, 24 m/s" {...field("acceptedAnswers")} /></label>
        <label className="text-sm font-bold">Tags (comma-separated)<input className="field" placeholder="motion, kinematics" {...field("tags")} /></label>
        {["shortcutSolution", "fullSolution", "commonTrap", "encouragement"].map((name) => <label key={name} className="text-sm font-bold sm:col-span-2 lg:col-span-3">{name.replace(/([A-Z])/g, " $1")}<textarea required className="field min-h-20" {...field(name)} /></label>)}
        <label className="text-sm font-bold">Repeated pattern<input required className="field" {...field("repeatedPattern")} /></label>
        <label className="text-sm font-bold">Pattern family<input required className="field" {...field("patternFamily")} /></label>
        <label className="text-sm font-bold">Source type<select className="field" {...field("sourceType")}>{SOURCE_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-bold">Source name<input className="field" {...field("sourceName")} /></label>
        <label className="text-sm font-bold">Source URL<input className="field" type="url" {...field("sourceUrl")} /></label>
        <label className="text-sm font-bold">Source year<input className="field" type="number" {...field("sourceYear")} /></label>
        <label className="text-sm font-bold">Contest stage<input className="field" {...field("contestStage")} /></label>
        <label className="text-sm font-bold">Video timestamp<input className="field" {...field("videoTimestamp")} /></label>
        <label className="text-sm font-bold">Permission status<select className="field" {...field("permissionStatus")}>{PERMISSION_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="flex items-center gap-2 self-end rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-bold"><input type="checkbox" checked={Boolean(form.isGhanaContext ?? form.ghanaContext)} onChange={(event) => setForm({ ...form, ghanaContext: event.target.checked, isGhanaContext: event.target.checked })} /> Ghana-context question</label>
        <label className="flex items-center gap-2 self-end rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-bold"><input type="checkbox" checked={Boolean(form.isPastQuestion)} onChange={(event) => setForm({ ...form, isPastQuestion: event.target.checked })} /> Authorized past question</label>
        <label className="flex items-center gap-2 self-end rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-bold"><input type="checkbox" checked={Boolean(form.isPrivateOnly)} onChange={(event) => setForm({ ...form, isPrivateOnly: event.target.checked })} /> Private review only</label>
        {form.roundType === "RIDDLE" && clues.map((clue, index) => (
          <label key={index} className="text-sm font-bold sm:col-span-2 lg:col-span-3">Clue {index + 1} ({[5, 4, 3, 3, 3][index]} points)<textarea required className="field min-h-16" value={clue} onChange={(event) => setClues((current) => current.map((value, clueIndex) => clueIndex === index ? event.target.value : value))} /></label>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4"><button className="button-primary" type="submit">{question ? "Update question" : "Save question"}</button>{question && <button className="button-secondary" type="button" onClick={onCancel}>Cancel edit</button>}{message && <p className="text-sm font-bold text-chemistry">{message}</p>}</div>
    </form>
  );
}
