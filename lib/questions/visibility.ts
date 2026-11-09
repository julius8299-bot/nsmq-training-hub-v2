/**
 * Review states that students can see. AUTO_VERIFIED = generated from a checked data table (e.g. element drills).
 * AI_CHECKED = bank question whose answer was re-solved and shortcut written by AI; live, but still open for coach review.
 */
export const PUBLISHED_STATUSES = ["APPROVED", "LEGACY_UNREVIEWED", "AUTO_VERIFIED", "AI_CHECKED"] as const;

export const studentVisible = {
  archivedAt: null,
  isPrivateOnly: false,
  reviewStatus: { in: [...PUBLISHED_STATUSES] },
};

export function isStudentVisible(question: { archivedAt: Date | null; isPrivateOnly: boolean; reviewStatus: string }) {
  return !question.archivedAt && !question.isPrivateOnly && (PUBLISHED_STATUSES as readonly string[]).includes(question.reviewStatus);
}
