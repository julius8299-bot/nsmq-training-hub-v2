"use client";

import Papa from "papaparse";
import { Download, FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { api, ApiError } from "@/lib/client/api";

const REQUIRED = [
  "subject", "topic", "subtopic", "roundType", "difficulty", "timeLimitSeconds",
  "questionText", "answer", "shortcutSolution", "fullSolution", "commonTrap",
  "encouragement", "repeatedPattern", "patternFamily", "sourceType", "permissionStatus",
];
const TEMPLATE_COLUMNS = [...REQUIRED, "importKey", "acceptedAnswers", "tags", "sourceName", "sourceYear", "contestStage", "isPastQuestion", "isGhanaContext", "markingScheme", "clue1", "clue2", "clue3", "clue4", "clue5"];
const CHUNK = 200;

type Row = Record<string, unknown>;
type Result = { row: number; status: "imported" | "updated" | "unchanged" | "duplicate" | "error"; message?: string };

/** JSON array, or "a | b | c". Commas are kept inside answers such as "1,000". */
function listField(value: unknown, splitter: RegExp) {
  if (Array.isArray(value)) return value.map(String);
  const text = String(value ?? "").trim();
  if (!text) return [];
  try { const parsed = JSON.parse(text); if (Array.isArray(parsed)) return parsed.map(String); } catch { /* plain text */ }
  return text.split(splitter).map((item) => item.trim()).filter(Boolean);
}
const truthy = (value: unknown) => value === true || ["true", "yes", "1"].includes(String(value ?? "").trim().toLowerCase());

function toPayload(row: Row) {
  const clues = Array.isArray(row.riddleClues)
    ? (row.riddleClues as { clueText?: string }[]).map((clue) => String(clue.clueText ?? clue))
    : [1, 2, 3, 4, 5].map((n) => String(row["clue" + n] ?? "").trim()).filter(Boolean);
  const { riddleClues: _ignored, clue1: _a, clue2: _b, clue3: _c, clue4: _d, clue5: _e, ...rest } = row;
  return {
    ...rest,
    timeLimitSeconds: Number(row.timeLimitSeconds),
    acceptedAnswers: listField(row.acceptedAnswers, /\s*\|\s*/),
    tags: listField(row.tags, /\s*[|,]\s*/),
    isGhanaContext: truthy(row.isGhanaContext) || truthy(row.ghanaContext),
    isPastQuestion: truthy(row.isPastQuestion),
    sourceYear: row.sourceYear ? Number(row.sourceYear) : "",
    riddleClues: clues.map((clueText, index) => ({ clueNumber: index + 1, clueText })),
  };
}

export function QuestionImportUploader({ onImported }: { onImported?: () => void }) {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [problems, setProblems] = useState<string[][]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);

  const read = async (file: File) => {
    setStatus("Reading file…"); setResults([]);
    try {
      let parsed: Row[];
      if (file.name.toLowerCase().endsWith(".json")) {
        const data = JSON.parse(await file.text());
        parsed = Array.isArray(data) ? data : [data];
      } else {
        parsed = Papa.parse<Row>(await file.text(), { header: true, skipEmptyLines: true, transformHeader: (header) => header.trim() }).data;
      }
      setRows(parsed);
      setProblems(parsed.map((row) => [
        ...REQUIRED.filter((field) => !String(row[field] ?? "").trim()).map((field) => `missing ${field}`),
        ...(row.roundType === "RIDDLE" && !Array.isArray(row.riddleClues) && !row.clue1 ? ["riddles need clue1–clue3 (up to clue5)"] : []),
      ]));
      setStatus(`${parsed.length} row${parsed.length === 1 ? "" : "s"} read. Check the preview, then import.`);
    } catch (error) {
      setRows([]); setProblems([]);
      setStatus(error instanceof Error ? "Could not read this file: " + error.message : "Could not read this file.");
    }
  };

  const save = async () => {
    setBusy(true); setResults([]);
    const all: Result[] = [];
    try {
      for (let start = 0; start < rows.length; start += CHUNK) {
        setStatus(`Importing rows ${start + 1}–${Math.min(start + CHUNK, rows.length)} of ${rows.length}…`);
        const chunk = rows.slice(start, start + CHUNK).map(toPayload);
        const response = await api<{ results: Result[] }>("/api/admin/questions/import", { body: { rows: chunk } });
        all.push(...response.results.map((result) => ({ ...result, row: result.row + start })));
      }
      const count = (status: Result["status"]) => all.filter((item) => item.status === status).length;
      const imported = count("imported"), updated = count("updated");
      setStatus(`${imported} new in the review queue · ${updated} updated · ${count("unchanged")} unchanged · ${count("duplicate")} already in the bank · ${count("error")} with errors.`);
      setResults(all.filter((item) => item.status === "error" || item.status === "duplicate" || (item.status === "updated" && item.message)));
      if (imported || updated) { setRows([]); setProblems([]); onImported?.(); }
    } catch (error) { setStatus((error as ApiError).message); }
    finally { setBusy(false); }
  };

  const template = () => {
    const csv = Papa.unparse({ fields: TEMPLATE_COLUMNS, data: [[
      "PHYSICS", "Mechanics", "Uniform acceleration", "SPEED_RACE", "EASY", 15,
      "A body starts from rest and accelerates uniformly at 4 m/s^2. Find its speed after 6 s.", "24 m/s",
      "Use v = u + at with u = 0.", "v = 0 + 4 × 6 = 24 m/s.", "Using s = ut + ½at² instead of v = u + at.",
      "Name the equation first, then substitute.", "speed from rest", "SUVAT", "PAST_QUESTION", "LICENSED",
      "", "24 | 24 m s^-1", "kinematics | suvat", "NSMQ 2019 one-eighth stage", 2019, "One-eighth", "true", "false", "", "", "", "", "", "",
    ]] });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "nsmq-question-import-template.csv";
    link.click();
  };

  const invalid = problems.filter((list) => list.length).length;
  return (
    <div className="panel p-5 sm:p-7">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-gold/20 text-ink"><Upload size={19} /></span><div><h2 className="font-display text-2xl font-semibold">Bulk import</h2><p className="text-sm text-ink/50">CSV or JSON. Everything imported waits in the review queue.</p></div></div>
      <button type="button" className="button-secondary mt-4" onClick={template}><Download size={16} /> Download CSV template</button>
      <p className="mt-3 text-xs leading-5 text-ink/55">Separate multiple accepted answers with a vertical bar: <code>24 | 24 m s^-1</code>. Riddles use columns clue1 to clue5. Give each row a stable <code>importKey</code> if you plan to upload an improved version later: the same key updates the question instead of adding a copy. Past NSMQ questions: set sourceType PAST_QUESTION, fill sourceName and year, and set permissionStatus to what you actually hold.</p>
      <label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-ink/15 p-8 text-center transition hover:border-chemistry hover:bg-emerald-50">
        <span className="flex gap-2 text-ink/45"><FileSpreadsheet /><FileJson /></span>
        <span className="mt-3 font-bold">Choose a CSV or JSON file</span>
        <span className="mt-1 text-xs text-ink/45">Nothing is saved until you press Import.</span>
        <input className="hidden" type="file" accept=".csv,.json,application/json,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void read(file); event.target.value = ""; }} />
      </label>
      {status && <p className="mt-3 text-sm font-bold text-chemistry" role="status">{status}</p>}
      {rows.length > 0 && (
        <div className="mt-5">
          <div className="max-h-72 space-y-2 overflow-auto">
            {rows.slice(0, 50).map((row, index) => (
              <div key={index} className={`rounded-xl border p-3 text-sm ${problems[index]?.length ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="font-bold">{index + 1}. {String(row.questionText || "(no question text)")}</p>
                <p className="mt-1 text-xs">{problems[index]?.length ? problems[index].join("; ") : `${String(row.subject)} · ${String(row.roundType)} · answer: ${String(row.answer)}`}</p>
              </div>
            ))}
            {rows.length > 50 && <p className="text-xs text-ink/50">…and {rows.length - 50} more rows.</p>}
          </div>
          <button type="button" className="button-primary mt-4" disabled={busy || rows.length === invalid} onClick={() => void save()}>
            {busy ? "Importing…" : `Import ${rows.length - invalid} row${rows.length - invalid === 1 ? "" : "s"}`}
          </button>
          {invalid > 0 && <p className="mt-2 text-xs text-ink/55">{invalid} row{invalid === 1 ? "" : "s"} with missing fields will be reported, not imported.</p>}
        </div>
      )}
      {results.length > 0 && (
        <div className="mt-4 max-h-60 overflow-auto rounded-xl bg-ink/[0.03] p-3 text-xs">
          {results.map((result) => <p key={result.row}><strong>Row {result.row}:</strong> {result.status === "duplicate" ? "already in the bank" : result.message}</p>)}
        </div>
      )}
    </div>
  );
}
