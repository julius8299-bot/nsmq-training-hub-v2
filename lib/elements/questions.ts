import type { SeedQuestion, Difficulty, RoundType } from "../../prisma/seed-data/question-factory";
import {
  BY_SYMBOL, ELEMENTS, RELATIVE_ATOMIC_MASS, SYMBOL_ORIGINS, configuration, configurationText, namesFor,
  shellArrangement, superscript, unpairedElectrons, type Element,
} from "./data";

/**
 * Periodic-table drills generated from the checked table in ./data.ts. Questions are deterministic,
 * so importing twice adds nothing, and every answer comes from data rather than hand-typed text.
 */
type Draft = {
  subtopic: string; roundType: RoundType; difficulty: Difficulty; timeLimitSeconds: number;
  questionText: string; answer: string; acceptedAnswers?: string[];
  shortcutSolution: string; fullSolution: string; commonTrap: string; repeatedPattern: string;
  tags?: string[]; riddleClues?: { clueNumber: number; clueText: string; points: number }[]; numericTolerance?: number;
};

const COMMON_HEAVY = new Set(["Ag", "Sn", "I", "Ba", "Pt", "Au", "Hg", "Pb", "U", "Ra", "Rn", "Xe", "Kr", "Br", "Sr", "Cs", "W", "Ni", "Zn", "Cu", "Fe", "Mn", "Cr"]);
function difficultyFor(element: Element): Difficulty {
  if (element.z <= 20) return "EASY";
  if (element.z <= 36 || COMMON_HEAVY.has(element.symbol)) return "MEDIUM";
  if (element.z <= 56 || element.z <= 86 && element.group !== null) return "HARD";
  return "NSMQ_FINAL_LEVEL";
}

/** Small deterministic generator so "random" distractors are identical on every import. */
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PERIOD_MNEMONICS: Record<number, string> = {
  2: "Period 2 in order: Li Be B C N O F Ne — \"Little Beatrice Boiled Cold Nuts On Fine Nights\".",
  3: "Period 3 in order: Na Mg Al Si P S Cl Ar — \"Naughty Magpies Always Steal Pretty Silver Clips Already\".",
  4: "Period 4: K Ca, then the 3d row Sc Ti V Cr Mn Fe Co Ni Cu Zn, then Ga Ge As Se Br Kr.",
};
const GROUP_MNEMONICS: Record<number, string> = {
  1: "Group 1 down the table: H Li Na K Rb Cs Fr — \"Hi Little Nana, Kindly Rub Cat's Fur\".",
  2: "Group 2 down the table: Be Mg Ca Sr Ba Ra — \"Beer Mugs Can Smash Bar Rooms\".",
  17: "Group 17 down the table: F Cl Br I At Ts — the halogens.",
  18: "Group 18 down the table: He Ne Ar Kr Xe Rn Og — \"He Never Arrives Kind; eXtremely Rude\".",
};
function positionShortcut(element: Element) {
  const lines = [
    `Periods start at Z = 1, 3, 11, 19, 37, 55, 87. ${element.name} (Z = ${element.z}) falls in period ${element.period}.`,
  ];
  if (element.group !== null) lines.push(`Count across the period: ${element.symbol} is in group ${element.group}.`);
  if (PERIOD_MNEMONICS[element.period]) lines.push(PERIOD_MNEMONICS[element.period]);
  if (element.group !== null && GROUP_MNEMONICS[element.group]) lines.push(GROUP_MNEMONICS[element.group]);
  return lines.join(" ");
}
const describe = (element: Element) =>
  `${element.name} (${element.symbol}) has atomic number ${element.z}; it is in period ${element.period}` +
  (element.group !== null ? `, group ${element.group}` : ", in the f-block series (no group number)") +
  `, ${element.block}-block, and is ${/^[aeiou]/.test(element.category) ? "an" : "a"} ${element.category}.`;

