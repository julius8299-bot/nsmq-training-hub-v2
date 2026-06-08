"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";
import { GalleryCarousel } from "@/components/GalleryCarousel";
import { PageHeading } from "@/components/page-heading";
import { galleryItems, type GalleryItem } from "@/lib/gallery-data";

export default function GalleryPage() {
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  return (
    <div className="page-shell">
      <PageHeading eyebrow="Ghanata SHS · NSMQ" title="NSMQ Gallery" description="A visual story of discipline, teamwork, and excellence." />
      <GalleryCarousel items={galleryItems} />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryItems.map((item) => (
          <button key={item.src} type="button" onClick={() => setSelected(item)} className="panel group overflow-hidden text-left">
            <div className="relative aspect-[4/3]"><Image src={item.src} alt={item.alt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /></div>
            <div className="p-5"><h2 className="font-display text-xl font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-ink/55">{item.caption}</p></div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/90 p-4" role="dialog" aria-modal="true" aria-label={selected.title}>
          <button type="button" aria-label="Close image preview" className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white text-ink" onClick={() => setSelected(null)}><X /></button>
          <div className="w-full max-w-5xl">
            <div className="relative aspect-[16/10]"><Image src={selected.src} alt={selected.alt} fill sizes="100vw" className="object-contain" /></div>
            <p className="mt-4 text-center font-display text-2xl font-semibold text-white">{selected.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
