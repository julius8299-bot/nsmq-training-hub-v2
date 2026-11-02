import { baseQuestion, buildSubjectBank, riddleClues, scenario } from "./question-factory";

const concepts = [
  ["Algebra", "Linear equations", "linear equation", "isolate the unknown"],
  ["Geometry", "Circle properties", "circle", "use the radius relationship"],
  ["Trigonometry", "Right triangles", "sine ratio", "opposite over hypotenuse"],
  ["Calculus", "Differentiation", "derivative", "apply the power rule"],
  ["Statistics and Probability", "Probability", "probability", "favourable outcomes over total outcomes"],
  ["Vectors", "Magnitude", "vector magnitude", "use Pythagoras on components"],
  ["Sequences and Series", "Arithmetic progression", "arithmetic progression", "use a + (n - 1)d"],
  ["Mensuration", "Area", "area", "multiply the relevant dimensions"],
  ["Logarithms", "Index form", "logarithm", "rewrite in exponential form"],
  ["Coordinate Geometry", "Gradient", "gradient", "change in y over change in x"],
] as const;

export const mathematicsQuestions = buildSubjectBank({
  ROUND_ONE: (i, ghana) => {
    const a = 2 + (i % 8), x = 3 + (i % 12), b = 1 + (i % 9), c = a * x + b;
    const setting = scenario(i, ghana, "a mathematics drill");
    return baseQuestion("MATHEMATICS", "ROUND_ONE", i, ghana, {
      topic: "Algebra", subtopic: "Linear equations",
      questionText: `In ${setting}, solve ${a}x + ${b} = ${c}.`,
      answer: String(x), acceptedAnswers: [`x = ${x}`],
      shortcutSolution: `Subtract ${b}, then divide by ${a}.`,
      fullSolution: `${a}x = ${c - b}, so x = ${c - b}/${a} = ${x}.`,
      commonTrap: "Dividing before removing the constant term.",
      repeatedPattern: "linear equation isolation", patternFamily: "algebraic manipulation",
      tags: ["algebra", "linear equation", ghana ? "ghana-context" : "fundamentals"],
    });
  },
  SPEED_RACE: (i, ghana) => {
    const x1 = 1 + (i % 9), y1 = 2 + (i % 7), dx = 2 + (i % 5), m = 1 + (i % 6), x2 = x1 + dx, y2 = y1 + m * dx;
    return baseQuestion("MATHEMATICS", "SPEED_RACE", i, ghana, {
      topic: "Coordinate Geometry", subtopic: "Gradient",
      questionText: `${scenario(i, ghana, "A coordinate exercise")} uses points (${x1}, ${y1}) and (${x2}, ${y2}). Find the gradient.`,
      answer: String(m), acceptedAnswers: [`m = ${m}`],
      shortcutSolution: `The rise is ${m * dx} and the run is ${dx}; divide.`,
      fullSolution: `m = (${y2} - ${y1})/(${x2} - ${x1}) = ${m * dx}/${dx} = ${m}.`,
      commonTrap: "Reversing only one of the two subtractions.",
      repeatedPattern: "two-point gradient", patternFamily: "coordinate geometry",
      tags: ["gradient", "speed race", ghana ? "ghana-context" : "coordinates"],
    });
  },
  PROBLEM_OF_THE_DAY: (i, ghana) => {
    const first = 10 + (i % 10) * 2, d = 2 + (i % 5), n = 12 + (i % 13);
    const last = first + (n - 1) * d;
    const sum = (n * (first + last)) / 2;
    return baseQuestion("MATHEMATICS", "PROBLEM_OF_THE_DAY", i, ghana, {
      topic: "Sequences and Series", subtopic: "Arithmetic series",
      questionText: `In ${scenario(i, ghana, "a savings plan")}, the first contribution is ${first} units and each next contribution increases by ${d} units. Find the ${n}th contribution and the total of the first ${n} contributions.`,
      answer: `${last}; ${sum}`, acceptedAnswers: [`${last} and ${sum}`],
      shortcutSolution: `Use a_n = a + (n - 1)d, then S_n = n(a + l)/2.`,
      fullSolution: `The ${n}th term is ${first} + ${n - 1}(${d}) = ${last}. The sum is ${n}(${first} + ${last})/2 = ${sum}.`,
      commonTrap: "Using n differences instead of n - 1.",
      repeatedPattern: "AP term and sum", patternFamily: "sequences and series",
      tags: ["AP", "multi-step", ghana ? "ghana-context" : "series"],
      examinerFocus: "Translate a repeated increase into an arithmetic progression and connect term and sum formulas.",
      markingScheme: "3 marks model; 3 marks nth term; 3 marks sum; 1 mark interpretation.",
    });
  },
  TRUE_FALSE: (i, ghana) => {
    const n = 2 + (i % 8), correct = i % 2 === 0;
    const claimed = correct ? n * n : n * n + 1;
    return baseQuestion("MATHEMATICS", "TRUE_FALSE", i, ghana, {
      topic: "Algebra", subtopic: "Indices",
      questionText: `True or False: In ${scenario(i, ghana, "this number pattern")}, ${n}² = ${claimed}.`,
      answer: correct ? "True" : "False", acceptedAnswers: [correct ? "T" : "F"],
      shortcutSolution: `${n} × ${n} = ${n * n}.`,
      fullSolution: `Squaring ${n} gives ${n * n}, so the statement is ${correct ? "true" : "false"}.`,
      commonTrap: "Multiplying the base by the exponent.",
      repeatedPattern: "evaluate a square", patternFamily: "indices",
      tags: ["true false", "indices", ghana ? "ghana-context" : "algebra"],
    });
  },
  RIDDLE: (i, ghana) => {
    const concept = concepts[i % concepts.length];
    return baseQuestion("MATHEMATICS", "RIDDLE", i, ghana, {
      topic: concept[0], subtopic: concept[1],
      questionText: `Identify the mathematical idea in riddle set ${i + 1}${ghana ? ` from ${scenario(i, true, "")}` : ""}.`,
      answer: concept[2], acceptedAnswers: [`a ${concept[2]}`],
      shortcutSolution: `The defining instruction is to ${concept[3]}.`,
      fullSolution: `${concept[2][0].toUpperCase()}${concept[2].slice(1)} is identified by its defining operation and properties.`,
      commonTrap: "Choosing a related formula instead of the named mathematical idea.",
      repeatedPattern: "identify mathematical object", patternFamily: concept[0].toLowerCase(),
      tags: ["riddle", concept[0].toLowerCase(), ghana ? "ghana-context" : "definition"],
      riddleClues: riddleClues([
        `I describe a precise relationship used in ${concept[1].toLowerCase()}.`,
        "Recognising my structure is usually faster than carrying out a long calculation.",
        `A reliable route is to ${concept[3]}.`,
        "A related formula may look tempting, but only one named idea matches all the clues.",
      ]),
    });
  },
});