function symbolQuestions(element: Element): Draft[] {
  const names = namesFor(element);
  const origin = SYMBOL_ORIGINS[element.symbol];
  const symbolNote = origin ? ` Its symbol comes from the ${origin.language} name "${origin.origin}", which is why it does not match the English name.` : "";
  return [
    {
      subtopic: "Element symbols", roundType: "SPEED_RACE", difficulty: difficultyFor(element), timeLimitSeconds: 10,
      questionText: `Name the element with the symbol ${element.symbol}.`, answer: element.name, acceptedAnswers: names.slice(1),
      shortcutSolution: origin ? `${element.symbol} = ${origin.origin} (${origin.language}) = ${element.name}.` : `${element.symbol} = ${element.name}. Say the pair aloud as one word: "${element.symbol}-${element.name}".`,
      fullSolution: describe(element) + symbolNote,
      commonTrap: origin ? `Guessing from the English spelling. ${element.symbol} does not start like "${element.name}".` : "Mixing up elements whose symbols share a first letter.",
      repeatedPattern: "symbol to name",
    },
    {
      subtopic: "Element symbols", roundType: "SPEED_RACE", difficulty: difficultyFor(element), timeLimitSeconds: 10,
      questionText: `What is the chemical symbol for ${element.name}?`, answer: element.symbol,
      shortcutSolution: `${element.name} → ${element.symbol}.${origin ? ` Remember the ${origin.language} root "${origin.origin}".` : ""}`,
      fullSolution: describe(element) + symbolNote + " Symbols are one capital letter, or a capital followed by a small letter.",
      commonTrap: "Writing the second letter as a capital, or using the first two letters of the English name when the symbol comes from another root.",
      repeatedPattern: "name to symbol",
    },
  ];
}

function numberQuestions(element: Element): Draft[] {
  return [
    {
      subtopic: "Atomic numbers", roundType: "SPEED_RACE", difficulty: difficultyFor(element), timeLimitSeconds: 10,
      questionText: `Which element has atomic number ${element.z}?`, answer: element.name, acceptedAnswers: [...namesFor(element).slice(1), element.symbol],
      shortcutSolution: positionShortcut(element), fullSolution: describe(element) + ` Atomic number ${element.z} means ${element.z} protons in the nucleus.`,
      commonTrap: "Being one place off: recite the period from its first element instead of guessing.", repeatedPattern: "atomic number to element",
    },
    {
      subtopic: "Atomic numbers", roundType: "SPEED_RACE", difficulty: difficultyFor(element), timeLimitSeconds: 10,
      questionText: `What is the atomic number of ${element.name}?`, answer: String(element.z),
      shortcutSolution: positionShortcut(element), fullSolution: describe(element),
      commonTrap: "Giving the relative atomic mass instead of the atomic (proton) number.", repeatedPattern: "element to atomic number",
    },
  ];
}

