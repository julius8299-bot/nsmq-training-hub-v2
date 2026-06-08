"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { galleryItems, motivationQuotes } from "@/lib/gallery-data";

export function MotivationCorner() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % galleryItems.length), 7000);
    return () => window.clearInterval(timer);
  }, []);
  const item = galleryItems[index];

  return (
    <section className="panel mt-8 grid overflow-hidden md:grid-cols-[.9fr_1.1fr]">
      <div className="relative min-h-64">
        <Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
      </div>
      <div className="flex flex-col justify-center bg-ink p-7 text-white sm:p-9">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold"><Sparkles size={16} /> Motivation Corner</p>
        <blockquote className="mt-4 font-display text-3xl font-semibold leading-snug">“{motivationQuotes[index % motivationQuotes.length]}”</blockquote>
        <p className="mt-3 text-sm leading-6 text-white/60">{item.caption}</p>
        <Link href="/gallery" className="mt-6 inline-flex items-center gap-2 font-bold text-gold">View gallery <ArrowRight size={17} /></Link>
      </div>
    </section>
  );
}
