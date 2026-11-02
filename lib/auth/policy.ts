export const ROLES = ["STUDENT", "COACH", "QUIZMASTER", "ADMIN"] as const;
export type RoleCode = (typeof ROLES)[number];
export type Permission = "train" | "questions:write" | "questions:review" | "members:invite" | "contest:host";

const grants: Record<RoleCode, readonly Permission[]> = {
  STUDENT: ["train"],
  COACH: ["train", "questions:write", "questions:review", "members:invite"],
  QUIZMASTER: ["train", "contest:host"],
  ADMIN: ["train", "questions:write", "questions:review", "members:invite", "contest:host"],
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
