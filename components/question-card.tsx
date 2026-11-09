import { ROUND_LABELS, SUBJECT_STYLES } from "@/lib/constants";
import { MathText } from "@/components/math-text";
import type { PublicQuestion } from "@/lib/types";

export function QuestionCard({
  question,
  index,
  total,
  children,
  hideText = false,
}: {
  question: Pick<PublicQuestion, "subject" | "difficulty" | "roundType" | "topic" | "questionText"> & { preamble?: string | null };
  /** Listen-only mode: the text stays hidden until the student has answered. */
  hideText?: boolean;
  index?: number;
  total?: number;
  children?: React.ReactNode;
}) {
  const style = SUBJECT_STYLES[question.subject] ?? SUBJECT_STYLES.MATHEMATICS;
  return (
    <article className="panel overflow-hidden">
      <div className={`h-1.5 ${style.accent}`} />
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
            <span className={`rounded-full px-3 py-1 ${style.bg} ${style.text}`}>{question.subject}</span>
            <span className="rounded-full bg-ink/5 px-3 py-1 text-ink/55">{question.difficulty.replaceAll("_", " ")}</span>
          </div>
          {index !== undefined && total !== undefined && (
            <span className="text-sm font-bold text-ink/40">{index + 1} / {total}</span>
          )}
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-ink/45">
          {ROUND_LABELS[question.roundType]} · {question.topic}
        </p>
        {hideText ? (
          <p className="mt-3 rounded-2xl bg-ink/5 p-5 font-display text-xl font-semibold text-ink/60">Listen to the quizmaster. The question appears after you answer.</p>
        ) : (
          <>
            {question.preamble && <p className="mt-3 text-sm leading-6 text-ink/70"><MathText>{question.preamble}</MathText></p>}
            <h2 className="mt-3 whitespace-pre-line font-display text-2xl font-semibold leading-snug sm:text-3xl">
              <MathText>{question.questionText}</MathText>
            </h2>
          </>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </article>
  );
}
