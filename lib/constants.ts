export const SUBJECTS = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY"] as const;
export const ROUND_TYPES = [
  "ROUND_ONE",
  "SPEED_RACE",
  "PROBLEM_OF_THE_DAY",
  "TRUE_FALSE",
  "RIDDLE",
] as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "NSMQ_FINAL_LEVEL"] as const;
export const SOURCE_TYPES = [
  "ORIGINAL",
  "PAST_QUESTION",
  "PATTERN_VARIATION",
  "TEACHER_CREATED",
  "VIDEO_SOURCED",
  "PDF_SOURCED",
] as const;
export const PERMISSION_STATUSES = [
  "ORIGINAL",
  "PUBLIC",
  "PRIVATE_REVIEW",
  "NEEDS_PERMISSION",
  "LICENSED",
] as const;

export const SUBJECT_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  MATHEMATICS: { bg: "bg-blue-50", text: "text-maths", accent: "bg-maths" },
  PHYSICS: { bg: "bg-purple-50", text: "text-physics", accent: "bg-physics" },
  CHEMISTRY: { bg: "bg-emerald-50", text: "text-chemistry", accent: "bg-chemistry" },
  BIOLOGY: { bg: "bg-rose-50", text: "text-biology", accent: "bg-biology" },
};

export const ROUND_LABELS: Record<string, string> = {
  ROUND_ONE: "Round 1 · Fundamentals",
  SPEED_RACE: "Round 2 · Speed Race",
  PROBLEM_OF_THE_DAY: "Round 3 · Problem of the Day",
  TRUE_FALSE: "Round 4 · True or False",
  RIDDLE: "Round 5 · Riddles",
};

export const MODE_POINTS: Record<string, { correct: number; wrong: number }> = {
  ROUND_ONE: { correct: 3, wrong: 0 },
  SPEED_RACE: { correct: 3, wrong: -1 },
  TRUE_FALSE: { correct: 2, wrong: -1 },
  RIDDLE: { correct: 5, wrong: 0 },
  PROBLEM_OF_THE_DAY: { correct: 10, wrong: 0 },
};

export const SUBJECT_TOPICS: Record<string, string[]> = {
  MATHEMATICS: [
    "Algebra",
    "Geometry",
    "Trigonometry",
    "Calculus",
    "Statistics and Probability",
    "Vectors",
    "Sequences and Series",
    "Mensuration",
    "Logarithms",
    "Coordinate Geometry",
  ],
  PHYSICS: [
    "Mechanics",
    "Waves",
    "Electricity",
    "Magnetism",
    "Optics",
    "Heat and Thermodynamics",
    "Modern Physics",
    "Measurement and Units",
    "Pressure and Fluids",
    "Electronics",
  ],
  CHEMISTRY: [
    "Atomic Structure",
    "Periodic Chemistry",
    "Chemical Bonding",
    "Stoichiometry",
    "Acids, Bases, and Salts",
    "Electrochemistry",
    "Organic Chemistry",
    "Chemical Equilibrium",
    "Thermochemistry",
    "Rates of Reaction",
  ],
  BIOLOGY: [
    "Cell Biology",
    "Genetics",
    "Ecology",
    "Evolution",
    "Human Physiology",
    "Plant Biology",
    "Reproduction",
    "Nutrition",
    "Respiration",
    "Excretion",
  ],
};
