"use client";

import { useMemo, useState } from "react";
import { Atom } from "lucide-react";
import { DifficultyFilter } from "@/components/filters";
import { LoadState } from "@/components/load-state";
import { PageHeading } from "@/components/page-heading";
import { QuestionRunner } from "@/components/question-runner";
import { useTrainingSet } from "@/lib/client/use-training-set";
import { ELEMENTS, RELATIVE_ATOMIC_MASS, SYMBOL_ORIGINS, configurationText, shellArrangement, type Category, type Element } from "@/lib/elements/data";
import { ELEMENT_DRILLS } from "@/lib/elements/drills";

const COLOURS: Record<Category, string> = {
  "alkali metal": "bg-rose-100 text-rose-900", "alkaline earth metal": "bg-orange-100 text-orange-900",
  "transition metal": "bg-amber-50 text-amber-900", "post-transition metal": "bg-teal-50 text-teal-900",
  metalloid: "bg-lime-100 text-lime-900", nonmetal: "bg-emerald-100 text-emerald-900", halogen: "bg-sky-100 text-sky-900",
  "noble gas": "bg-violet-100 text-violet-900", lanthanide: "bg-pink-50 text-pink-900", actinide: "bg-fuchsia-50 text-fuchsia-900",
  superheavy: "bg-ink/5 text-ink/60",
};

/** Grid position: 18 columns, with lanthanides/actinides in two rows underneath (rows 9–10). */
function cell(element: Element) {
  if (element.group !== null) return { row: element.period, column: element.group };
  const first = element.period === 6 ? 57 : 89;
  return { row: element.period === 6 ? 9 : 10, column: 3 + (element.z - first) };
}

function Facts({ element }: { element: Element }) {
  const origin = SYMBOL_ORIGINS[element.symbol];
  const rows: [string, string][] = [
    ["Atomic number", String(element.z)],
    ["Position", `Period ${element.period}${element.group !== null ? `, group ${element.group}` : " (f-block series)"}, ${element.block}-block`],
    ["Family", element.category + (element.categoryContested ? " (classification varies between textbooks)" : "")],
    ...(element.state ? [["State at 25 °C", element.state] as [string, string]] : []),
    ...(element.z <= 36 ? [["Configuration", configurationText(element.z)] as [string, string]] : []),
    ...(element.z <= 20 ? [["Shells", shellArrangement(element.z).join(", ")] as [string, string]] : []),
    ...(RELATIVE_ATOMIC_MASS[element.symbol] ? [["Relative atomic mass (WASSCE)", String(RELATIVE_ATOMIC_MASS[element.symbol])] as [string, string]] : []),
    ...(origin ? [["Symbol from", `${origin.language} "${origin.origin}"`] as [string, string]] : []),
  ];
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-4">
        <span className={`grid size-16 place-items-center rounded-2xl font-display text-3xl font-semibold ${COLOURS[element.category]}`}>{element.symbol}</span>
        <div><p className="font-display text-2xl font-semibold">{element.name}</p><p className="text-sm text-ink/50">Z = {element.z}</p></div>
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        {rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-t border-ink/5 pt-2"><dt className="text-ink/50">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}
      </dl>
    </div>
  );
}

export default function ElementsPage() {
  const [drill, setDrill] = useState<string>(ELEMENT_DRILLS[0].id);
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState("10");
  const [seconds, setSeconds] = useState("10");
  const [session, setSession] = useState<Record<string, string | undefined> | null>(null);
  const [selected, setSelected] = useState<Element>(ELEMENTS[0]);
  const set = useTrainingSet(session);
  const subtopic = ELEMENT_DRILLS.find((item) => item.id === drill)!.subtopic;
  const cells = useMemo(() => ELEMENTS.map((element) => ({ element, ...cell(element) })), []);

  return (
    <div className="page-shell">
      <PageHeading eyebrow="Periodic table" title="Element Drills" description="All 118 elements, every way a quiz mistress can turn them: symbols, numbers, positions, families, configurations, ions, isotopes, formula masses and riddles. Short clocks build instant recall." />
      {!session ? (
        <div className="panel mb-10 p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-ink text-gold"><Atom size={19} /></span><h2 className="font-display text-2xl font-semibold">Choose a drill</h2></div>
          <div className="flex flex-wrap gap-2">
            {ELEMENT_DRILLS.map((item) => (
              <button key={item.id} type="button" onClick={() => setDrill(item.id)} className={`rounded-full px-4 py-2 text-sm font-bold ${drill === item.id ? "bg-ink text-white" : "bg-ink/5"}`}>{item.label}</button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-bold">Difficulty<DifficultyFilter value={difficulty} onChange={setDifficulty} includeAll allLabel="Mixed (all elements)" /></label>
            <label className="text-sm font-bold">Questions<select className="field" value={count} onChange={(event) => setCount(event.target.value)}>{[10, 20, 30, 50].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="text-sm font-bold">Seconds per question<select className="field" value={seconds} onChange={(event) => setSeconds(event.target.value)}>
              {["5", "10", "20", "30"].map((value) => <option key={value}>{value}</option>)}<option value="untimed">Untimed</option>
            </select></label>
          </div>
          <p className="mt-3 text-xs text-ink/50">Easy covers H–Ca; medium adds the first transition row and the famous heavy elements; NSMQ final level reaches the lanthanides, actinides and superheavy elements.</p>
          <button type="button" className="button-primary mt-6" onClick={() => setSession({ tag: "periodic-table", subtopic, difficulty, limit: count })}>Start drill</button>
        </div>
      ) : (
        <div className="mb-10 max-w-4xl">
          <button type="button" className="button-secondary mb-4" onClick={() => setSession(null)}>Change drill</button>
          <LoadState loading={set.loading} error={set.error} onRetry={set.reload} />
          {!set.loading && !set.error && (
            <QuestionRunner runId={set.version} questions={set.questions} mode="ELEMENT_DRILL"
              timeLimitSeconds={seconds === "untimed" ? null : Number(seconds)} timed={seconds !== "untimed"} onNewSet={set.reload}
              emptyMessage="No element drills are loaded yet. Ask your administrator to run the element import." />
          )}
        </div>
      )}

      <section>
        <h2 className="font-display text-3xl font-semibold">Study the table</h2>
        <p className="mt-1 text-sm text-ink/55">Tap any element for its facts.</p>
        <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[760px] gap-1" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))", gridTemplateRows: "repeat(10, auto)" }}>
              {cells.map(({ element, row, column }) => (
                <button key={element.z} type="button" onClick={() => setSelected(element)} aria-label={`${element.name}, atomic number ${element.z}`}
                  style={{ gridRow: row + (row >= 9 ? 0 : 0), gridColumn: column, marginTop: row === 9 ? 12 : 0 }}
                  className={`rounded-md p-1 text-center leading-tight transition hover:ring-2 hover:ring-ink/40 ${COLOURS[element.category]} ${selected.z === element.z ? "ring-2 ring-ink" : ""}`}>
                  <span className="block text-[9px] opacity-60">{element.z}</span>
                  <span className="block text-sm font-bold">{element.symbol}</span>
                </button>
              ))}
            </div>
          </div>
          <Facts element={selected} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(Object.keys(COLOURS) as Category[]).map((category) => <span key={category} className={`rounded-full px-2.5 py-1 font-bold ${COLOURS[category]}`}>{category}</span>)}
        </div>
      </section>
    </div>
  );
}
