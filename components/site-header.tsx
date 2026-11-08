"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

type SessionUser = { name: string; role: string; permissions: string[] };

const nav: { label: string; href: string; staff?: boolean }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Practice", href: "/practice" },
  { label: "Elements", href: "/elements" },
  { label: "Full Contest", href: "/full-contest" },
  { label: "Speed Race", href: "/speed-race" },
  { label: "POTD", href: "/problem-of-the-day" },
  { label: "T/F", href: "/true-false" },
  { label: "Riddles", href: "/riddles" },
  { label: "Question Bank", href: "/question-bank" },
  { label: "Gallery", href: "/gallery" },
  { label: "Coach Tools", href: "/admin", staff: true },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => { if (response.ok) setUser((await response.json()).user); })
      .catch(() => {});
  }, []);
  const staff = Boolean(user?.permissions.some((permission) => ["questions:write", "members:manage", "students:view"].includes(permission)));
  const items = nav.filter((item) => !item.staff || staff);
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-white">
            <Image
              src="/brand/nsmq-logo.png"
              alt="National Science and Maths Quiz logo"
              fill
              sizes="44px"
              className="object-contain"
              priority
            />
          </span>
          <span>NSMQ Training Hub</span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-semibold xl:flex">
          {items.map(({ label, href }) => (
            <Link key={href} href={href} className="text-ink/70 transition hover:text-chemistry">
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-xl border border-ink/10 xl:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="grid gap-1 border-t border-ink/10 bg-cream px-4 py-3 xl:hidden">
          {items.map(({ label, href }) => (
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
