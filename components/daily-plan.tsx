"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { api } from "@/lib/client/api";

type Plan = {
  date: string; completed: number; streak: number;
  steps: { id: string; title: string; detail: string; href: string; target: number; done: number; complete: boolean }[];
  review: { due: number; upcoming: number; mastered: number };
};

/** Today's five-step plan with live progress. */
export function DailyPlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => { api<Plan>("/api/training/plan").then(setPlan).catch(() => setPlan(null)); }, []);
  if (!plan) return null;
  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Today&apos;s plan · {plan.date}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{plan.completed === plan.steps.length ? "All done. Well trained." : `${plan.completed} of ${plan.steps.length} steps done`}</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1.5 text-sm font-bold"><Flame size={16} className="text-orange-600" />{plan.streak}-day streak</span>
      </div>
      <ol className="mt-5 grid gap-2">
        {plan.steps.map((step) => (
          <li key={step.id}>
            <Link href={step.href} className={`flex items-start gap-3 rounded-xl p-3 transition hover:bg-ink/[0.04] ${step.complete ? "opacity-60" : ""}`}>
              {step.complete ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} /> : <Circle className="mt-0.5 shrink-0 text-ink/30" size={20} />}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{step.title}</span>
                  {step.target > 0 && <span className="text-xs font-bold text-ink/50">{Math.min(step.done, step.target)} / {step.target}</span>}
                </span>
                <span className="block text-sm text-ink/60">{step.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
