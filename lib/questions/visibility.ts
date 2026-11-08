/** Review states that students can see. AUTO_VERIFIED = generated from a checked data table (e.g. element drills). */
export const PUBLISHED_STATUSES = ["APPROVED", "LEGACY_UNREVIEWED", "AUTO_VERIFIED"] as const;

export const studentVisible = {
  archivedAt: null,
  isPrivateOnly: false,
  reviewStatus: { in: [...PUBLISHED_STATUSES] },
};

export function isStudentVisible(question: { archivedAt: Date | null; isPrivateOnly: boolean; reviewStatus: string }) {
  return !question.archivedAt && !question.isPrivateOnly && (PUBLISHED_STATUSES as readonly string[]).includes(question.reviewStatus);
}
