import { parseShortcut, prettyMaths, SHORTCUT_PARTS } from "@/lib/text/shortcut";

/** Question/solution text with light maths formatting; keeps line breaks. */
export function MathText({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`whitespace-pre-line ${className}`}>{prettyMaths(children)}</span>;
}

/** Shows a four-part shortcut as labelled steps; older one-line shortcuts render as text. */
export function ShortcutView({ text, dark = true }: { text: string; dark?: boolean }) {
  const parts = parseShortcut(text);
  if (!parts) return <MathText>{text}</MathText>;
  return (
    <ol className="grid gap-3">
      {SHORTCUT_PARTS.filter((part) => parts[part.key]).map((part, index) => (
        <li key={part.key} className="flex gap-3">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${dark ? "bg-gold text-ink" : "bg-ink text-white"}`}>{index + 1}</span>
          <span>
            <span className={`block text-xs font-bold uppercase tracking-wider ${dark ? "text-gold" : "text-ink/60"}`}>{part.label}</span>
            <MathText className={part.key === "formula" ? "font-mono text-[0.95em]" : ""}>{parts[part.key]!}</MathText>
          </span>
        </li>
      ))}
    </ol>
  );
}