function positionQuestions(element: Element, random: () => number): Draft[] {
  const drafts: Draft[] = [{
    subtopic: "Groups and periods", roundType: "ROUND_ONE", difficulty: difficultyFor(element), timeLimitSeconds: 15,
    questionText: `In which period of the Periodic Table is ${element.name} found?`, answer: String(element.period),
    acceptedAnswers: [`period ${element.period}`],
    shortcutSolution: positionShortcut(element), fullSolution: describe(element) + ` The period number equals the number of occupied electron shells.`,
    commonTrap: "Confusing period (row) with group (column).", repeatedPattern: "element to period",
  }];
  if (element.group !== null) {
    drafts.push({
      subtopic: "Groups and periods", roundType: "ROUND_ONE", difficulty: difficultyFor(element), timeLimitSeconds: 15,
      questionText: `In which group (1–18) of the Periodic Table is ${element.name} found?`, answer: String(element.group),
      acceptedAnswers: [`group ${element.group}`],
      shortcutSolution: positionShortcut(element), fullSolution: describe(element),
      commonTrap: element.group >= 13 ? `Using the old numbering (group ${element.group - 10}). In the 1–18 system add 10 for the p-block.` : "Counting from the wrong end of the period.",
      repeatedPattern: "element to group",
    });
  }
  if (!element.blockContested) {
    drafts.push({
      subtopic: "Groups and periods", roundType: "ROUND_ONE", difficulty: difficultyFor(element), timeLimitSeconds: 10,
      questionText: `To which block (s, p, d or f) of the Periodic Table does ${element.name} belong?`, answer: element.block,
      acceptedAnswers: [`${element.block}-block`, `${element.block} block`],
      shortcutSolution: "Groups 1–2 (and He) are s-block, 13–18 p-block, 3–12 d-block, and the two detached rows are f-block.",
      fullSolution: describe(element) + ` The block names the subshell that receives the last electron in the Aufbau order.`,
      commonTrap: "Putting helium in the p-block because it sits above the noble gases; it is 1s².",
      repeatedPattern: "element to block",
    });
  }
  // True/false on position: half true, half a near-miss.
  const truePeriod = random() < 0.5;
  const shown = truePeriod ? element.period : element.period === 7 ? 6 : element.period === 1 ? 2 : element.period + (random() < 0.5 ? -1 : 1);
  drafts.push({
    subtopic: "Groups and periods", roundType: "TRUE_FALSE", difficulty: difficultyFor(element), timeLimitSeconds: 10,
    questionText: `True or false: ${element.name} is in period ${shown}.`, answer: shown === element.period ? "True" : "False",
    shortcutSolution: positionShortcut(element), fullSolution: describe(element),
    commonTrap: "Answering from the group number instead of the row.", repeatedPattern: "period true or false",
  });
  return drafts;
}

const CATEGORY_ARTICLE = (category: string) => (/^[aeiou]/.test(category) ? "an " : "a ") + category;
const CATEGORIES = ["alkali metal", "alkaline earth metal", "transition metal", "post-transition metal", "metalloid", "nonmetal", "halogen", "noble gas", "lanthanide", "actinide"];
function propertyQuestions(element: Element, random: () => number): Draft[] {
  const drafts: Draft[] = [];
  if (!element.categoryContested) {
    const truthful = random() < 0.5;
    const others = CATEGORIES.filter((category) => category !== element.category);
    const shown = truthful ? element.category : others[Math.floor(random() * others.length)];
    drafts.push({
      subtopic: "Element families", roundType: "TRUE_FALSE", difficulty: difficultyFor(element), timeLimitSeconds: 10,
      questionText: `True or false: ${element.name} is ${CATEGORY_ARTICLE(shown)}.`, answer: shown === element.category ? "True" : "False",
      shortcutSolution: `Find the column first: group 1 alkali metals, group 2 alkaline earth, 3–12 transition metals, 17 halogens, 18 noble gases. ${element.name} is ${CATEGORY_ARTICLE(element.category)}.`,
      fullSolution: describe(element), commonTrap: "Calling hydrogen an alkali metal because it sits in group 1.",
      repeatedPattern: "element family true or false",
    });
  }
  if (element.state) {
    const states = ["solid", "liquid", "gas"] as const;
    const truthful = random() < 0.5;
    const shown = truthful ? element.state : states.filter((state) => state !== element.state)[Math.floor(random() * 2)];
    drafts.push({
      subtopic: "Element families", roundType: "TRUE_FALSE", difficulty: element.state === "solid" ? difficultyFor(element) : "EASY", timeLimitSeconds: 10,
      questionText: `True or false: at room temperature (25 °C) and normal pressure, ${element.name} is a ${shown}.`, answer: shown === element.state ? "True" : "False",
      shortcutSolution: "Only two elements are liquids at room temperature: bromine and mercury. Eleven are gases: H, N, O, F, Cl and the six noble gases He–Rn. Every other established element is a solid.",
      fullSolution: `${element.name} is a ${element.state} at 25 °C and 1 atm.`,
      commonTrap: element.symbol === "Ga" || element.symbol === "Cs" ? `${element.name} melts just above room temperature (below 30 °C), but at 25 °C it is still solid.` : "Forgetting that the halogens change state down the group: F₂ and Cl₂ gases, Br₂ liquid, I₂ solid.",
      repeatedPattern: "state at room temperature",
    });
  }
  const mainGroup = element.group !== null && (element.group <= 2 || element.group >= 13) && element.z <= 86;
  if (mainGroup) {
    const valence = element.symbol === "He" ? 2 : element.group! <= 2 ? element.group! : element.group! - 10;
    drafts.push({
      subtopic: "Electron configuration", roundType: "SPEED_RACE", difficulty: difficultyFor(element), timeLimitSeconds: 10,
      questionText: `How many valence (outer-shell) electrons does an atom of ${element.name} have?`, answer: String(valence),
      shortcutSolution: element.symbol === "He" ? "Helium is the exception in group 18: only 2 electrons, a full first shell." : `Main-group shortcut: groups 1–2 → same as group number; groups 13–18 → group number minus 10. Group ${element.group} → ${valence}.`,
      fullSolution: describe(element),
      commonTrap: element.group! >= 13 ? `Giving ${element.group} — subtract 10 in the 1–18 numbering.` : "Counting all electrons instead of the outer shell.",
      repeatedPattern: "valence electrons from group",
    });
  }
  return drafts;
}

