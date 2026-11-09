import assert from "node:assert/strict";
import { checkAnswer } from "../lib/answer-checker";
import { elementQuestions, formulaMass } from "../lib/elements/questions";
import { BY_SYMBOL, ELEMENTS, configuration, configurationText, positionOf, shellArrangement, unpairedElectrons } from "../lib/elements/data";

// 1. Every element once, in order.
assert.equal(ELEMENTS.length, 118);
ELEMENTS.forEach((element, index) => assert.equal(element.z, index + 1, "Atomic numbers must run 1..118"));
assert.equal(new Set(ELEMENTS.map((element) => element.symbol)).size, 118, "Symbols must be unique");
assert.equal(new Set(ELEMENTS.map((element) => element.name)).size, 118, "Names must be unique");
for (const element of ELEMENTS) assert.match(element.symbol, /^[A-Z][a-z]?$/, element.symbol);

// 2. Positions against independently known anchors (symbol: [group, period, block]).
const anchors: Record<string, [number | null, number, string]> = {
  H: [1, 1, "s"], He: [18, 1, "s"], Li: [1, 2, "s"], B: [13, 2, "p"], Ne: [18, 2, "p"], Na: [1, 3, "s"], Al: [13, 3, "p"],
  Ar: [18, 3, "p"], K: [1, 4, "s"], Sc: [3, 4, "d"], Fe: [8, 4, "d"], Zn: [12, 4, "d"], Ga: [13, 4, "p"], Kr: [18, 4, "p"],
  Y: [3, 5, "d"], Ag: [11, 5, "d"], Sn: [14, 5, "p"], I: [17, 5, "p"], Xe: [18, 5, "p"], Cs: [1, 6, "s"], Ba: [2, 6, "s"],
  Ce: [null, 6, "f"], Hf: [4, 6, "d"], W: [6, 6, "d"], Pt: [10, 6, "d"], Au: [11, 6, "d"], Hg: [12, 6, "d"], Tl: [13, 6, "p"],
  Pb: [14, 6, "p"], Rn: [18, 6, "p"], Fr: [1, 7, "s"], Ra: [2, 7, "s"], U: [null, 7, "f"], Rf: [4, 7, "d"], Cn: [12, 7, "d"],
  Nh: [13, 7, "p"], Og: [18, 7, "p"],
};
for (const [symbol, [group, period, block]] of Object.entries(anchors)) {
  const element = BY_SYMBOL.get(symbol)!;
  assert.deepEqual([element.group, element.period, element.block], [group, period, block], symbol);
}

// 3. Categories agree with positions.
for (const element of ELEMENTS) {
  const { category, group, z } = element;
  if (category === "alkali metal") assert.equal(group, 1, element.name);
  if (category === "alkaline earth metal") assert.equal(group, 2, element.name);
  if (category === "halogen") assert.equal(group, 17, element.name);
  if (category === "noble gas") assert.equal(group, 18, element.name);
  if (category === "lanthanide") assert.ok(z >= 57 && z <= 71, element.name);
  if (category === "actinide") assert.ok(z >= 89 && z <= 103, element.name);
  if (category === "transition metal") assert.equal(element.block, "d", element.name);
  if (category === "metalloid") assert.ok(["B", "Si", "Ge", "As", "Sb", "Te"].includes(element.symbol), element.name);
  if (group === 18 && z < 118) assert.equal(category, "noble gas", element.name);
  if (group === 17 && z < 117) assert.equal(category, "halogen", element.name);
  assert.equal(positionOf(z).period, element.period);
}

// 4. Configurations hold exactly Z electrons; known cases.
for (let z = 1; z <= 36; z += 1) assert.equal(configuration(z).reduce((sum, [, count]) => sum + count, 0), z, "electrons for Z=" + z);
assert.equal(configurationText(26), "[Ar] 3d⁶ 4s²");
assert.equal(configurationText(24), "[Ar] 3d⁵ 4s¹");
assert.equal(configurationText(29), "[Ar] 3d¹⁰ 4s¹");
assert.equal(configurationText(31), "[Ar] 3d¹⁰ 4s² 4p¹");
assert.equal(configurationText(11), "[Ne] 3s¹");
assert.equal(configurationText(1), "1s¹");
assert.equal(configurationText(8, false), "1s² 2s² 2p⁴");
assert.deepEqual([7, 8, 24, 26, 29, 10].map(unpairedElectrons), [3, 2, 6, 4, 1, 0]);
assert.deepEqual(shellArrangement(20), [2, 8, 8, 2]);
assert.deepEqual(shellArrangement(17), [2, 8, 7]);
assert.deepEqual(shellArrangement(2), [2]);

// 5. States: exactly 11 gases and 2 liquids among established elements.
assert.equal(ELEMENTS.filter((element) => element.state === "gas").length, 11);
assert.deepEqual(ELEMENTS.filter((element) => element.state === "liquid").map((element) => element.symbol), ["Br", "Hg"]);

// 6. Generated drills: every answer and accepted form is marked correct, and no other answer in the
//    same drill is accepted (e.g. the symbol "F" must not be read as "false").
assert.deepEqual(["H2O", "CaCO3", "Ca(OH)2", "CuSO4", "C6H12O6", "H2SO4"].map(formulaMass), [18, 100, 74, 159.5, 180, 98]);
const drills = elementQuestions();
assert.equal(new Set(drills.map((q) => q.questionText + "|" + q.answer)).size, drills.length, "Drills must be distinct");
const groups = new Map<string, typeof drills>();
for (const q of drills) {
  const key = { answer: q.answer, acceptedAnswers: JSON.stringify(q.acceptedAnswers), numericTolerance: q.numericTolerance, roundType: q.roundType };
  assert.ok(checkAnswer(q.answer, key), "Answer must match itself: " + q.questionText);
  for (const alternative of q.acceptedAnswers) assert.ok(checkAnswer(alternative, key), "Accepted form must match: " + alternative);
  if (q.roundType === "RIDDLE") assert.ok(q.riddleClues && q.riddleClues.length === 5, "Riddles need 5 clues");
  groups.set(q.subtopic + q.roundType, [...(groups.get(q.subtopic + q.roundType) ?? []), q]);
}
for (const list of groups.values()) {
  const answers = [...new Set(list.map((q) => q.answer))];
  for (const q of list) for (const other of answers) {
    if (other === q.answer || q.acceptedAnswers.includes(other)) continue;
    assert.ok(!checkAnswer(other, { answer: q.answer, acceptedAnswers: JSON.stringify(q.acceptedAnswers), numericTolerance: q.numericTolerance, roundType: q.roundType }),
      `"${other}" must not be accepted for "${q.questionText}"`);
  }
}

console.log(`Element drills passed: ${drills.length} generated questions, all self-consistent with no cross-accepted answers.`);
console.log("Element table passed: 118 elements, positions, categories, configurations and states are consistent.");
