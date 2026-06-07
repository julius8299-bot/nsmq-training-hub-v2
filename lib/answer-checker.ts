type AnswerQuestion = {
  answer: string;
  acceptedAnswers?: string | string[] | null;
  numericTolerance?: number | null;
};

const BOOLEAN_ALIASES: Record<string, string> = {
  t: "true",
  true: "true",
  f: "false",
  false: "false",
};

function parseAcceptedAnswers(value: AnswerQuestion["acceptedAnswers"]) {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Admin imports may use comma- or pipe-separated alternatives.
  }
  return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeText(value: string) {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/⁻/g, "-")
    .replace(/[Ωω]/g, " ohm ")
    .replace(/\bohms\b/g, "ohm")
    .replace(/\bmetres\b/g, "metre")
    .replace(/\bmeters\b/g, "meter")
    .replace(/\bseconds\b/g, "second")
    .replace(/\bmoles\b/g, "mole")
    .replace(/[()[\]{}"'`´,;:!?]/g, " ")
    .replace(/\s*([=+\-/*])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim();

  return BOOLEAN_ALIASES[normalized] ?? normalized;
}

function parseNumeric(value: string) {
  const normalized = normalizeText(value).replace(/,/g, "");
  const fraction = normalized.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)(?:\s+.*)?$/);
  if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);

  const numericTokens = normalized.match(/-?\d+(?:\.\d+)?/g) ?? [];
  if (numericTokens.length !== 1) return null;
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)(?:\s*.*)?$/);
  return match ? Number(match[1]) : null;
}

export function checkAnswer(userAnswer: string, question: AnswerQuestion) {
  const expected = [question.answer, ...parseAcceptedAnswers(question.acceptedAnswers)];
  const normalizedUser = normalizeText(String(userAnswer ?? ""));
  if (!normalizedUser) return false;

  if (expected.some((item) => normalizeText(String(item)) === normalizedUser)) return true;

  const userNumber = parseNumeric(userAnswer);
  if (userNumber === null) return false;

  return expected.some((item) => {
    const expectedNumber = parseNumeric(String(item));
    if (expectedNumber === null) return false;
    const allowed =
      question.numericTolerance ?? Math.max(Math.abs(expectedNumber) * 0.005, 0.01);
    return Math.abs(userNumber - expectedNumber) <= allowed;
  });
}
