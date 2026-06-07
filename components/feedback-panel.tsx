import { AlertTriangle, CheckCircle2, Lightbulb, Sparkles } from "lucide-react";
import type { Question } from "@/lib/types";

function SolutionBox({
  title,
  children,
  tone = "light",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "light" | "dark" | "warning";
}) {
  const classes = {
    light: "bg-emerald-50 border-emerald-100",
    dark: "bg-ink text-white border-ink",
    warning: "bg-amber-50 border-amber-200",
  };
  return (
    <div className={`rounded-2xl border p-5 ${classes[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-60">{title}</p>
      <div className="mt-2 whitespace-pre-line text-sm leading-6">{children}</div>
    </div>
  );
}

export const ShortcutSolutionBox = ({ children }: { children: React.ReactNode }) => (
  <SolutionBox title="Shortcut solution" tone="dark">{children}</SolutionBox>
);
export const FullSolutionBox = ({ children }: { children: React.ReactNode }) => (
  <SolutionBox title="Why this works">{children}</SolutionBox>
);
export const CommonTrapBox = ({ children }: { children: React.ReactNode }) => (
  <SolutionBox title="Common trap" tone="warning">{children}</SolutionBox>
);
export const EncouragementBox = ({ children }: { children: React.ReactNode }) => (
  <SolutionBox title="Coach's note">{children}</SolutionBox>
);

export function FeedbackPanel({
  question,
  isCorrect,
  points,
}: {
  question: Question;
  isCorrect: boolean;
  points: number;
}) {
  return (
    <div className="mt-6 space-y-3">
      <div
        className={`flex items-start gap-3 rounded-2xl p-5 ${
          isCorrect ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"
        }`}
      >
        {isCorrect ? <CheckCircle2 className="shrink-0" /> : <AlertTriangle className="shrink-0" />}
        <div>
          <p className="font-display text-xl font-semibold">
            {isCorrect ? "Correct — sharp work." : "Not bad — this is a common trap."}
          </p>
          <p className="mt-1 text-sm">
            {isCorrect ? `${points} point${points === 1 ? "" : "s"} secured.` : `Correct answer: ${question.answer}`}
          </p>
          {isCorrect && <p className="mt-1 text-sm">Answer: {question.answer}</p>}
        </div>
      </div>
      <ShortcutSolutionBox>
        <span className="flex gap-2"><Lightbulb className="mt-0.5 shrink-0 text-gold" size={18} />{question.shortcutSolution}</span>
      </ShortcutSolutionBox>
      <FullSolutionBox>{question.fullSolution}</FullSolutionBox>
      <CommonTrapBox>{question.commonTrap}</CommonTrapBox>
      <EncouragementBox>
        <span className="flex gap-2"><Sparkles className="mt-0.5 shrink-0 text-gold" size={18} />{question.encouragement}</span>
      </EncouragementBox>
    </div>
  );
}