function configurationQuestions(element: Element): Draft[] {
  if (element.z > 36) return [];
  const full = configurationText(element.z, false);
  const short = configurationText(element.z, true);
  const exception = element.z === 24 || element.z === 29;
  const drafts: Draft[] = [
    {
      subtopic: "Electron configuration", roundType: "ROUND_ONE", difficulty: element.z <= 20 ? "MEDIUM" : "HARD", timeLimitSeconds: 20,
      questionText: `Which element has the ground-state electron configuration ${short}?`, answer: element.name, acceptedAnswers: [...namesFor(element).slice(1), element.symbol],
      shortcutSolution: `Add the noble-gas core to the outer electrons: ${short} → ${element.z} electrons → Z = ${element.z} → ${element.name}.`,
      fullSolution: `${full} accounts for ${element.z} electrons, so the neutral atom has ${element.z} protons: ${element.name}.` + (exception ? " This is one of the two first-row exceptions (Cr and Cu): a half-filled or full 3d subshell is more stable, so one 4s electron moves into 3d." : ""),
      commonTrap: exception ? "Expecting 4s² — chromium and copper take only one 4s electron." : "Miscounting the noble-gas core: [He] = 2, [Ne] = 10, [Ar] = 18.",
      repeatedPattern: "configuration to element",
    },
    {
      subtopic: "Electron configuration", roundType: "SPEED_RACE", difficulty: element.z <= 18 ? "MEDIUM" : "HARD", timeLimitSeconds: 15,
      questionText: `How many unpaired electrons are in a ground-state atom of ${element.name}?`, answer: String(unpairedElectrons(element.z)),
      shortcutSolution: `Write only the last subshell(s): ${short}. Hund's rule: fill each box singly before pairing. p holds 3 boxes, d holds 5.`,
      fullSolution: `${element.name}: ${full}. Unpaired electrons: ${unpairedElectrons(element.z)}.`,
      commonTrap: exception ? `${element.name} has an anomalous configuration (${short}); count with that.` : "Pairing electrons too early — Hund's rule spreads them out first.",
      repeatedPattern: "unpaired electrons",
    },
  ];
  if (element.z <= 20) {
    const shells = shellArrangement(element.z);
    drafts.push({
      subtopic: "Electron configuration", roundType: "SPEED_RACE", difficulty: "EASY", timeLimitSeconds: 15,
      questionText: `Write the electron arrangement (by shells) of ${element.name}.`, answer: shells.join(","),
      acceptedAnswers: [shells.join("."), shells.join(" "), shells.join(", ")],
      shortcutSolution: "Fill shells 2, 8, 8, then 2 for K and Ca. The last number equals the group number for groups 1–2 and the group minus 10 for groups 13–18.",
      fullSolution: `${element.name} has ${element.z} electrons: ${shells.join(", ")}.`,
      commonTrap: "Putting more than 8 in the third shell for elements up to calcium.", repeatedPattern: "shell arrangement",
    });
  }
  return drafts;
}

