"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";

/** Lets a student flag a wrong answer or a confusing question for coaches. */
export function ReportQuestion({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  if (state === "sent") return <p className="text-sm font-bold text-emerald-700">Thanks. A coach will check this question.</p>;
  if (!open) return <button type="button" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink/50 hover:text-ink" onClick={() => setOpen(true)}><Flag size={14} />Report a problem with this question</button>;
  const send = async () => {
    setState("sending"); setError("");
    try { await api(`/api/questions/${questionId}/report`, { body: { reason } }); setState("sent"); }
    catch (caught) { setError((caught as ApiError).message); setState("idle"); }
  };
  return (
    <div className="rounded-2xl border border-ink/10 p-4">
      <label className="text-sm font-bold">What's wrong?
        <textarea className="field mt-1 min-h-16" maxLength={1000} placeholder="e.g. The answer should be 0.073 mol/dm³, not 0.2" value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" className="button-primary" disabled={reason.trim().length < 3 || state === "sending"} onClick={() => void send()}>Send report</button>
        <button type="button" className="button-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
