import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { AccountControls } from "@/components/account-controls";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pageUser } from "@/lib/auth/http";
import { AccessError } from "@/lib/auth/service";
import "./globals.css";

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Fraunces({ subsets: ["latin"], variable: "--font-display" });

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
