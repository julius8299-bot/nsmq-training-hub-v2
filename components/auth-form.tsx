"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client/api";

export function AuthForm({ invitation = false }: { invitation?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [reset, setReset] = useState(false);
  const [notice, setNotice] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (invitation) {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      setToken(hash.get("token") ?? "");
      setReset(hash.get("reset") === "1");
      // Keep the one-use token out of history and screenshots of the address bar.
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get("activated")) setNotice("Your account is ready. Sign in with your new password.");
      if (params.get("reset")) setNotice("Your password has been changed. Sign in with the new one.");
    }
  }, [invitation]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setMessage("");
    try {
      if (invitation) {
        await api("/api/auth/accept-invitation", { body: { email, password, token, ...(!reset && { name }) }, retryBusy: true });
        window.location.assign(reset ? "/login?reset=true" : "/login?activated=true");
        return;
      }
      await api("/api/auth/login", { body: { email, password }, retryBusy: true });
      const requested = new URLSearchParams(window.location.search).get("next") ?? "/dashboard";
      const safeNext = /^\/(?!\/)[a-z0-9/-]*$/i.test(requested) ? requested : "/dashboard";
      window.location.assign(safeNext);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  }
  const title = invitation ? (reset ? "Choose a new password" : "Accept your invitation") : "Team sign in";
  const intro = invitation
    ? reset ? "Enter your email and a new password. You will be signed out on other devices." : "Create your account using the email address your coach invited."
    : "Use your email and team password. Forgot it? Ask your coach for a password reset link.";
  return (
    <section className="page-shell max-w-xl">
      <div className="panel p-6 sm:p-8">
        <p className="eyebrow">Ghanata SHS Quiz Team</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">{intro}</p>
        {notice && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{notice}</p>}
        {invitation && !token && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">This page needs the full link your coach sent. Open the link again, exactly as it was sent.</p>}
        <form onSubmit={submit} className="mt-6 grid gap-4">
          {invitation && !reset && <label className="text-sm font-bold">Name<input required className="field" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}
          <label className="text-sm font-bold">Email<input required type="email" className="field" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
          <label className="text-sm font-bold">{invitation ? "New password" : "Password"}<input required type="password" className="field" minLength={invitation ? 10 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={invitation ? "new-password" : "current-password"} /></label>
          {invitation && <p className="text-xs text-ink/60">At least 10 characters. A short phrase you will remember works well, e.g. &ldquo;kente blue 2026&rdquo;.</p>}
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <button className="button-primary" disabled={pending || (invitation && !token)}>{pending ? "Please wait..." : invitation ? (reset ? "Save new password" : "Activate account") : "Sign in"}</button>
        </form>
        {invitation && <Link href="/login" className="mt-5 inline-block text-sm font-bold text-chemistry">Already have a password? Sign in</Link>}
      </div>
    </section>
  );
}
