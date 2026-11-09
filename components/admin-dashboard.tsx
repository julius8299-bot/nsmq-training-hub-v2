"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { ReviewQueue } from "@/components/admin/review-queue";
import { QuestionManager } from "@/components/admin/question-manager";
import { AdminQuestionForm } from "@/components/admin-question-form";
import { QuestionImportUploader } from "@/components/question-import-uploader";
import { StudentProgress } from "@/components/admin/student-progress";
import { MemberManager } from "@/components/admin/member-manager";
import { ContestHistory } from "@/components/admin/contest-history";
import type { Question } from "@/lib/types";

export type StaffUser = { id: string; name: string; role: string; permissions: string[] };

const TABS = [
  { id: "review", label: "Review queue", permission: "questions:review" },
  { id: "questions", label: "Questions", permission: "questions:write" },
  { id: "add", label: "Add & import", permission: "questions:write" },
  { id: "students", label: "Students", permission: "students:view" },
  { id: "members", label: "Members", permission: "members:manage" },
  { id: "contests", label: "Contests", permission: "contest:host" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboard({ user }: { user: StaffUser }) {
  const tabs = TABS.filter((tab) => user.permissions.includes(tab.permission));
  const [tab, setTab] = useState<TabId>(tabs[0]?.id ?? "students");
  const [editing, setEditing] = useState<Question | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested && tabs.some((item) => item.id === requested)) setTab(requested as TabId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const choose = (id: TabId) => { setTab(id); window.history.replaceState(null, "", "/admin?tab=" + id); };

  return (
    <div className="page-shell">
      <PageHeading eyebrow={`Coach tools · ${user.name} (${user.role.toLowerCase()})`} title="Coach tools" description="Review and publish questions, follow every student's progress, and manage the team. New and edited questions stay out of training until a reviewer approves them." />
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {tabs.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => choose(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${tab === item.id ? "bg-ink text-white" : "bg-white text-ink/70 ring-1 ring-ink/10"}`}>
            {item.label}
          </button>
        ))}
      </div>
      {tab === "review" && <ReviewQueue user={user} key={refresh} />}
      {tab === "questions" && <QuestionManager user={user} onEdit={(question) => { setEditing(question); choose("add"); }} key={refresh} />}
      {tab === "add" && (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <AdminQuestionForm key={editing?.id ?? "new"} question={editing} onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); setRefresh((value) => value + 1); }} />
          <QuestionImportUploader onImported={() => setRefresh((value) => value + 1)} />
        </div>
      )}
      {tab === "students" && <StudentProgress />}
      {tab === "members" && <MemberManager user={user} />}
      {tab === "contests" && <ContestHistory />}
    </div>
  );
}
