import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site-header";
import { AccountControls } from "@/components/account-controls";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pageUser } from "@/lib/auth/http";
import { AccessError } from "@/lib/auth/service";
import "./globals.css";

// Same typefaces as before (DM Sans, Fraunces), self-hosted from npm (OFL-1.1) so builds never depend on Google Fonts.
const bodyFont = localFont({
  src: [
    { path: "../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2", weight: "100 1000", style: "normal" },
    { path: "../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-ext-wght-normal.woff2", weight: "100 1000", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});
const displayFont = localFont({
  src: [
    { path: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-ext-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NSMQ Training Hub",
  description: "Speed, accuracy, shortcuts, and confidence for Ghanaian SHS science students.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-nsmq-pathname") ?? "/";
  if (!["/", "/gallery", "/login", "/accept-invite", "/setup", "/icon"].includes(pathname)) {
    try {
      await pageUser("train");
    } catch (error) {
      if (error instanceof AccessError && error.status === 401) redirect("/login?next=" + encodeURIComponent(pathname));
      if (error instanceof AccessError && error.status === 403) redirect("/dashboard");
      throw error;
    }
  }
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-screen font-sans`}>
        <SiteHeader />
        <AccountControls />
        <main>{children}</main>
        <footer className="border-t border-ink/10 py-8 text-center text-sm text-ink/55">
          Built for disciplined practice. Independent educational project; no official NSMQ branding.
        </footer>
      </body>
    </html>
  );
}
