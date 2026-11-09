"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";

/** One-time page to create the first administrator. Works only while SETUP_SECRET is set and no admin exists. */
export default function SetupPage() {
  const [secret, setSecret] = useState("");
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <section className="page-shell max-w-xl">
      <div className="panel p-6 sm:p-8">
        <p className="eyebrow">First-time setup</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Create the first administrator</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">Enter the setup secret you added in Vercel and your own email. You will get a private link to create your admin account. After that, this page stops working.</p>
        <form className="mt-6 grid gap-4" onSubmit={async (event) => {
          event.preventDefault(); setPending(true); setMessage(""); setUrl("");
          try { setUrl((await api<{ acceptanceUrl: string }>("/api/setup", { body: { secret, email } })).acceptanceUrl); }
          catch (error) { setMessage(error instanceof Error ? error.message : "Setup failed."); }
          finally { setPending(false); }
        }}>
          <label className="text-sm font-bold">Setup secret<input required type="password" className="field" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="off" /></label>
          <label className="text-sm font-bold">Your email<input required type="email" className="field" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <button className="button-primary" disabled={pending}>{pending ? "Please wait..." : "Get my admin link"}</button>
        </form>
        {url && (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm font-bold">Open this link within 30 minutes to create your account:</p>
            <a className="mt-2 block break-all text-sm font-bold text-chemistry underline" href={url}>{url}</a>
          </div>
        )}
      </div>
    </section>
  );
}