const ORIGIN_QUESTIONS = Object.entries(SYMBOL_ORIGINS).map(([symbol, origin]): Draft => {
  const element = BY_SYMBOL.get(symbol)!;
  return {
    subtopic: "Element symbols", roundType: "ROUND_ONE", difficulty: "MEDIUM", timeLimitSeconds: 15,
    questionText: `The symbol of which element comes from the ${origin.language} word "${origin.origin}"?`, answer: element.name,
    acceptedAnswers: [element.symbol],
    shortcutSolution: `${origin.origin} → ${symbol} → ${element.name}. The eleven classic "odd" symbols: Na, K, Fe, Cu, Ag, Sn, Sb, W, Au, Hg, Pb.`,
    fullSolution: `${element.name}'s symbol ${symbol} comes from "${origin.origin}". ${describe(element)}`,
    commonTrap: "Matching the first letter of the old name to the English name.", repeatedPattern: "symbol origin",
  };
});

// Real nuclides only (mass number given in the question).
const ISOTOPES: [string, number][] = [
  ["H", 1], ["H", 2], ["H", 3], ["C", 12], ["C", 13], ["C", 14], ["N", 14], ["N", 15], ["O", 16], ["O", 18], ["F", 19],
  ["Na", 23], ["Mg", 24], ["Al", 27], ["Si", 28], ["P", 31], ["S", 32], ["Cl", 35], ["Cl", 37], ["K", 39], ["Ca", 40],
  ["Fe", 56], ["Co", 60], ["Cu", 63], ["Cu", 65], ["Sr", 90], ["I", 131], ["Cs", 137], ["Rn", 222], ["Ra", 226], ["U", 235], ["U", 238], ["Pu", 239],
];
const ISOTOPE_QUESTIONS = ISOTOPES.map(([symbol, mass]): Draft => {
  const element = BY_SYMBOL.get(symbol)!;
  return {
    subtopic: "Ions and isotopes", roundType: "SPEED_RACE", difficulty: mass > 60 ? "MEDIUM" : "EASY", timeLimitSeconds: 10,
    questionText: `How many neutrons are in one atom of ${element.name}-${mass} (${superscript(mass)}${symbol})?`, answer: String(mass - element.z),
    shortcutSolution: `Neutrons = mass number − atomic number = ${mass} − ${element.z} = ${mass - element.z}.`,
    fullSolution: `${element.name} has Z = ${element.z}, so ${element.z} protons. Mass number ${mass} counts protons + neutrons, leaving ${mass - element.z} neutrons.`,
    commonTrap: "Subtracting the relative atomic mass instead of the given mass number, or giving the proton count.",
    repeatedPattern: "neutrons from mass number",
  };
});

const IONS: [string, number][] = [
  ["H", 1], ["Li", 1], ["Na", 1], ["K", 1], ["Mg", 2], ["Ca", 2], ["Ba", 2], ["Al", 3], ["Fe", 2], ["Fe", 3], ["Cu", 2], ["Zn", 2],
  ["F", -1], ["Cl", -1], ["Br", -1], ["I", -1], ["O", -2], ["S", -2], ["N", -3], ["P", -3],
];
const ION_QUESTIONS = IONS.map(([symbol, charge]): Draft => {
  const element = BY_SYMBOL.get(symbol)!;
  const label = symbol + (Math.abs(charge) === 1 ? "" : superscript(Math.abs(charge))) + (charge > 0 ? "⁺" : "⁻");
  const electrons = element.z - charge;
  return {
    subtopic: "Ions and isotopes", roundType: "SPEED_RACE", difficulty: element.z > 20 ? "MEDIUM" : "EASY", timeLimitSeconds: 10,
    questionText: `How many electrons are in the ${label} ion?`, answer: String(electrons),
    shortcutSolution: `Electrons = Z − charge = ${element.z} − (${charge > 0 ? "+" : ""}${charge}) = ${electrons}.`,
    fullSolution: `${element.name} has ${element.z} electrons as a neutral atom. ${charge > 0 ? `Losing ${charge}` : `Gaining ${-charge}`} electron${Math.abs(charge) === 1 ? "" : "s"} gives ${electrons}.`,
    commonTrap: "Adding the charge for a positive ion. Positive means electrons were lost.", repeatedPattern: "electrons in an ion",
  };
});

