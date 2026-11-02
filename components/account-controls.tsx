"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export function AccountControls() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => {
      if (response.ok) setUser((await response.json()).user);
    }).catch(() => {});
  }, []);
  return (
    <div className="border-b border-ink/10 bg-white/70 px-4 py-2 text-right text-xs font-semibold">
      {user ? <span>{user.name} <button className="ml-3 underline" onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        window.location.assign("/login");
      }}>Sign out</button></span> : <Link href="/login">Team sign in</Link>}
    </div>
  );
}
