export type RiddleClue = {
  id?: string;
  clueNumber: number;
  clueText: string;
  points: number;
};

/** Full question record (staff tools and the study-mode Question Bank). */
export type Question = {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  roundType: string;
  difficulty: string;
  timeLimitSeconds: number;
  questionText: string;
  answer: string;
  acceptedAnswers: string;
  numericTolerance?: number | null;
  shortcutSolution: string;
  fullSolution: string;
  commonTrap: string;
  encouragement: string;
  repeatedPattern: string;
  patternFamily: string;
  sourceType: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceYear?: number | null;
  contestStage?: string | null;
  videoTimestamp?: string | null;
  permissionStatus: string;
  ghanaContext: boolean;
  isGhanaContext: boolean;
  isPastQuestion: boolean;
  isPrivateOnly: boolean;
  tags: string;
  examinerFocus?: string | null;
  markingScheme?: string | null;
  preamble?: string | null;
  riddleClues?: RiddleClue[];
  reviewStatus?: string;
  revision?: number;
  archivedAt?: string | null;
};

/** What a student sees before answering. */
export type PublicQuestion = {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  roundType: string;
  difficulty: string;
  timeLimitSeconds: number;
  questionText: string;
  preamble?: string | null;
  isGhanaContext: boolean;
  clueCount: number;
};

export type QuestionFeedback = {
  answer: string;
  acceptedAnswers: string[];
  shortcutSolution: string;
  fullSolution: string;
  commonTrap: string;
  encouragement: string;
  markingScheme?: string | null;
  examinerFocus?: string | null;
  riddleClues: RiddleClue[];
};

export type Draw = {
  drawId: string;
  issuedAt: string;
  timeLimitSeconds: number | null;
  question: PublicQuestion;
  clues: RiddleClue[];
};

export type AttemptResult = {
  isCorrect: boolean;
  pointsAwarded: number;
  late: boolean;
  revealOnly: boolean;
  timeTakenSeconds: number;
  cluesUsed: number;
  feedback: QuestionFeedback;
};
