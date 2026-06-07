"use client";

import Link from "next/link";
import { Menu, Trophy, X } from "lucide-react";
import { useState } from "react";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Practice", "/practice"],
  ["Full Contest", "/full-contest"],
  ["Speed Race", "/speed-race"],
  ["POTD", "/problem-of-the-day"],
  ["T/F", "/true-false"],
  ["Riddles", "/riddles"],
  ["Question Bank", "/question-bank"],
  ["Admin", "/admin"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-xl bg-ink text-gold">
            <Trophy size={18} />
          </span>
          NSMQ Training Hub
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold lg:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="text-ink/70 transition hover:text-chemistry">
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          aria-label="Toggle navigation"
          className="grid size-10 place-items-center rounded-xl border border-ink/10 lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="grid gap-1 border-t border-ink/10 bg-cream px-4 py-3 lg:hidden">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-white"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