// Formula masses computed from the WASSCE relative atomic masses, never typed by hand.
const COMPOUNDS: [string, string][] = [
  ["H2O", "water"], ["CO2", "carbon(IV) oxide"], ["NaCl", "sodium chloride"], ["CaCO3", "calcium trioxocarbonate(IV)"],
  ["H2SO4", "tetraoxosulphate(VI) acid"], ["NaOH", "sodium hydroxide"], ["HCl", "hydrogen chloride"], ["NH3", "ammonia"],
  ["CH4", "methane"], ["C6H12O6", "glucose"], ["MgO", "magnesium oxide"], ["KCl", "potassium chloride"],
  ["HNO3", "trioxonitrate(V) acid"], ["Na2CO3", "sodium trioxocarbonate(IV)"], ["CuSO4", "copper(II) tetraoxosulphate(VI)"],
  ["NH4Cl", "ammonium chloride"], ["C2H5OH", "ethanol"], ["Ca(OH)2", "calcium hydroxide"], ["Al2O3", "aluminium oxide"],
  ["KMnO4", "potassium tetraoxomanganate(VII)"], ["Fe2O3", "iron(III) oxide"], ["CaO", "calcium oxide"], ["SO2", "sulphur(IV) oxide"],
  ["NaHCO3", "sodium hydrogentrioxocarbonate(IV)"], ["AgNO3", "silver trioxonitrate(V)"], ["ZnO", "zinc oxide"], ["MgCl2", "magnesium chloride"],
];
export function formulaMass(formula: string): number {
  const expand = (text: string): string => text.replace(/\(([^()]+)\)(\d+)/g, (_match, inner: string, times: string) => inner.repeat(Number(times)));
  let total = 0;
  for (const [, symbol, count] of expand(formula).matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    const mass = RELATIVE_ATOMIC_MASS[symbol];
    if (mass === undefined) throw new Error("No relative atomic mass for " + symbol);
    total += mass * (count ? Number(count) : 1);
  }
  return Math.round(total * 10) / 10;
}
const subscript = (formula: string) => formula.replace(/\d/g, (digit) => "₀₁₂₃₄₅₆₇₈₉"[Number(digit)]);
const MASS_QUESTIONS = COMPOUNDS.map(([formula, name]): Draft => {
  const mass = formulaMass(formula);
  const parts = [...formula.replace(/\(([^()]+)\)(\d+)/g, (_m, inner: string, times: string) => inner.repeat(Number(times))).matchAll(/([A-Z][a-z]?)(\d*)/g)]
    .map(([, symbol, count]) => `${count || 1}×${symbol}(${RELATIVE_ATOMIC_MASS[symbol]})`);
  return {
    subtopic: "Relative masses", roundType: "SPEED_RACE", difficulty: formula.length > 5 ? "MEDIUM" : "EASY", timeLimitSeconds: 20,
    questionText: `Calculate the relative molecular (formula) mass of ${name}, ${subscript(formula)}. [H = 1, C = 12, N = 14, O = 16, Na = 23, Mg = 24, Al = 27, S = 32, Cl = 35.5, K = 39, Ca = 40, Mn = 55, Fe = 56, Cu = 63.5, Zn = 65, Ag = 108]`,
    answer: String(mass), acceptedAnswers: [`${mass} g/mol`, `${mass} g mol^-1`], numericTolerance: 0.05,
    shortcutSolution: `Group repeated atoms first: ${parts.join(" + ")} = ${mass}.`,
    fullSolution: `Add the relative atomic masses of every atom in ${subscript(formula)}: ${parts.join(" + ")} = ${mass}. (As a molar mass: ${mass} g/mol.)`,
    commonTrap: formula.includes("(") ? "Forgetting to multiply everything inside the brackets." : "Using 35 for chlorine or 63 for copper — use the table's 35.5 and 63.5.",
    repeatedPattern: "formula mass",
  };
});

