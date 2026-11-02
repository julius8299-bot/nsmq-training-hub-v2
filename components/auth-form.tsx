"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function AuthForm({ invitation = false }: { invitation?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (invitation) {
      setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [invitation]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setMessage("");
    try {
      const response = await fetch(invitation ? "/api/auth/accept-invitation" : "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invitation ? { email, password, name, token } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to sign in.");
      if (invitation) { window.location.assign("/login?activated=true"); return; }
      const requested = new URLSearchParams(window.location.search).get("next") ?? "/dashboard";
      const safeNext = /^\/(?!\/)[a-z0-9/-]*$/i.test(requested) ? requested : "/dashboard";
      window.location.assign(safeNext);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  }
  return (
    <section className="page-shell max-w-xl">
      <div className="panel p-6 sm:p-8">
        <p className="eyebrow">Ghanata SHS Quiz Team</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">{invitation ? "Accept your invitation" : "Team sign in"}</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">{invitation ? "Create your account using the email address your coach invited." : "Use your personal email and team account password. Ask your coach for an invitation if you do not have an account."}</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          {invitation && <label className="text-sm font-bold">Name<input required className="field" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}
          <label className="text-sm font-bold">Email<input required type="email" className="field" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
          <label className="text-sm font-bold">Password<input required type="password" className="field" minLength={invitation ? 15 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={invitation ? "new-password" : "current-password"} /></label>
          {invitation && <p className="text-xs text-ink/60">Use a passphrase of at least 15 characters.</p>}
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <button className="button-primary" disabled={pending || (invitation && !token)}>{pending ? "Please wait..." : invitation ? "Activate account" : "Sign in"}</button>
        </form>
        {invitation && <Link href="/login" className="mt-5 inline-block text-sm font-bold text-chemistry">Already activated? Sign in</Link>}
      </div>
    </section>
  );
}
