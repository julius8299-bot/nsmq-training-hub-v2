"use client";

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  disabled,
  multiline,
  trueFalse,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (answerOverride?: string) => void;
  disabled?: boolean;
  multiline?: boolean;
  trueFalse?: boolean;
}) {
  if (trueFalse) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {["True", "False"].map((answer) => (
          <button
            key={answer}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(answer);
              onSubmit(answer);
            }}
            className="rounded-2xl border border-ink/15 bg-white p-4 text-lg font-bold transition hover:border-chemistry hover:bg-emerald-50 disabled:opacity-50"
          >
            {answer}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {multiline ? (
        <textarea
          className="field min-h-32 flex-1"
          placeholder="Write your solution or final answer…"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="field flex-1"
          placeholder="Type your answer"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
        />
      )}
      <button
        type="button"
        className="button-primary sm:self-end"
        disabled={disabled || !value.trim()}
        onClick={() => onSubmit()}
      >
        Submit answer
      </button>
    </div>
  );
}
