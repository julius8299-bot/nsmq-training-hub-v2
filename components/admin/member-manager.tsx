"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, UserPlus } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import type { StaffUser } from "@/components/admin-dashboard";

type Member = { id: string; name: string; email: string; role: string; status: string; lastLoginAt: string | null; hasPassword: boolean };
type Invitation = { id: string; email: string; roleCode: string; purpose: string; expiresAt: string; createdBy: { name: string } | null };
const ROLES = ["STUDENT", "COACH", "QUIZMASTER", "ADMIN"];

function LinkBox({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const share = "https://wa.me/?text=" + encodeURIComponent(label + ": " + url);
  return (
    <div className="mt-3 rounded-2xl bg-emerald-50 p-4">
      <p className="text-sm font-bold">{label}. Copy it now; it will not be shown again.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input readOnly className="field flex-1" value={url} aria-label={label} onFocus={(event) => event.target.select()} />
        <button type="button" className="button-secondary" onClick={() => { void navigator.clipboard?.writeText(url); setCopied(true); }}><Copy size={16} /> {copied ? "Copied" : "Copy"}</button>
        <a className="button-secondary" href={share} target="_blank" rel="noreferrer">Send on WhatsApp</a>
      </div>
      <p className="mt-2 text-xs text-ink/55">Send it only to that person. Anyone with the link and their email address can set the password.</p>
    </div>
  );
}

export function MemberManager({ user }: { user: StaffUser }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [link, setLink] = useState<{ url: string; label: string } | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const admin = user.role === "ADMIN";

  const load = useCallback(() => {
    api<{ members: Member[] }>("/api/admin/members").then((data) => setMembers(data.members)).catch((caught) => setMessage((caught as ApiError).message));
    api<{ invitations: Invitation[] }>("/api/admin/invitations").then((data) => setInvitations(data.invitations)).catch(() => setInvitations([]));
  }, []);
  useEffect(load, [load]);

  const act = async (run: () => Promise<void>) => {
    setMessage("");
    try { await run(); load(); } catch (caught) { setMessage((caught as ApiError).message); }
  };
  const invite = (event: React.FormEvent) => {
    event.preventDefault();
    void act(async () => {
      const result = await api<{ acceptanceUrl: string }>("/api/admin/invitations", { body: { email, role } });
      setLink({ url: result.acceptanceUrl, label: `Invitation for ${email} (valid 3 days)` });
      setEmail("");
    });
  };
  const reset = (member: Member) => act(async () => {
    const result = await api<{ url: string; purpose: string }>(`/api/admin/members/${member.id}/reset`, { body: {} });
    setLink({ url: result.url, label: result.purpose === "RESET" ? `Password reset link for ${member.name} (valid 24 hours)` : `Activation link for ${member.name} (valid 24 hours)` });
  });
  const update = (member: Member, body: Record<string, string>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    void act(() => api(`/api/admin/members/${member.id}`, { method: "PATCH", body }));
  };

  const shown = (members ?? []).filter((member) => !filter || (member.name + " " + member.email).toLowerCase().includes(filter.toLowerCase()));
  return (
    <section className="grid gap-6">
      <div className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><UserPlus size={20} /> Invite someone</h2>
        <p className="mt-1 text-sm text-ink/60">{admin ? "You can invite any role." : "Coaches can invite students."} The link lets them choose their own password.</p>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={invite}>
          <label className="text-sm font-bold">Email<input required type="email" className="field" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="text-sm font-bold">Role<select className="field" value={role} onChange={(event) => setRole(event.target.value)}>
            {(admin ? ROLES : ["STUDENT"]).map((value) => <option key={value}>{value}</option>)}
          </select></label>
          <button className="button-primary">Create invitation link</button>
        </form>
        {link && <LinkBox url={link.url} label={link.label} />}
        {message && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{message}</p>}
      </div>

      {invitations.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-display text-xl font-semibold">Open links</h3>
          <ul className="mt-3 grid gap-2 text-sm">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink/[0.03] px-3 py-2">
                <span>{invitation.email} · {invitation.purpose === "RESET" ? "password reset" : invitation.roleCode.toLowerCase()} · expires {new Date(invitation.expiresAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}{invitation.createdBy ? ` · by ${invitation.createdBy.name}` : ""}</span>
                <button type="button" className="text-sm font-bold text-red-700 underline" onClick={() => void act(() => api(`/api/admin/invitations?id=${invitation.id}`, { method: "DELETE" }))}>Cancel link</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel overflow-x-auto p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold">{admin ? "All members" : "Students"}</h3>
          <input className="field max-w-xs" placeholder="Search name or email" value={filter} onChange={(event) => setFilter(event.target.value)} />
        </div>
        <table className="mt-4 w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase text-ink/45"><tr><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last sign-in</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.map((member) => {
              const self = member.id === user.id;
              const manageable = !self && (admin || member.role === "STUDENT");
              return (
                <tr key={member.id} className="border-t border-ink/10">
                  <td className="py-2 pr-3 font-bold">{member.name}{self && " (you)"}</td>
                  <td className="pr-3">{member.email}</td>
                  <td className="pr-3">{admin && manageable ? (
                    <select className="field w-auto py-1" value={member.role} onChange={(event) => update(member, { role: event.target.value }, `Change ${member.name}'s role to ${event.target.value}?`)}>
                      {ROLES.map((value) => <option key={value}>{value}</option>)}
                    </select>
                  ) : member.role.toLowerCase()}</td>
                  <td className="pr-3">{member.status === "LEGACY" ? "not activated" : member.status.toLowerCase()}</td>
                  <td className="pr-3 text-ink/55">{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString("en-GB") : "—"}</td>
                  <td className="flex flex-wrap gap-2 py-2">
                    {manageable && member.status !== "DISABLED" && (
                      <button type="button" className="inline-flex items-center gap-1 text-sm font-bold text-chemistry underline" onClick={() => void reset(member)}><KeyRound size={14} /> {member.hasPassword ? "Reset password" : "Activation link"}</button>
                    )}
                    {manageable && member.status === "ACTIVE" && (
                      <button type="button" className="text-sm font-bold text-red-700 underline" onClick={() => update(member, { status: "DISABLED" }, `Disable ${member.name}? They will be signed out and cannot sign in until re-enabled. Their records are kept.`)}>Disable</button>
                    )}
                    {manageable && member.status === "DISABLED" && member.hasPassword && (
                      <button type="button" className="text-sm font-bold underline" onClick={() => update(member, { status: "ACTIVE" })}>Re-enable</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {members && !shown.length && <p className="mt-3 text-sm text-ink/55">No members match.</p>}
      </div>
    </section>
  );
}
