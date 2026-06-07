import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Gauge,
  Lightbulb,
  Medal,
  TimerReset,
} from "lucide-react";

const modes = [
  { icon: Medal, title: "Full contest practice", text: "Five rounds, live scoring, solo or team." },
  { icon: BookOpenCheck, title: "Self-practice", text: "Drill the exact subject, topic, and level you need." },
  { icon: Gauge, title: "Speed race", text: "Build fast recall without sacrificing accuracy." },
  { icon: BrainCircuit, title: "Riddles and patterns", text: "Learn to identify clues earlier and score higher." },
];

export default function HomePage() {
  return (
    <>
      <section className="page-shell grid min-h-[72vh] items-center gap-12 py-16 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="eyebrow mb-5">For Ghanaian SHS science students</p>
          <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            Train like an <span className="text-chemistry">NSMQ finalist.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/65">
            Master Mathematics, Physics, Chemistry, and Biology through disciplined practice,
            shortcut solutions, repeated patterns, and competitive feedback.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/practice" className="button-primary">
              Start Practice <ArrowRight size={17} />
            </Link>
            <Link href="/full-contest" className="button-secondary">Full Contest</Link>
            <Link href="/admin" className="button-secondary">Admin Upload</Link>
          </div>
        </div>
        <div className="panel relative overflow-hidden p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-gold/20" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-chemistry/10 px-3 py-1 text-xs font-bold text-chemistry">
                LIVE TRAINING
              </span>
              <TimerReset className="text-gold" />
            </div>
            <p className="mt-8 text-sm font-bold text-ink/50">SPEED RACE · PHYSICS</p>
            <p className="mt-3 font-display text-2xl font-semibold leading-snug">
              A body starts from rest and accelerates uniformly at 4 m/s². Find its speed after 6 s.
            </p>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full w-2/3 rounded-full bg-gold" />
            </div>
            <div className="mt-6 rounded-2xl bg-ink p-5 text-white">
              <div className="flex gap-3">
                <Lightbulb className="shrink-0 text-gold" size={20} />
                <div>
                  <p className="font-bold">Shortcut first</p>
                  <p className="mt-1 text-sm text-white/65">From rest, v = at = 4 × 6 = 24 m/s.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="page-shell py-0">
          <p className="eyebrow text-gold">One training ground. Five contest rounds.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {modes.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Icon className="text-gold" />
                <h2 className="mt-5 font-display text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
