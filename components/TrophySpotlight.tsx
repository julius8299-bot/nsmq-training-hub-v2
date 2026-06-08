import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function TrophySpotlight() {
  return (
    <section className="page-shell py-14">
      <div className="panel grid overflow-hidden lg:grid-cols-2">
        <div className="relative min-h-80">
          <Image src="/gallery/nsmq-trophy.jpg" alt="NSMQ champion trophy" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink/20" />
        </div>
        <div className="flex flex-col justify-center bg-ink p-8 text-white sm:p-12">
          <div className="relative size-16 overflow-hidden rounded-2xl bg-white">
            <Image
              src="/brand/nsmq-logo.png"
              alt="National Science and Maths Quiz logo"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <p className="eyebrow mt-6 text-gold">What We Train For</p>
          <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Champions are trained, not discovered.</h2>
          <p className="mt-5 leading-7 text-white/65">Every correct pattern, every faster response, and every composed recovery builds the student who can perform on the national stage.</p>
          <Link href="/practice" className="mt-7 inline-flex items-center gap-2 font-bold text-gold">Start Training <ArrowRight size={17} /></Link>
        </div>
      </div>
    </section>
  );
}
