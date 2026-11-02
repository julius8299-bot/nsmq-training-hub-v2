"use client";
import { useState } from "react";

export function InvitationForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  return (
    <section className="panel mt-8 p-5">
      <h2 className="font-display text-2xl font-semibold">Invite a team member</h2>
      <p className="mt-2 text-sm text-ink/60">Administrators can invite all roles. Coaches can invite students. Deliver the one-use link privately to the invited email owner.</p>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={async (event) => {
        event.preventDefault(); setMessage(""); setUrl("");
        try {
          const response = await fetch("/api/admin/invitations", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          setUrl(result.acceptanceUrl);
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create invitation."); }
      }}>
        <label className="text-sm font-bold">Personal email<input required type="email" className="field" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="text-sm font-bold">Role<select className="field" value={role} onChange={(event) => setRole(event.target.value)}>
          {["STUDENT", "COACH", "QUIZMASTER", "ADMIN"].map((value) => <option key={value}>{value}</option>)}
        </select></label>
        <button className="button-primary">Create invitation</button>
      </form>
      {message && <p role="alert" className="mt-3 text-sm text-red-700">{message}</p>}
      {url && <div className="mt-4"><p className="text-sm font-bold">Copy this private link now; it will not be shown again.</p><input readOnly className="field mt-2" value={url} aria-label="Private invitation link" /></div>}
    </section>
  );
}
