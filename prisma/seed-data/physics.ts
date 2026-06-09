import { baseQuestion, buildSubjectBank, riddleClues, scenario } from "./question-factory";

const concepts = [
  ["Mechanics", "Motion", "acceleration", "change in velocity per unit time"],
  ["Waves", "Wave properties", "frequency", "oscillations per second"],
  ["Electricity", "Circuit quantities", "electric current", "rate of flow of charge"],
  ["Magnetism", "Magnetic fields", "magnetic flux density", "force per current-length"],
  ["Optics", "Lenses", "focal length", "distance from lens to principal focus"],
  ["Heat and Thermodynamics", "Thermal transfer", "convection", "bulk motion of a fluid"],
  ["Modern Physics", "Particles", "electron", "negative elementary charge"],
  ["Measurement and Units", "SI quantities", "newton", "unit of force"],
  ["Pressure and Fluids", "Density", "density", "mass per unit volume"],
  ["Electronics", "Semiconductors", "diode", "one-way current device"],
] as const;

export const physicsQuestions = buildSubjectBank({
  ROUND_ONE: (i, ghana) => {
    const mass = 2 + (i % 18), acceleration = 2 + (i % 9), force = mass * acceleration;
    return baseQuestion("PHYSICS", "ROUND_ONE", i, ghana, {
      topic: "Mechanics", subtopic: "Newton's second law",
      questionText: `In ${scenario(i, ghana, "a mechanics experiment")}, a ${mass} kg body accelerates at ${acceleration} m/s². Find the resultant force.`,
      answer: `${force} N`, acceptedAnswers: [String(force), `${force}N`],
      shortcutSolution: `F = ma = ${mass} × ${acceleration}.`,
      fullSolution: `Newton's second law gives F = ${mass} kg × ${acceleration} m/s² = ${force} N.`,
      commonTrap: "Adding mass and acceleration instead of multiplying.",
      repeatedPattern: "force from mass and acceleration", patternFamily: "Newtonian mechanics",
      tags: ["force", "mechanics", ghana ? "ghana-context" : "Newton"],
    });
  },
  SPEED_RACE: (i, ghana) => {
    const resistance = 2 + (i % 11), current = 1 + (i % 8), voltage = resistance * current;
    return baseQuestion("PHYSICS", "SPEED_RACE", i, ghana, {
      topic: "Electricity", subtopic: "Ohm's law",
      questionText: `${scenario(i, ghana, "A circuit")} has ${voltage} V across a ${resistance} Ω resistor. Find the current.`,
      answer: `${current} A`, acceptedAnswers: [String(current), `${current}A`],
      shortcutSolution: `I = V/R = ${voltage}/${resistance}.`,
      fullSolution: `Ohm's law gives I = ${voltage} V ÷ ${resistance} Ω = ${current} A.`,
      commonTrap: "Multiplying voltage by resistance.",
      repeatedPattern: "Ohm's law current", patternFamily: "DC circuits",
      tags: ["Ohm law", "speed race", ghana ? "ghana-context" : "electricity"],
    });
  },
  PROBLEM_OF_THE_DAY: (i, ghana) => {
    const mass = 100 + (i % 10) * 20, height = 20 + (i % 12) * 5, time = 10 + (i % 8), energy = mass * 10 * height, power = energy / time;
    return baseQuestion("PHYSICS", "PROBLEM_OF_THE_DAY", i, ghana, {
      topic: "Mechanics", subtopic: "Energy and power",
      questionText: `In ${scenario(i, ghana, "an energy system")}, ${mass} kg is raised through ${height} m in ${time} s. Use g = 10 m/s². Find the gain in gravitational potential energy and average power.`,
      answer: `${energy} J; ${power} W`, acceptedAnswers: [`${energy}, ${power}`],
      shortcutSolution: `E = mgh, then P = E/t.`,
      fullSolution: `E = ${mass} × 10 × ${height} = ${energy} J. P = ${energy}/${time} = ${power} W.`,
      commonTrap: "Dividing by time before calculating the energy.",
      repeatedPattern: "gravitational energy and power", patternFamily: "work energy power",
      tags: ["energy", "power", ghana ? "ghana-context" : "mechanics"],
      examinerFocus: "Connect energy transferred to the rate of transfer.",
      markingScheme: "4 marks energy; 4 marks power; 2 marks units and interpretation.",
    });
  },
  TRUE_FALSE: (i, ghana) => {
    const correct = i % 2 === 0;
    return baseQuestion("PHYSICS", "TRUE_FALSE", i, ghana, {
      topic: "Waves", subtopic: "Wave equation",
      questionText: `True or False: In ${scenario(i, ghana, "a wave experiment")}, wave speed is ${correct ? "the product" : "the quotient"} of frequency and wavelength.`,
      answer: correct ? "True" : "False", acceptedAnswers: [correct ? "T" : "F"],
      shortcutSolution: "Recall v = fλ.",
      fullSolution: `Wave speed equals frequency multiplied by wavelength, so the statement is ${correct ? "true" : "false"}.`,
      commonTrap: "Confusing v = fλ with a ratio.",
      repeatedPattern: "interpret wave equation", patternFamily: "waves",
      tags: ["true false", "waves", ghana ? "ghana-context" : "physics"],
    });
  },
  RIDDLE: (i, ghana) => {
    const concept = concepts[i % concepts.length];
    const electron = i === 6;
    return baseQuestion("PHYSICS", "RIDDLE", i, ghana, {
      topic: concept[0], subtopic: concept[1],
      questionText: `Identify the physics quantity or object in riddle set ${i + 1}${ghana ? ` from ${scenario(i, true, "")}` : ""}.`,
      answer: concept[2], acceptedAnswers: electron ? ["an electron", "e-", "e⁻"] : [`a ${concept[2]}`],
      shortcutSolution: `The defining clue is ${concept[3]}.`,
      fullSolution: `${concept[2][0].toUpperCase()}${concept[2].slice(1)} is identified by the stated physical definition and SI relationship.`,
      commonTrap: "Choosing a related unit instead of the requested quantity or object.",
      repeatedPattern: "identify physics concept", patternFamily: concept[0].toLowerCase(),
      tags: ["riddle", concept[0].toLowerCase(), ghana ? "ghana-context" : "definition"],
      riddleClues: riddleClues([
        `I am recognised by a measurable relationship in ${concept[1].toLowerCase()}.`,
        "My value or effect is often inferred from a formula, graph, or conservation argument.",
        `My defining physical idea is ${concept[3]}.`,
        "Do not confuse me with a related unit, instrument, or neighbouring quantity.",
      ]),
    });
  },
});
