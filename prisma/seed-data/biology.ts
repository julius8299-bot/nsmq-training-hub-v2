import { baseQuestion, buildSubjectBank, riddleClues, scenario } from "./question-factory";

const concepts = [
  ["Cell Biology", "Organelles", "mitochondrion", "site of aerobic respiration"],
  ["Genetics", "Inheritance", "allele", "alternative form of a gene"],
  ["Ecology", "Feeding relationships", "producer", "organism that makes organic food"],
  ["Evolution", "Natural selection", "adaptation", "inherited feature improving survival"],
  ["Human Physiology", "Circulation", "haemoglobin", "oxygen-carrying pigment"],
  ["Plant Biology", "Transport", "xylem", "tissue carrying water and mineral ions"],
  ["Reproduction", "Development", "metamorphosis", "major change in body form"],
  ["Nutrition", "Digestion", "enzyme", "biological catalyst"],
  ["Respiration", "Gas exchange", "alveolus", "thin-walled air sac"],
  ["Excretion", "Kidney", "nephron", "functional unit of the kidney"],
] as const;

export const biologyQuestions = buildSubjectBank({
  ROUND_ONE: (i, ghana) => {
    const dominant = 50 + (i % 5) * 10;
    return baseQuestion("BIOLOGY", "ROUND_ONE", i, ghana, {
      topic: "Genetics", subtopic: "Probability",
      questionText: `In ${scenario(i, ghana, "a genetics cross")}, a heterozygous parent transmits a specified allele with probability ${dominant}%. Express this probability as a decimal.`,
      answer: String(dominant / 100), acceptedAnswers: [`${dominant}%`, `${dominant}/100`],
      shortcutSolution: `Divide ${dominant} by 100.`,
      fullSolution: `${dominant}% = ${dominant}/100 = ${dominant / 100}.`,
      commonTrap: "Writing the percentage value without converting it.",
      repeatedPattern: "genetic percentage to probability", patternFamily: "genetic probability",
      tags: ["genetics", "probability", ghana ? "ghana-context" : "inheritance"],
    });
  },
  SPEED_RACE: (i, ghana) => {
    const marked = 20 + (i % 10) * 5, sample = 40 + (i % 8) * 10, recaptured = 5 + (i % 5) * 5;
    const estimate = marked * sample / recaptured;
    return baseQuestion("BIOLOGY", "SPEED_RACE", i, ghana, {
      topic: "Ecology", subtopic: "Capture-recapture",
      questionText: `${scenario(i, ghana, "An ecology survey")} marks ${marked} organisms. A later sample of ${sample} contains ${recaptured} marked organisms. Estimate population size.`,
      answer: String(estimate), acceptedAnswers: [`${estimate} organisms`],
      shortcutSolution: `N = first marked × second sample / marked recaptured.`,
      fullSolution: `N = ${marked} × ${sample} / ${recaptured} = ${estimate}.`,
      commonTrap: "Dividing the second sample by recaptures without multiplying by the first marked group.",
      repeatedPattern: "Lincoln index estimate", patternFamily: "population ecology",
      tags: ["ecology", "speed race", ghana ? "ghana-context" : "sampling"],
    });
  },
  PROBLEM_OF_THE_DAY: (i, ghana) => {
    const total = 200 + (i % 10) * 40, recessivePercent = [4, 9, 16, 25, 36][i % 5], q = Math.sqrt(recessivePercent / 100), p = 1 - q, carriers = Math.round(2 * p * q * 100);
    return baseQuestion("BIOLOGY", "PROBLEM_OF_THE_DAY", i, ghana, {
      topic: "Genetics", subtopic: "Hardy-Weinberg equilibrium",
      questionText: `In ${scenario(i, ghana, "a population study")} of ${total} individuals, ${recessivePercent}% show a recessive phenotype. Assuming Hardy-Weinberg equilibrium, find q, p, and the expected carrier percentage.`,
      answer: `q=${q}; p=${p}; ${carriers}%`, acceptedAnswers: [`${q}, ${p}, ${carriers}%`],
      shortcutSolution: "q² is the recessive frequency; take its square root, then use p + q = 1 and 2pq.",
      fullSolution: `q = √${recessivePercent / 100} = ${q}; p = 1 - ${q} = ${p}; carriers = 2(${p})(${q}) × 100 = ${carriers}%.`,
      commonTrap: "Treating the recessive phenotype frequency as q rather than q².",
      repeatedPattern: "Hardy-Weinberg carrier calculation", patternFamily: "population genetics",
      tags: ["genetics", "multi-step", ghana ? "ghana-context" : "Hardy-Weinberg"],
      examinerFocus: "Move from phenotype frequency to allele and genotype frequencies.",
      markingScheme: "3 marks q; 2 marks p; 4 marks carriers; 1 mark interpretation.",
    });
  },
  TRUE_FALSE: (i, ghana) => {
    const correct = i % 2 === 0;
    return baseQuestion("BIOLOGY", "TRUE_FALSE", i, ghana, {
      topic: "Plant Biology", subtopic: "Transport",
      questionText: `True or False: In ${scenario(i, ghana, "a plant experiment")}, ${correct ? "xylem" : "phloem"} is the main tissue transporting water upward from roots.`,
      answer: correct ? "True" : "False", acceptedAnswers: [correct ? "T" : "F"],
      shortcutSolution: "Xylem carries water and mineral ions.",
      fullSolution: `Water is transported mainly through xylem, so the statement is ${correct ? "true" : "false"}.`,
      commonTrap: "Interchanging xylem and phloem.",
      repeatedPattern: "plant transport tissue", patternFamily: "plant transport",
      tags: ["true false", "plants", ghana ? "ghana-context" : "biology"],
    });
  },
  RIDDLE: (i, ghana) => {
    const concept = concepts[i % concepts.length];
    return baseQuestion("BIOLOGY", "RIDDLE", i, ghana, {
      topic: concept[0], subtopic: concept[1],
      questionText: `Identify the biological structure or idea in riddle set ${i + 1}${ghana ? ` from ${scenario(i, true, "")}` : ""}.`,
      answer: concept[2], acceptedAnswers: [`a ${concept[2]}`, `the ${concept[2]}`],
      shortcutSolution: `The defining biological function is ${concept[3]}.`,
      fullSolution: `${concept[2][0].toUpperCase()}${concept[2].slice(1)} matches the function and biological context in all four clues.`,
      commonTrap: "Choosing a structure from the same system with a different function.",
      repeatedPattern: "identify biology concept", patternFamily: concept[0].toLowerCase(),
      tags: ["riddle", concept[0].toLowerCase(), ghana ? "ghana-context" : "definition"],
      riddleClues: riddleClues([
        `I belong to ${concept[0].toLowerCase()}.`,
        `I am studied under ${concept[1].toLowerCase()}.`,
        `My defining function is ${concept[3]}.`,
        `I am ${concept[2]}.`,
      ]),
    });
  },
});
