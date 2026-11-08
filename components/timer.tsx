"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";

/** Counts down from a fixed deadline (accurate even if the tab sleeps) and calls onExpire once. */
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
  const deadline = useRef(Date.now() + seconds * 1000);
  const expired = useRef(false);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    deadline.current = Date.now() + seconds * 1000;
    expired.current = false;
    setRemaining(seconds);
  }, [seconds, resetKey]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !expired.current) {
        expired.current = true;
        expire.current?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running, resetKey]);

  const urgent = remaining <= Math.min(10, Math.ceil(seconds / 3));
  return (
    <div
      role="timer"
      aria-label={`${remaining} seconds left`}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${
        urgent ? "bg-red-100 text-red-700" : "bg-ink/5 text-ink/65"
      }`}
    >
      <Clock3 size={16} />
      {remaining}s
    </div>
  );
}
