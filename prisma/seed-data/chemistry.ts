import { baseQuestion, buildSubjectBank, riddleClues, scenario } from "./question-factory";

const concepts = [
  ["Atomic Structure", "Particles", "proton", "positive particle in the nucleus"],
  ["Periodic Chemistry", "Groups", "halogen", "Group 17 element"],
  ["Chemical Bonding", "Bond types", "ionic bond", "electrostatic attraction between ions"],
  ["Stoichiometry", "Amount of substance", "mole", "Avogadro amount of particles"],
  ["Acids, Bases, and Salts", "Acidity", "pH", "negative logarithm of hydrogen-ion concentration"],
  ["Electrochemistry", "Electrolysis", "cathode", "electrode where reduction occurs"],
  ["Organic Chemistry", "Functional groups", "alkene", "hydrocarbon with a carbon-carbon double bond"],
  ["Chemical Equilibrium", "Dynamic systems", "equilibrium", "equal forward and reverse rates"],
  ["Thermochemistry", "Energy changes", "exothermic reaction", "reaction that transfers heat to surroundings"],
  ["Rates of Reaction", "Catalysis", "catalyst", "substance that lowers activation energy"],
] as const;

export const chemistryQuestions = buildSubjectBank({
  ROUND_ONE: (i, ghana) => {
    const mr = 20 + (i % 16) * 2, moles = 1 + (i % 7), mass = mr * moles;
    return baseQuestion("CHEMISTRY", "ROUND_ONE", i, ghana, {
      topic: "Stoichiometry", subtopic: "Mole calculations",
      questionText: `In ${scenario(i, ghana, "a chemistry practical")}, a substance of molar mass ${mr} g/mol has mass ${mass} g. Find the amount in moles.`,
      answer: `${moles} mol`, acceptedAnswers: [String(moles), `${moles} moles`],
      shortcutSolution: `n = m/M = ${mass}/${mr}.`,
      fullSolution: `Amount = mass ÷ molar mass = ${mass} g ÷ ${mr} g/mol = ${moles} mol.`,
      commonTrap: "Multiplying mass by molar mass.",
      repeatedPattern: "mass to moles", patternFamily: "mole concept",
      tags: ["moles", "stoichiometry", ghana ? "ghana-context" : "chemistry"],
    });
  },
  SPEED_RACE: (i, ghana) => {
    const exponent = 1 + (i % 12);
    return baseQuestion("CHEMISTRY", "SPEED_RACE", i, ghana, {
      topic: "Acids, Bases, and Salts", subtopic: "pH",
      questionText: `${scenario(i, ghana, "A solution")} has [H⁺] = 1 × 10^-${exponent} mol/dm³. Find its pH.`,
      answer: String(exponent), acceptedAnswers: [`pH ${exponent}`, `${exponent}.0`],
      shortcutSolution: "For a power-of-ten hydrogen concentration, pH is the positive exponent.",
      fullSolution: `pH = -log₁₀(10^-${exponent}) = ${exponent}.`,
      commonTrap: "Reporting a negative pH from the exponent sign.",
      repeatedPattern: "pH from hydrogen ion concentration", patternFamily: "acid-base calculations",
      tags: ["pH", "speed race", ghana ? "ghana-context" : "acids"],
    });
  },
  PROBLEM_OF_THE_DAY: (i, ghana) => {
    const theoretical = 20 + (i % 16) * 5, percent = 50 + (i % 10) * 5, actual = theoretical * percent / 100;
    return baseQuestion("CHEMISTRY", "PROBLEM_OF_THE_DAY", i, ghana, {
      topic: "Stoichiometry", subtopic: "Percentage yield",
      questionText: `In ${scenario(i, ghana, "an industrial reaction")}, the theoretical yield is ${theoretical} g and the actual yield is ${actual} g. Calculate percentage yield and the mass not obtained.`,
      answer: `${percent}%; ${theoretical - actual} g`, acceptedAnswers: [`${percent}, ${theoretical - actual}`],
      shortcutSolution: "Yield = actual/theoretical × 100; loss = theoretical - actual.",
      fullSolution: `Percentage yield = ${actual}/${theoretical} × 100 = ${percent}%. Missing mass = ${theoretical} - ${actual} = ${theoretical - actual} g.`,
      commonTrap: "Dividing theoretical yield by actual yield.",
      repeatedPattern: "percentage yield and shortfall", patternFamily: "reaction stoichiometry",
      tags: ["yield", "multi-step", ghana ? "ghana-context" : "stoichiometry"],
      examinerFocus: "Distinguish actual and theoretical yield and interpret the shortfall.",
      markingScheme: "5 marks percentage yield; 3 marks shortfall; 2 marks units and interpretation.",
    });
  },
  TRUE_FALSE: (i, ghana) => {
    const correct = i % 2 === 0;
    return baseQuestion("CHEMISTRY", "TRUE_FALSE", i, ghana, {
      topic: "Chemical Equilibrium", subtopic: "Dynamic equilibrium",
      questionText: `True or False: In ${scenario(i, ghana, "a closed reversible system")}, dynamic equilibrium means the forward and reverse reaction rates are ${correct ? "equal" : "zero"}.`,
      answer: correct ? "True" : "False", acceptedAnswers: [correct ? "T" : "F"],
      shortcutSolution: "Dynamic equilibrium has equal non-zero rates.",
      fullSolution: `At equilibrium both reactions continue at equal rates, so the statement is ${correct ? "true" : "false"}.`,
      commonTrap: "Confusing constant concentrations with stopped reactions.",
      repeatedPattern: "interpret dynamic equilibrium", patternFamily: "equilibrium",
      tags: ["true false", "equilibrium", ghana ? "ghana-context" : "chemistry"],
    });
  },
  RIDDLE: (i, ghana) => {
    const concept = concepts[i % concepts.length];
    return baseQuestion("CHEMISTRY", "RIDDLE", i, ghana, {
      topic: concept[0], subtopic: concept[1],
      questionText: `Identify the chemistry concept in riddle set ${i + 1}${ghana ? ` from ${scenario(i, true, "")}` : ""}.`,
      answer: concept[2], acceptedAnswers: [`a ${concept[2]}`],
      shortcutSolution: `Use the defining clue: ${concept[3]}.`,
      fullSolution: `${concept[2][0].toUpperCase()}${concept[2].slice(1)} is the chemistry term matching all four clues.`,
      commonTrap: "Choosing a neighbouring group, particle, or reaction type.",
      repeatedPattern: "identify chemistry concept", patternFamily: concept[0].toLowerCase(),
      tags: ["riddle", concept[0].toLowerCase(), ghana ? "ghana-context" : "definition"],
      riddleClues: riddleClues([
        `I am identified through evidence used in ${concept[1].toLowerCase()}.`,
        "My behaviour depends on particle structure, bonding, energy, or reaction conditions.",
        `My defining chemical description is ${concept[3]}.`,
        "A neighbouring group, particle, or reaction type will fail at least one clue.",
      ]),
    });
  },
});
