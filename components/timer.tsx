"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

export function Timer({
  seconds,
  running,
  resetKey,
  onExpire,
}: {
  seconds: number;
  running: boolean;
  resetKey: string | number;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => setRemaining(seconds), [seconds, resetKey]);
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          onExpire?.();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, remaining, onExpire]);

  const urgent = remaining <= Math.min(10, Math.ceil(seconds / 3));
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
        urgent ? "bg-red-100 text-red-700" : "bg-ink/5 text-ink/65"
      }`}
    >
      <Clock3 size={16} />
      {remaining}s
    </div>
  );
}
