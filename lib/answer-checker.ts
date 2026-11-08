type AnswerQuestion = {
  answer: string;
  acceptedAnswers?: string | string[] | null;
  numericTolerance?: number | null;
};

const BOOLEAN_ALIASES: Record<string, string> = {
  t: "true", true: "true", yes: "true",
  f: "false", false: "false", no: "false",
};

const SUPERSCRIPTS: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+",
};

export function parseAcceptedAnswers(value: AnswerQuestion["acceptedAnswers"]) {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Older imports stored pipe-separated alternatives. Commas are NOT separators: "1,000" is one answer.
  }
  return value.split("|").map((item) => item.trim()).filter(Boolean);
}

function normalizeText(value: string) {
  let text = value.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (run) => "^" + [...run].map((char) => SUPERSCRIPTS[char]).join(""));
  text = text
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[×✕]/g, "x")
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1") // thousands separators: 1,000 -> 1000
    .replace(/[’'`´]/g, "") // ohm's -> ohms
    .replace(/[Ωω]/g, " ohm ")
    .replace(/\bohms\b/g, "ohm")
    .replace(/\b(kilo|centi|milli|micro|nano)?meters?\b/g, (_m, prefix = "") => prefix + "metre")
    .replace(/\b(kilo|centi|milli|micro|nano)?metres\b/g, (_m, prefix = "") => prefix + "metre")
    .replace(/\b(milli)?liters?\b|\b(milli)?litres\b/g, (_m, a = "", b = "") => (a || b) + "litre")
    .replace(/\bseconds\b/g, "second")
    .replace(/\bmoles\b/g, "mole")
    .replace(/[()[\]{}"!?;:]/g, " ")
    .replace(/,/g, " ")
    .replace(/(?<=[a-z])-(?=[a-z])/g, " ") // ice-cream -> ice cream
    .replace(/\s*([=+/*^])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim()
    .replace(/^(the|a|an) /, "");
  return BOOLEAN_ALIASES[text] ?? text;
}

/** Compare ignoring spaces and letter-number hyphens: "carbon14" = "carbon 14" = "carbon-14". */
const compact = (value: string) => value.replace(/\s+/g, "").replace(/(?<=[a-z])-(?=\d)/g, "");

/** "x = 3" -> "3"; single-letter variable assignments only, so "pH = 7" style answers keep their label. */
function stripAssignment(value: string) {
  const match = value.match(/^[a-z]=(.+)$/);
  return match ? match[1] : value;
}

type ParsedNumber = { value: number; unit: string };

const NUMBER = String.raw`-?(?:\d+(?:\.\d+)?|\.\d+)`;

/**
 * A single quantity with an optional unit: "24", "24 m/s", "2.4 x 10^3 j", "2.4e3", "3/4", "12 cm^2".
 * Returns null for anything with more than one stand-alone number ("53 strips; 438 strips"),
 * so multi-part answers must be written out in full.
 */
function parseQuantity(raw: string): ParsedNumber | null {
  const text = stripAssignment(normalizeText(raw));
  const fraction = text.match(new RegExp(`^(${NUMBER})/(${NUMBER})(?:\\s*(.*))?$`));
  if (fraction && Number(fraction[2]) !== 0 && !/[a-z]/.test(fraction[1] + fraction[2])) {
    return finish(Number(fraction[1]) / Number(fraction[2]), fraction[3] ?? "");
  }
  const scientific = text.match(new RegExp(`^(${NUMBER})(?:\\s*[x*]\\s*10\\^(${NUMBER})|e(${NUMBER}))(?:\\s*(.*))?$`));
  if (scientific) {
    const exponent = Number(scientific[2] ?? scientific[3]);
    return finish(Number(scientific[1]) * 10 ** exponent, scientific[4] ?? "");
  }
  const plain = text.match(new RegExp(`^(${NUMBER})(?:\\s*(.*))?$`));
  if (!plain) return null;
  return finish(Number(plain[1]), plain[2] ?? "");
}

function finish(value: number, unitText: string): ParsedNumber | null {
  const unit = unitText.trim();
  if (!Number.isFinite(value)) return null;
  if (unit && !isPlausibleUnit(unit)) return null;
  return { value, unit: canonicalUnit(unit) };
}

/**
 * A unit starts with a letter (or %/°) and its only digits are exponents (cm^2, s^-1, s-1).
 * Anything else ("/x", "x^8 - 9", "strips; 438 strips") is an expression or a multi-part answer,
 * which must then match as text instead of as a number.
 */
function isPlausibleUnit(unit: string) {
  if (!/^[a-z%°µ]/.test(unit)) return false;
  const withoutExponents = unit.replace(/\^-?\d+/g, "").replace(/(?<=[a-z])-?\d+(?![a-z\d])/g, "");
  return !/[\d+=<>]|(?<![a-z])-|-(?![a-z])/.test(withoutExponents) && !/\b(x|y|z)\b/.test(withoutExponents);
}

/** m/s, ms^-1, m s^-1, m s-1 all become "ms^-1". */
function canonicalUnit(unit: string) {
  return unit
    .replace(/\s+/g, "")
    .replace(/([a-z])-(\d)/g, "$1^-$2")
    .replace(/\/([a-z]+)\^(\d)/g, "$1^-$2")
    .replace(/\/([a-z]+)/g, "$1^-1")
    .replace(/\^1(?!\d)/g, "");
}

// Units we recognise as symbols. When both answers state a recognised unit and they differ,
// the answer is wrong ("24 kg" for "24 m/s"); unrecognised wording ("metres per second") is not penalised.
const UNIT_SYMBOLS = new Set([
  "m", "cm", "mm", "km", "nm", "s", "ms", "min", "h", "kg", "g", "mg", "n", "j", "kj", "w", "kw", "pa", "kpa", "v", "a", "ma",
  "ohm", "c", "k", "mol", "hz", "khz", "l", "ml", "dm", "t", "f", "ev", "atm", "rad",
]);
function isSymbolicUnit(unit: string) {
  if (!unit) return false;
  const parts = unit.split(/\^-?\d+/).join(" ").replace(/[*.·]/g, " ").trim();
  if (!parts) return false;
  // Greedy split into known symbols, e.g. "ms" -> m s, "kgm" -> kg m.
  const fits = (rest: string): boolean => !rest || [...UNIT_SYMBOLS].some((symbol) => rest.startsWith(symbol) && fits(rest.slice(symbol.length)));
  return parts.split(" ").every((piece) => fits(piece));
}

export function checkAnswer(userAnswer: string, question: AnswerQuestion) {
  const expected = [question.answer, ...parseAcceptedAnswers(question.acceptedAnswers)];
  const user = normalizeText(String(userAnswer ?? ""));
  if (!user) return false;

  for (const item of expected) {
    const target = normalizeText(String(item));
    if (!target) continue;
    if (target === user || compact(target) === compact(user)) return true;
    if (compact(stripAssignment(target)) === compact(stripAssignment(user))) return true;
  }

  const given = parseQuantity(userAnswer);
  if (!given) return false;
  const matches = expected
    .map((item) => parseQuantity(String(item)))
    .filter((wanted): wanted is ParsedNumber => {
      if (!wanted) return false;
      const allowed = question.numericTolerance ?? Math.max(Math.abs(wanted.value) * 0.005, 1e-9);
      return Math.abs(given.value - wanted.value) <= allowed;
    });
  if (!matches.length) return false;
  if (!given.unit || !isSymbolicUnit(given.unit)) return true;
  // The student wrote a recognised unit: it must agree with every recognised unit the answer key states.
  return !matches.some((wanted) => wanted.unit && isSymbolicUnit(wanted.unit) && wanted.unit !== given.unit);
}
