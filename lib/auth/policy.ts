export const ROLES = ["STUDENT", "COACH", "QUIZMASTER", "ADMIN"] as const;
export type RoleCode = (typeof ROLES)[number];
export type Permission =
  | "train"
  | "questions:write"
  | "questions:review"
  | "members:invite"
  | "members:manage"
  | "students:view"
  | "contest:host";

const grants: Record<RoleCode, readonly Permission[]> = {
  STUDENT: ["train"],
  COACH: ["train", "questions:write", "questions:review", "members:invite", "members:manage", "students:view", "contest:host"],
  QUIZMASTER: ["train", "contest:host", "students:view"],
  ADMIN: ["train", "questions:write", "questions:review", "members:invite", "members:manage", "students:view", "contest:host"],
};

export function isRole(value: unknown): value is RoleCode {
  return ROLES.includes(value as RoleCode);
}

export function can(role: string, permission: Permission) {
  return isRole(role) && grants[role].includes(permission);
}

export function canInvite(actorRole: string, invitedRole: RoleCode) {
  return actorRole === "ADMIN" || (actorRole === "COACH" && invitedRole === "STUDENT");
}

/** Who may reset passwords, disable or re-enable an account: admins for anyone, coaches for students. */
export function canManageUser(actorRole: string, targetRole: string) {
  return actorRole === "ADMIN" || (actorRole === "COACH" && targetRole === "STUDENT");
}

/** Coaches may approve questions, but never their own; an admin may (a one-person team still needs to publish). */
export function canApprove(actorRole: string, actorId: string, authorId: string | null) {
  if (actorRole === "ADMIN") return true;
  return actorRole === "COACH" && authorId !== actorId;
}

export function permissionsFor(role: string): Permission[] {
  return isRole(role) ? [...grants[role]] : [];
}
