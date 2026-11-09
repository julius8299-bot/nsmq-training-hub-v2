"use client";

import { formatShortcut, parseShortcut, SHORTCUT_PARTS, type ShortcutParts } from "@/lib/text/shortcut";

const HINTS: Record<string, string> = {
  recognise: "Cue words that tell you which idea this is, e.g. “first term, common difference, sum” → AP sum",
  fastRoute: "The mental route with this question's numbers, e.g. 17 terms → 17 × middle term; middle = 23 + 8×6 = 71; 17 × 71 = 1207",
  formula: "e.g. Sₙ = n/2 [2a + (n − 1)d]",
  check: "2–5 second sanity check: units, size, last digit, plug back in",
};

/** Edits the four-part shortcut and stores it as labelled lines in shortcutSolution. */
export function ShortcutEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const pending = value.trimStart().startsWith("[Shortcut pending]");
  const parts: ShortcutParts = pending ? {} : parseShortcut(value) ?? (value.trim() ? { fastRoute: value } : {});
  const update = (key: keyof ShortcutParts, text: string) => onChange(formatShortcut({ ...parts, [key]: text }));
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-ink/10 p-4 sm:col-span-2 lg:col-span-3">
      <legend className="px-1 text-sm font-bold">Shortcut <span className="font-normal text-ink/50">(fast route required; the other parts are strongly recommended)</span></legend>
      {SHORTCUT_PARTS.map((part, index) => (
        <label key={part.key} className="text-sm font-bold">
          {index + 1}. {part.label}
          <textarea required={part.key === "fastRoute"} className="field min-h-14" placeholder={HINTS[part.key]}
            value={parts[part.key] ?? ""} onChange={(event) => update(part.key, event.target.value)} />
        </label>
      ))}
    </fieldset>
  );
}
