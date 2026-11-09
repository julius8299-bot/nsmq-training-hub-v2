/** Four-part shortcut stored as labelled lines, so it survives CSV/JSON import and older plain-text shortcuts still work. */
export const SHORTCUT_PARTS = [
  { key: "recognise", label: "Recognise" },
  { key: "fastRoute", label: "Fast route" },
  { key: "formula", label: "Formula" },
  { key: "check", label: "Quick check" },
] as const;
export type ShortcutParts = Partial<Record<(typeof SHORTCUT_PARTS)[number]["key"], string>>;

const LABEL = new RegExp(`^\\s*(${SHORTCUT_PARTS.map((part) => part.label).join("|")}|Check)\\s*:\\s*`, "i");

export function formatShortcut(parts: ShortcutParts) {
  return SHORTCUT_PARTS.filter((part) => parts[part.key]?.trim()).map((part) => `${part.label}: ${parts[part.key]!.trim()}`).join("\n");
}

/** Returns the parts when the text uses the labels, otherwise null (render as plain text). */
export function parseShortcut(text: string): ShortcutParts | null {
  const parts: ShortcutParts = {};
  let current: keyof ShortcutParts | null = null;
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(LABEL);
    if (match) {
      const label = match[1].toLowerCase();
      current = (SHORTCUT_PARTS.find((part) => part.label.toLowerCase() === label)?.key ?? "check");
      parts[current] = line.slice(match[0].length).trim();
    } else if (current && line.trim()) {
      parts[current] = `${parts[current]}\n${line.trim()}`;
    } else if (!current && line.trim()) {
      return null;
    }
  }
  return parts.fastRoute || parts.recognise ? parts : null;
}

const SUPERSCRIPT: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "+": "⁺", n: "ⁿ" };
/** Light maths tidy-up for older plain-text questions: x^2 → x², x^-1 → x⁻¹, sqrt(3) → √(3). Leaves everything else untouched. */
export function prettyMaths(text: string) {
  return text
    .replace(/\^\(?([-+]?\d{1,3}|n)\)?(?![\d.])/g, (_, power: string) => [...power].map((char) => SUPERSCRIPT[char] ?? char).join(""))
    .replace(/\bsqrt\s*(?=\()/gi, "√")
    .replace(/(\d)\s*\*\s*(\d)/g, "$1 × $2");
}
