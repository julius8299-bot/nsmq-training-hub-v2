export type RiddleClue = {
  id?: string;
  clueNumber: number;
  clueText: string;
  points: number;
};

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
  tags: string;
  examinerFocus?: string | null;
  markingScheme?: string | null;
  riddleClues?: RiddleClue[];
};

export type AttemptResult = {
  isCorrect: boolean;
  correctAnswer: string;
  pointsAwarded: number;
};