/** Five clues from hardest to easiest, built only from table facts. */
function riddleFor(element: Element): Draft | null {
  if (element.z > 56 && !COMMON_HEAVY.has(element.symbol)) return null;
  const origin = SYMBOL_ORIGINS[element.symbol];
  const clues = [
    element.categoryContested ? `I am a ${element.block}-block element.` : `I am ${CATEGORY_ARTICLE(element.category)} in the ${element.block}-block.`,
    element.state ? `At room temperature I am a ${element.state}, and I sit in period ${element.period}.` : `I sit in period ${element.period}.`,
    element.group !== null ? `You will find me in group ${element.group}.` : `I belong to the series that hangs below the main table.`,
    origin ? `My symbol comes from the ${origin.language} word "${origin.origin}".` : element.z <= 36 ? `My ground-state configuration ends ${configurationText(element.z).split(" ").slice(-1)[0]}.` : `My nucleus holds between ${element.z - 3} and ${element.z + 3} protons.`,
    `My atomic number is ${element.z}.`,
  ];
  return {
    subtopic: "Element riddles", roundType: "RIDDLE", difficulty: difficultyFor(element), timeLimitSeconds: 60,
    questionText: "Who am I? (an element)", answer: element.name, acceptedAnswers: [...namesFor(element).slice(1), element.symbol],
    shortcutSolution: positionShortcut(element), fullSolution: describe(element),
    commonTrap: "Answering on the first clue with a neighbour in the same family — wait for the period or group if unsure.",
    repeatedPattern: "element riddle",
    riddleClues: clues.map((clueText, index) => ({ clueNumber: index + 1, clueText, points: [5, 4, 3, 3, 3][index] })),
  };
}

export function elementQuestions(): SeedQuestion[] {
  const drafts: Draft[] = [];
  for (const element of ELEMENTS) {
    const random = rng(element.z * 7919);
    drafts.push(...symbolQuestions(element), ...numberQuestions(element), ...positionQuestions(element, random), ...propertyQuestions(element, random), ...configurationQuestions(element));
    const riddle = riddleFor(element);
    if (riddle) drafts.push(riddle);
  }
  drafts.push(...ORIGIN_QUESTIONS, ...ISOTOPE_QUESTIONS, ...ION_QUESTIONS, ...MASS_QUESTIONS);
  return drafts.map((draft) => ({
    subject: "CHEMISTRY", topic: "Periodic Chemistry",
    subtopic: draft.subtopic, roundType: draft.roundType, difficulty: draft.difficulty, timeLimitSeconds: draft.timeLimitSeconds,
    questionText: draft.questionText, answer: draft.answer, acceptedAnswers: draft.acceptedAnswers ?? [],
    shortcutSolution: draft.shortcutSolution, fullSolution: draft.fullSolution, commonTrap: draft.commonTrap,
    encouragement: "Element facts are won by repetition. Do another ten and watch the time drop.",
    repeatedPattern: draft.repeatedPattern, patternFamily: "Periodic table recall",
    tags: ["periodic-table", draft.subtopic.toLowerCase().replaceAll(" ", "-"), ...(draft.tags ?? [])],
    ghanaContext: false, isGhanaContext: false,
    sourceType: "ORIGINAL", permissionStatus: "ORIGINAL", isPastQuestion: false, isPrivateOnly: false,
    ...(draft.numericTolerance !== undefined && { numericTolerance: draft.numericTolerance }),
    ...(draft.riddleClues && { riddleClues: draft.riddleClues }),
  }));
}
