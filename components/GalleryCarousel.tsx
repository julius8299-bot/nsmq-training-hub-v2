"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/gallery-data";

export function GalleryCarousel({ items, compact = false }: { items: GalleryItem[]; compact?: boolean }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % items.length), 6000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const item = items[index];
  const move = (direction: number) => setIndex((value) => (value + direction + items.length) % items.length);

  return (
    <div className="panel overflow-hidden">
      <div className={`relative ${compact ? "aspect-[16/8]" : "aspect-[16/9] sm:aspect-[16/7]"}`}>
        <Image
          key={item.src}
          src={item.src}
          alt={item.alt}
          fill
          sizes="(max-width: 768px) 100vw, 1100px"
          className="object-cover"
          style={{ objectPosition: item.objectPosition ?? "center" }}
          priority={index === 0}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <p className="eyebrow text-gold">NSMQ Moments</p>
          <h3 className="mt-2 font-display text-2xl font-semibold sm:text-4xl">{item.title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">{item.caption}</p>
        </div>
        <button type="button" aria-label="Previous gallery image" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow" onClick={() => move(-1)}><ChevronLeft /></button>
        <button type="button" aria-label="Next gallery image" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow" onClick={() => move(1)}><ChevronRight /></button>
      </div>
      <div className="flex justify-center gap-2 p-3">
        {items.map((entry, itemIndex) => (
          <button key={entry.src} type="button" aria-label={`Show ${entry.title}`} onClick={() => setIndex(itemIndex)} className={`h-2 rounded-full transition-all ${itemIndex === index ? "w-8 bg-chemistry" : "w-2 bg-ink/20"}`} />
        ))}
      </div>
    </div>
  );
}
