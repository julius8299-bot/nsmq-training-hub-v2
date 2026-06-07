import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "NSMQ Training Hub",
  description: "Speed, accuracy, shortcuts, and confidence for Ghanaian SHS science students.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-screen font-sans`}>
        <SiteHeader />
        <main>{children}</main>
        <footer className="border-t border-ink/10 py-8 text-center text-sm text-ink/55">
          Built for disciplined practice. Independent educational project; no official NSMQ branding.
        </footer>
      </body>
    </html>
  );
}
