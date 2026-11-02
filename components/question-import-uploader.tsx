"use client";

import Papa from "papaparse";
import { FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";

const requiredFields = [
  "subject", "topic", "subtopic", "roundType", "difficulty", "timeLimitSeconds",
  "questionText", "answer", "shortcutSolution", "fullSolution", "commonTrap",
  "encouragement", "repeatedPattern", "patternFamily", "sourceType", "permissionStatus",
];

type ImportRow = Record<string, unknown> & { _errors?: string[] };

function arrayField(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value);
  const text = String(value ?? "").trim();
  if (!text) return "[]";
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return JSON.stringify(text.split(",").map((item) => item.trim()).filter(Boolean));
  }
}

export function QuestionImportUploader({ onImported }: { onImported?: () => void }) {
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<ImportRow[]>([]);

  const read = async (file: File) => {
    setStatus("Reading file...");
    let rows: Record<string, unknown>[] = [];
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(await file.text());
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const parsed = Papa.parse<Record<string, unknown>>(await file.text(), { header: true, skipEmptyLines: true });
        rows = parsed.data;
      }
      const checked = rows.map((row) => ({
        ...row,
        _errors: [
          ...requiredFields.filter((field) => !String(row[field] ?? "").trim()).map((field) => `Missing ${field}`),
          ...(row.roundType === "RIDDLE" && !Array.isArray(row.riddleClues) ? ["Riddles need riddleClues in JSON imports"] : []),
        ],
      }));
      setPreview(checked);
      setStatus(`${checked.length} row${checked.length === 1 ? "" : "s"} ready for preview.`);
    } catch (error) {
      setPreview([]);
      setStatus(error instanceof Error ? error.message : "Could not read this file.");
    }
  };

  const save = async () => {
    const valid = preview.filter((row) => !row._errors?.length);
    let saved = 0;
    for (const source of valid) {
      const { _errors, ...row } = source;
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...row,
          acceptedAnswers: arrayField(row.acceptedAnswers),
          tags: arrayField(row.tags),
          ghanaContext: row.ghanaContext === true || row.isGhanaContext === true || String(row.ghanaContext).toLowerCase() === "true" || String(row.isGhanaContext).toLowerCase() === "true",
          isGhanaContext: row.isGhanaContext === true || row.ghanaContext === true || String(row.isGhanaContext).toLowerCase() === "true" || String(row.ghanaContext).toLowerCase() === "true",
          isPastQuestion: row.isPastQuestion === true || String(row.isPastQuestion).toLowerCase() === "true",
          isPrivateOnly: row.isPrivateOnly === true || String(row.isPrivateOnly).toLowerCase() === "true",
        }),
      });
      if (response.ok) saved += 1;
    }
    setStatus(`${saved} of ${preview.length} questions imported.`);
    if (saved) {
      setPreview([]);
      onImported?.();
    }
  };

  const invalidCount = preview.filter((row) => row._errors?.length).length;

  return (
    <div className="panel p-5 sm:p-7">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-gold/20 text-ink"><Upload size={19} /></span><div><h2 className="font-display text-2xl font-semibold">Bulk import</h2><p className="text-sm text-ink/50">Preview and validate CSV or JSON before saving.</p></div></div>
      <label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-ink/15 p-8 text-center transition hover:border-chemistry hover:bg-emerald-50">
        <span className="flex gap-2 text-ink/45"><FileSpreadsheet /><FileJson /></span>
        <span className="mt-3 font-bold">Choose a CSV or JSON file</span>
        <span className="mt-1 text-xs text-ink/45">No question is saved until you confirm the preview.</span>
        <input className="hidden" type="file" accept=".csv,.json,application/json,text/csv" onChange={(event) => event.target.files?.[0] && read(event.target.files[0])} />
      </label>
      {status && <p className="mt-3 text-sm font-bold text-chemistry">{status}</p>}
      {preview.length > 0 && (
        <div className="mt-5">
          <div className="max-h-72 space-y-2 overflow-auto">
            {preview.slice(0, 20).map((row, index) => (
              <div key={index} className={`rounded-xl border p-3 text-sm ${row._errors?.length ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="font-bold">{String(row.questionText || `Row ${index + 1}`)}</p>
                <p className="mt-1 text-xs">{row._errors?.length ? row._errors.join("; ") : `${row.subject} · ${row.roundType} · valid`}</p>
              </div>
            ))}
          </div>
          <button type="button" className="button-primary mt-4" disabled={preview.length === invalidCount} onClick={save}>
            Import {preview.length - invalidCount} valid question{preview.length - invalidCount === 1 ? "" : "s"}
          </button>
        </div>
      )}
    </div>
  );
}
