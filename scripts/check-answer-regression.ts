import assert from "node:assert/strict";
import { checkAnswer, parseAcceptedAnswers } from "../lib/answer-checker";
import { mathematicsQuestions } from "../prisma/seed-data/mathematics";
import { physicsQuestions } from "../prisma/seed-data/physics";
import { chemistryQuestions } from "../prisma/seed-data/chemistry";
import { biologyQuestions } from "../prisma/seed-data/biology";
import { supplementalPatternQuestions } from "../prisma/seed-data/supplemental-patterns";
import { advancedFinalQuestions } from "../prisma/seed-data/advanced-final-questions";

type Case = readonly [string, { answer: string; acceptedAnswers?: string; numericTolerance?: number; roundType?: string }];
const accept: Case[] = [
  ["electron", { answer: "electron", acceptedAnswers: '["an electron","e-","e⁻"]' }],
  ["Electron", { answer: "electron", acceptedAnswers: "[]" }],
  [" electron ", { answer: "electron", acceptedAnswers: "[]" }],
  ["e-", { answer: "electron", acceptedAnswers: '["e-","e⁻"]' }],
  ["e⁻", { answer: "electron", acceptedAnswers: '["e-","e⁻"]' }],
  ["magnetic flux density", { answer: "Magnetic flux density", acceptedAnswers: "[]" }],
  ["4 ohms", { answer: "4 Ω", acceptedAnswers: '["4 ohms","4 Ω"]' }],
  ["True", { answer: "T", acceptedAnswers: "[]", roundType: "TRUE_FALSE" }],
  ["False", { answer: "F", acceptedAnswers: "[]", roundType: "TRUE_FALSE" }],
  ["f", { answer: "False" }],
  ["0.5", { answer: "1/2", acceptedAnswers: "[]" }],
  ["1,000", { answer: "1000" }],
  ["1000", { answer: "1,000" }],
  ["3", { answer: "x = 3" }],
  ["x=3", { answer: "3" }],
  ["Ohms law", { answer: "Ohm's law" }],
  ["the mitochondria", { answer: "Mitochondria" }],
  ["2.4 x 10^3", { answer: "2400" }],
  ["2.4×10³", { answer: "2400" }],
  ["2.4e3", { answer: "2400" }],
  ["meter", { answer: "metre" }],
  ["Carbon 14", { answer: "Carbon-14" }],
  ["carbon14", { answer: "Carbon-14" }],
  ["12", { answer: "12 cm²" }],
  ["12 cm^2", { answer: "12 cm²" }],
  ["24", { answer: "24 m/s" }],
  ["24 m s^-1", { answer: "24 m/s" }],
  ["24 ms-1", { answer: "24 m/s" }],
  ["24 metres per second", { answer: "24 m/s" }],
  ["-1/2", { answer: "−0.5" }],
  ["yes", { answer: "True" }],
  ["F", { answer: "F" }],
  ["H2O", { answer: "H₂O" }],
];
const reject: Case[] = [
  ["24 kg", { answer: "24 m/s" }],
  ["24 J", { answer: "24 N" }],
  ["12 V", { answer: "12 m/s", acceptedAnswers: '["12","12m/s"]' }],
  ["1", { answer: "1000", acceptedAnswers: '["1,000"]' }],
  ["53", { answer: "53 strips; 438 strips" }],
  ["4/x", { answer: "4" }],
  ["9", { answer: "dy/dx = 9x^8 - 9" }],
  ["ethene", { answer: "ethane" }], // deliberately no fuzzy spelling: one letter changes the compound
  ["photosyntesis", { answer: "photosynthesis" }],
  ["25", { answer: "24 m/s" }],
  ["False", { answer: "True" }],
  ["no", { answer: "F" }], // fluorine's symbol is not "false"
  ["false", { answer: "F" }],
  ["", { answer: "0" }],
];

for (const [userAnswer, question] of accept) assert.ok(checkAnswer(userAnswer, question), `Expected "${userAnswer}" to match "${question.answer}".`);
for (const [userAnswer, question] of reject) assert.ok(!checkAnswer(userAnswer, question), `Expected "${userAnswer}" NOT to match "${question.answer}".`);

// Commas are never separators: "1,000" is a single accepted answer.
assert.deepEqual(parseAcceptedAnswers("1,000|one thousand"), ["1,000", "one thousand"]);
assert.deepEqual(parseAcceptedAnswers('["1,000","Na, K"]'), ["1,000", "Na, K"]);

// Whole catalog: every answer matches itself, and no question's answer is accepted for a different question,
// apart from the same sentence with and without a leading article.
const catalog = [
  ...mathematicsQuestions, ...physicsQuestions, ...chemistryQuestions, ...biologyQuestions,
  ...supplementalPatternQuestions, ...advancedFinalQuestions,
];
const unique = [...new Map(catalog.map((q) => [q.questionText + "|" + q.answer, q])).values()];
const answers = [...new Set(unique.map((q) => q.answer))];
const stripArticle = (value: string) => value.trim().toLowerCase().replace(/^(the|a|an) /, "");
let crossMatches = 0;
for (const question of unique) {
  const key = { answer: question.answer, acceptedAnswers: JSON.stringify(question.acceptedAnswers), numericTolerance: question.numericTolerance, roundType: question.roundType };
  assert.ok(checkAnswer(question.answer, key), "Answer does not match itself: " + question.answer);
  for (const other of answers) {
    if (other === question.answer || question.acceptedAnswers.includes(other)) continue;
    if (stripArticle(other) === stripArticle(question.answer)) continue;
    if (checkAnswer(other, key)) { crossMatches += 1; console.error(`"${other}" accepted for "${question.answer}"`); }
  }
}
assert.equal(crossMatches, 0, "Answers from other questions must not be accepted.");

console.log(`Answer checker passed ${accept.length + reject.length} cases and a ${unique.length}x${answers.length} catalog cross-check.`);
