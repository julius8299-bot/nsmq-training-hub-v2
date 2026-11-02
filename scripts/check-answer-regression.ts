import { checkAnswer } from "../lib/answer-checker";

const cases = [
  ["electron", { answer: "electron", acceptedAnswers: '["an electron","e-","e⁻"]' }],
  ["Electron", { answer: "electron", acceptedAnswers: "[]" }],
  [" electron ", { answer: "electron", acceptedAnswers: "[]" }],
  ["e-", { answer: "electron", acceptedAnswers: '["e-","e⁻"]' }],
  ["e⁻", { answer: "electron", acceptedAnswers: '["e-","e⁻"]' }],
  ["magnetic flux density", { answer: "Magnetic flux density", acceptedAnswers: "[]" }],
  ["4 ohms", { answer: "4 Ω", acceptedAnswers: '["4 ohms","4 Ω"]' }],
  ["True", { answer: "T", acceptedAnswers: "[]" }],
  ["False", { answer: "F", acceptedAnswers: "[]" }],
  ["0.5", { answer: "1/2", acceptedAnswers: "[]" }],
] as const;

for (const [userAnswer, question] of cases) {
  if (!checkAnswer(userAnswer, question)) {
    throw new Error(`Expected "${userAnswer}" to match "${question.answer}".`);
  }
}

console.log(`Answer checker passed ${cases.length} regression cases.`);
