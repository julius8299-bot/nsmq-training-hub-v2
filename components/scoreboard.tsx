"use client";

import { Minus, Plus } from "lucide-react";

export function Scoreboard({
  scores,
  onChange,
  editable = false,
}: {
  scores: Record<string, number>;
  onChange?: (team: string, amount: number) => void;
  editable?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {Object.entries(scores).map(([team, score], index) => (
        <div key={team} className={`rounded-2xl p-4 text-white ${index === 0 ? "bg-chemistry" : index === 1 ? "bg-physics" : "bg-biology"}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/65">{team}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-display text-4xl font-semibold">{score}</span>
            {editable && (
              <div className="flex gap-1">
                <button type="button" aria-label={`Remove point from ${team}`} className="grid size-8 place-items-center rounded-full bg-white/15" onClick={() => onChange?.(team, -1)}><Minus size={15} /></button>
                <button type="button" aria-label={`Add point to ${team}`} className="grid size-8 place-items-center rounded-full bg-white/15" onClick={() => onChange?.(team, 1)}><Plus size={15} /></button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
