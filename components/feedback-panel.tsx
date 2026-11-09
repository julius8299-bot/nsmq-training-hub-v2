import { AlertTriangle, CheckCircle2, Clock3, Eye, Lightbulb, Sparkles } from "lucide-react";
import type { AttemptResult } from "@/lib/types";
import { MathText, ShortcutView } from "@/components/math-text";
import { ReportQuestion } from "@/components/report-question";
import { parseShortcut } from "@/lib/text/shortcut";

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

function headline(result: AttemptResult) {
  if (result.revealOnly) return { icon: Eye, tone: "bg-ink/5 text-ink", title: "Solution revealed", detail: "Study the method, then try the next one on your own." };
  if (result.late && result.isCorrect) return { icon: Clock3, tone: "bg-amber-100 text-amber-950", title: "Correct, but time was up.", detail: "No points this time — the shortcut below gets you there faster." };
  if (result.late) return { icon: Clock3, tone: "bg-amber-100 text-amber-950", title: "Time up.", detail: `Answer: ${result.feedback.answer}` };
  if (result.isCorrect) return { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-900", title: "Correct — sharp work.", detail: `${result.pointsAwarded} point${result.pointsAwarded === 1 ? "" : "s"} secured in ${result.timeTakenSeconds}s.` };
  return { icon: AlertTriangle, tone: "bg-amber-100 text-amber-950", title: "Not this time — learn the pattern.", detail: `Correct answer: ${result.feedback.answer}${result.pointsAwarded < 0 ? ` (${result.pointsAwarded} point)` : ""}` };
}

export function FeedbackPanel({ result, questionId }: { result: AttemptResult; questionId?: string }) {
  const { feedback } = result;
  const top = headline(result);
  const Icon = top.icon;
  return (
    <div className="mt-6 space-y-3" aria-live="polite">
      <div className={`flex items-start gap-3 rounded-2xl p-5 ${top.tone}`}>
        <Icon className="shrink-0" />
        <div>
          <p className="font-display text-xl font-semibold">{top.title}</p>
          <p className="mt-1 text-sm">{top.detail}</p>
          {result.isCorrect && !result.late && <p className="mt-1 text-sm">Answer: {feedback.answer}</p>}
          {feedback.acceptedAnswers.length > 0 && <p className="mt-1 text-xs opacity-70">Also accepted: {feedback.acceptedAnswers.join(" · ")}</p>}
        </div>
      </div>
      <ShortcutSolutionBox>
        {parseShortcut(feedback.shortcutSolution)
          ? <ShortcutView text={feedback.shortcutSolution} />
          : <span className="flex gap-2"><Lightbulb className="mt-0.5 shrink-0 text-gold" size={18} /><MathText>{feedback.shortcutSolution}</MathText></span>}
      </ShortcutSolutionBox>
      <FullSolutionBox><MathText>{feedback.fullSolution}</MathText></FullSolutionBox>
      {feedback.markingScheme && <SolutionBox title="Marking scheme">{feedback.markingScheme}</SolutionBox>}
      {feedback.examinerFocus && <SolutionBox title="What the examiner is testing">{feedback.examinerFocus}</SolutionBox>}
      {feedback.riddleClues.length > result.cluesUsed && result.cluesUsed > 0 && (
        <SolutionBox title="Clues you did not need">
          {feedback.riddleClues.slice(result.cluesUsed).map((clue) => `${clue.clueNumber}. ${clue.clueText}`).join("\n")}
        </SolutionBox>
      )}
      <CommonTrapBox>{feedback.commonTrap}</CommonTrapBox>
      <EncouragementBox>
        <span className="flex gap-2"><Sparkles className="mt-0.5 shrink-0 text-gold" size={18} />{feedback.encouragement}</span>
      </EncouragementBox>
      {questionId && <ReportQuestion questionId={questionId} />}
    </div>
  );
}
