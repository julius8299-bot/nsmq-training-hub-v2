import { z } from "zod";
import { SUBJECTS, ROUND_TYPES, DIFFICULTIES, SOURCE_TYPES, PERMISSION_STATUSES } from "@/lib/constants";

const text = z.string().trim().min(1).max(30_000);
const arrayText = z.union([z.array(z.string().max(2000)).max(200), z.string().max(30_000)])
  .transform((value) => typeof value === "string" ? value : JSON.stringify(value))
  .refine((value) => {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) && parsed.every((item) => typeof item === "string"); }
    catch { return false; }
  }, "Expected a JSON array of strings.");
const boolean = z.union([z.boolean(), z.enum(["true", "false"])]).optional();
// Strip unknown properties so clients cannot set review, identity, or relation fields.
export const questionInput = z.object({
  subject: z.enum(SUBJECTS), topic: text, subtopic: text, roundType: z.enum(ROUND_TYPES),
  difficulty: z.enum(DIFFICULTIES), timeLimitSeconds: z.coerce.number().int().min(5).max(3600),
  questionText: text, answer: text, acceptedAnswers: arrayText.default("[]"),
  numericTolerance: z.union([z.coerce.number().min(0).max(1000), z.literal(""), z.null()]).optional(),
  shortcutSolution: text, fullSolution: text, commonTrap: text, encouragement: text,
  repeatedPattern: text, patternFamily: text, sourceType: z.enum(SOURCE_TYPES),
  permissionStatus: z.enum(PERMISSION_STATUSES), sourceName: z.string().max(1000).nullish(),
  sourceUrl: z.string().max(2000).nullish(), sourceYear: z.union([z.coerce.number().int().min(1900).max(2200), z.literal(""), z.null()]).optional(),
  contestStage: z.string().max(200).nullish(), videoTimestamp: z.string().max(100).nullish(),
  tags: arrayText.default("[]"), ghanaContext: boolean, isGhanaContext: boolean,
  isPastQuestion: boolean, isPrivateOnly: boolean,
  examinerFocus: z.string().max(10_000).nullish(), markingScheme: z.string().max(30_000).nullish(),
  preamble: z.string().max(10_000).nullish(),
  riddleClues: z.array(z.object({
    clueNumber: z.number().int().min(1).max(5).optional(), clueText: z.string().max(5000), points: z.number().optional(),
  })).max(5).optional(),
});
