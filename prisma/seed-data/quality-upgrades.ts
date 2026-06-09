import type { SeedQuestion } from "./question-factory";

type Patch = Partial<
  Pick<
    SeedQuestion,
    | "topic"
    | "subtopic"
    | "questionText"
    | "answer"
    | "acceptedAnswers"
    | "shortcutSolution"
    | "fullSolution"
    | "commonTrap"
    | "repeatedPattern"
    | "patternFamily"
    | "tags"
    | "examinerFocus"
    | "markingScheme"
    | "numericTolerance"
    | "riddleClues"
  >
>;

type RiddleEntry = {
  topic: string;
  subtopic: string;
  answer: string;
  acceptedAnswers?: string[];
  clues: string[];
  shortcut: string;
  full: string;
  trap: string;
  family: string;
  tags: string[];
};

const cluePoints = [5, 4, 3, 3, 3];

function clues(values: string[]) {
  return values.map((clueText, index) => ({
    clueNumber: index + 1,
    clueText,
    points: cluePoints[index],
  }));
}

function merge(question: SeedQuestion, patch: Patch): SeedQuestion {
  return {
    ...question,
    ...patch,
    acceptedAnswers: patch.acceptedAnswers ?? question.acceptedAnswers,
    tags: Array.from(new Set([...(question.tags ?? []), ...(patch.tags ?? [])])),
  };
}

function choose<T>(items: readonly T[], index: number) {
  return items[index % items.length];
}

function finalTag(question: SeedQuestion) {
  return question.difficulty === "NSMQ_FINAL_LEVEL" ? ["final-level"] : [];
}

function roundTag(question: SeedQuestion) {
  if (question.roundType === "SPEED_RACE") return ["speed-race", "wrong-answer-minus-one"];
  if (question.roundType === "PROBLEM_OF_THE_DAY") return ["potd", "10-mark"];
  if (question.roundType === "TRUE_FALSE") return ["true-false", "conceptual-landmine"];
  if (question.roundType === "RIDDLE") return ["riddle"];
  return ["fundamentals"];
}

const mathRiddles: RiddleEntry[] = [
  {
    topic: "Calculus",
    subtopic: "Derivatives",
    answer: "derivative",
    clues: [
      "I describe an instantaneous rate, not merely an average over an interval.",
      "I arise from a limit of a quotient of small changes.",
      "At a point on a curve, I give the gradient of the tangent.",
      "Differentiation is the operation used to obtain me.",
    ],
    shortcut: "The tangent-gradient clue points to derivative.",
    full: "A derivative is the limit that gives instantaneous rate of change and tangent gradient.",
    trap: "Do not answer gradient alone; the derivative is the function or value that gives it.",
    family: "calculus definitions",
    tags: ["calculus"],
  },
  {
    topic: "Vectors",
    subtopic: "Scalar product",
    answer: "scalar product",
    acceptedAnswers: ["dot product", "the scalar product"],
    clues: [
      "I combine two vectors but return a number.",
      "My sign distinguishes acute from obtuse separation.",
      "I contain the cosine of the angle between two vectors.",
      "I vanish for perpendicular non-zero vectors.",
    ],
    shortcut: "A vector operation returning a scalar and using cosine is the scalar product.",
    full: "The scalar product a.b = |a||b|cos theta and equals zero for perpendicular non-zero vectors.",
    trap: "Cross product gives a vector, not the scalar requested.",
    family: "vector reasoning",
    tags: ["vectors"],
  },
  {
    topic: "Statistics and Probability",
    subtopic: "Measures of spread",
    answer: "standard deviation",
    clues: [
      "I am unchanged when the same constant is added to every observation.",
      "I share the units of the original data.",
      "I am the square root of a mean squared deviation.",
      "I measure spread about the mean.",
    ],
    shortcut: "The square root of variance is standard deviation.",
    full: "Standard deviation measures dispersion around the mean using the square root of averaged squared deviations.",
    trap: "Variance has squared units; standard deviation has the original units.",
    family: "statistics definitions",
    tags: ["statistics"],
  },
  {
    topic: "Coordinate Geometry",
    subtopic: "Loci",
    answer: "circle",
    acceptedAnswers: ["a circle"],
    clues: [
      "I am a closed plane locus.",
      "Each point on me is the same distance from one fixed point.",
      "My standard equation may contain (x-a)^2 + (y-b)^2.",
      "I have a centre and a radius.",
    ],
    shortcut: "Constant distance from a fixed point defines a circle.",
    full: "A circle is the locus of points at a fixed distance from a centre.",
    trap: "A sphere is the three-dimensional analogue, not the plane locus.",
    family: "coordinate loci",
    tags: ["geometry"],
  },
  {
    topic: "Functions",
    subtopic: "Inverse functions",
    answer: "inverse function",
    clues: [
      "I exist only after a one-to-one restriction where necessary.",
      "My graph is reflected in the line y = x.",
      "Composing me with my partner returns the input.",
      "I reverse the action of a function.",
    ],
    shortcut: "The reversal and reflection across y = x identify an inverse function.",
    full: "An inverse function undoes another function on a suitable domain.",
    trap: "A reciprocal is not generally the same as an inverse function.",
    family: "functions",
    tags: ["functions"],
  },
  {
    topic: "Sequences and Series",
    subtopic: "Arithmetic progression",
    answer: "arithmetic progression",
    clues: [
      "My successive terms change by a constant amount.",
      "My nth term is linear in n.",
      "My finite sum can be found by pairing first and last terms.",
      "I am a sequence with a common difference.",
    ],
    shortcut: "Common difference is the defining clue.",
    full: "An arithmetic progression has terms a, a+d, a+2d, and so on.",
    trap: "A geometric progression uses a common ratio, not a common difference.",
    family: "sequences",
    tags: ["sequences"],
  },
];

const physicsRiddles: RiddleEntry[] = [
  {
    topic: "Electricity and Magnetism",
    subtopic: "Electromagnetic induction",
    answer: "Lenz's law",
    acceptedAnswers: ["lenz law"],
    clues: [
      "I am a directional rule in electromagnetic induction.",
      "I protect conservation of energy by resisting the producing change.",
      "I decide the direction of induced current in a closed circuit.",
      "I say the effect opposes the change in magnetic flux that produced it.",
    ],
    shortcut: "Opposition to magnetic-flux change identifies Lenz's law.",
    full: "Lenz's law states that induced current flows so as to oppose the change in flux producing it.",
    trap: "Faraday's law gives magnitude of induced emf; Lenz's law gives direction.",
    family: "electromagnetic induction",
    tags: ["magnetism"],
  },
  {
    topic: "Optics",
    subtopic: "Total internal reflection",
    answer: "critical angle",
    clues: [
      "I exist only when light moves toward a less optically dense medium.",
      "At my value the refracted ray travels along the boundary.",
      "Beyond me, total internal reflection occurs.",
      "My sine equals the ratio of refractive indices n2/n1.",
    ],
    shortcut: "The total-internal-reflection threshold is the critical angle.",
    full: "The critical angle is the angle of incidence for which the angle of refraction is 90 degrees.",
    trap: "It is not defined for light moving into a more optically dense medium.",
    family: "geometrical optics",
    tags: ["optics"],
  },
  {
    topic: "Mechanics",
    subtopic: "Rotational effects",
    answer: "moment of a force",
    clues: [
      "I depend on a force and a perpendicular distance from a pivot.",
      "My effect can be clockwise or anticlockwise.",
      "In rotational equilibrium my algebraic sum is zero.",
      "My SI unit is newton metre.",
    ],
    shortcut: "Force times perpendicular distance gives moment.",
    full: "Moment of a force is the turning effect about a point.",
    trap: "Work also has unit newton metre, but moment is a turning effect.",
    family: "moments",
    tags: ["mechanics"],
  },
  {
    topic: "Modern Physics",
    subtopic: "Radioactivity",
    answer: "half-life",
    clues: [
      "I am statistically stable for a radioactive nuclide.",
      "I do not depend on the starting sample size.",
      "After each interval equal to me, half the undecayed nuclei remain.",
      "I characterise exponential radioactive decay.",
    ],
    shortcut: "Repeated halving identifies half-life.",
    full: "Half-life is the time taken for the number of undecayed nuclei to fall to half its value.",
    trap: "It is not the time for every nucleus in a sample to decay.",
    family: "radioactivity",
    tags: ["modern physics"],
  },
  {
    topic: "Fluids",
    subtopic: "Fluid resistance",
    answer: "viscosity",
    clues: [
      "I am an internal resistance to fluid flow.",
      "Temperature affects me differently in liquids and gases.",
      "I appear in Stokes' law for small spheres.",
      "I am often described as fluid friction.",
    ],
    shortcut: "Fluid friction is viscosity.",
    full: "Viscosity measures resistance to flow within a fluid.",
    trap: "Density is mass per volume; viscosity is resistance to flow.",
    family: "fluid mechanics",
    tags: ["fluids"],
  },
];

const chemistryRiddles: RiddleEntry[] = [
  {
    topic: "Equilibrium",
    subtopic: "Catalysis",
    answer: "catalyst",
    acceptedAnswers: ["a catalyst"],
    clues: [
      "I provide an alternative route for a reaction.",
      "I lower activation energy without being used up overall.",
      "I speed both forward and reverse reactions in a reversible system.",
      "I do not change the equilibrium yield.",
    ],
    shortcut: "Lower activation energy without changing yield means catalyst.",
    full: "A catalyst increases reaction rate by providing a lower-energy pathway and is regenerated.",
    trap: "A catalyst changes rate, not the equilibrium position.",
    family: "reaction rates",
    tags: ["rates"],
  },
  {
    topic: "Acids, Bases, and Salts",
    subtopic: "pH",
    answer: "pH",
    clues: [
      "I am dimensionless in school calculations.",
      "A fall of one unit means a tenfold increase in hydrogen-ion concentration.",
      "I am the negative logarithm of hydrogen-ion concentration.",
      "I indicate acidity or alkalinity of a solution.",
    ],
    shortcut: "Negative log of hydrogen-ion concentration is pH.",
    full: "pH = -log10[H+] for dilute aqueous solutions in this context.",
    trap: "pOH is based on hydroxide-ion concentration, not hydrogen-ion concentration.",
    family: "acid-base chemistry",
    tags: ["acids"],
  },
  {
    topic: "Electrochemistry",
    subtopic: "Electrolysis",
    answer: "cathode",
    acceptedAnswers: ["the cathode"],
    clues: [
      "I am one of two electrodes in an electrochemical system.",
      "Cations move toward me during electrolysis.",
      "Reduction occurs at my surface.",
      "In an electrolytic cell I am connected to the negative terminal.",
    ],
    shortcut: "Reduction at the electrode identifies the cathode.",
    full: "The cathode is the electrode at which reduction occurs.",
    trap: "Its sign differs between galvanic and electrolytic cells; reduction is the safer definition.",
    family: "electrochemistry",
    tags: ["electrolysis"],
  },
  {
    topic: "Organic Chemistry",
    subtopic: "Alkenes",
    answer: "alkene",
    acceptedAnswers: ["an alkene"],
    clues: [
      "I am an unsaturated hydrocarbon family.",
      "I can decolourise bromine water by addition.",
      "My functional feature is a carbon-carbon double bond.",
      "My general formula for an open-chain member is CnH2n.",
    ],
    shortcut: "Carbon-carbon double bond identifies an alkene.",
    full: "Alkenes are unsaturated hydrocarbons containing at least one C=C bond.",
    trap: "Alkanes are saturated and do not have the C=C functional feature.",
    family: "organic functional groups",
    tags: ["organic"],
  },
  {
    topic: "Atomic Structure",
    subtopic: "Amount of substance",
    answer: "mole",
    acceptedAnswers: ["a mole"],
    clues: [
      "I connect microscopic particles to measurable laboratory amounts.",
      "My size is fixed by Avogadro's constant.",
      "My mass in grams can equal relative formula mass numerically.",
      "I am the SI unit for amount of substance.",
    ],
    shortcut: "Amount of substance in SI units is the mole.",
    full: "The mole is the amount containing Avogadro's number of elementary entities.",
    trap: "Molar mass is a mass per mole, not the amount itself.",
    family: "mole concept",
    tags: ["stoichiometry"],
  },
];

const biologyRiddles: RiddleEntry[] = [
  {
    topic: "Cell Biology",
    subtopic: "Organelles",
    answer: "mitochondrion",
    acceptedAnswers: ["mitochondria", "a mitochondrion"],
    clues: [
      "I am bounded by two membranes in eukaryotic cells.",
      "I contain circular DNA and 70S ribosomes.",
      "My inner membrane is folded into cristae.",
      "I am a principal site of aerobic ATP production.",
    ],
    shortcut: "Cristae and aerobic ATP production identify the mitochondrion.",
    full: "Mitochondria are double-membraned organelles associated with aerobic respiration.",
    trap: "Chloroplasts also have DNA, but cristae and aerobic ATP point to mitochondria.",
    family: "cell organelles",
    tags: ["cell biology"],
  },
  {
    topic: "Genetics",
    subtopic: "Chromosomes",
    answer: "centromere",
    clues: [
      "I occupy a chromosome region where sister chromatids remain joined.",
      "A kinetochore assembles near me for spindle attachment.",
      "My position helps classify chromosome shape.",
      "I contribute to the X-like appearance of a duplicated chromosome.",
    ],
    shortcut: "Chromatid attachment region identifies the centromere.",
    full: "The centromere is the chromosomal region associated with chromatid attachment and kinetochore formation.",
    trap: "A centrosome organizes spindle microtubules; it is not the chromosome region.",
    family: "chromosome structure",
    tags: ["genetics"],
  },
  {
    topic: "Plant Biology",
    subtopic: "Transport",
    answer: "xylem",
    clues: [
      "I am a complex vascular tissue.",
      "Many of my conducting cells are dead and lignified at maturity.",
      "I conduct water and mineral ions upward from roots.",
      "Cohesion-tension helps explain transport through me.",
    ],
    shortcut: "Dead lignified water-conducting tissue is xylem.",
    full: "Xylem transports water and mineral ions, supported by lignified vessel elements and tracheids.",
    trap: "Phloem transports organic solutes and is not mainly dead at maturity.",
    family: "plant transport",
    tags: ["plant biology"],
  },
  {
    topic: "Excretion",
    subtopic: "Kidney",
    answer: "nephron",
    acceptedAnswers: ["a nephron"],
    clues: [
      "I am microscopic but regulate water and dissolved substances in vertebrates.",
      "Filtration begins in my renal corpuscle.",
      "Selective reabsorption and secretion occur along my tubules.",
      "I am the functional unit of the kidney.",
    ],
    shortcut: "Functional unit of the kidney identifies the nephron.",
    full: "The nephron filters blood and modifies filtrate to form urine.",
    trap: "The kidney is the organ; the nephron is the functional unit.",
    family: "excretion",
    tags: ["kidney"],
  },
  {
    topic: "Nervous System",
    subtopic: "Synaptic transmission",
    answer: "synapse",
    acceptedAnswers: ["a synapse"],
    clues: [
      "I am a junction where direct cytoplasmic continuity is usually absent.",
      "Calcium entry can trigger vesicle release near me.",
      "Neurotransmitters cross my narrow gap.",
      "I functionally connect a neuron to another cell.",
    ],
    shortcut: "Neurotransmitter crossing a gap identifies a synapse.",
    full: "A synapse is a functional junction through which signals pass between neurons or effector cells.",
    trap: "An axon carries impulses; the synapse is the junction.",
    family: "nervous system",
    tags: ["nervous system"],
  },
];

const ghanaRiddles: Record<SeedQuestion["subject"], RiddleEntry[]> = {
  MATHEMATICS: [
    {
      topic: "Geometry",
      subtopic: "Kente symmetry",
      answer: "rotational symmetry",
      clues: [
        "I describe how a design can turn and still match itself.",
        "A square kente motif displays me at quarter-turn intervals.",
        "My order counts matching positions in one full revolution.",
        "Adinkra and kente patterns often use me in geometric design.",
      ],
      shortcut: "Matching after rotation identifies rotational symmetry.",
      full: "Rotational symmetry occurs when a figure coincides with itself after rotation about a point.",
      trap: "Reflection symmetry uses mirror lines, not turning.",
      family: "ghana geometry",
      tags: ["ghana-context", "kente", "symmetry"],
    },
    {
      topic: "Sequences and Series",
      subtopic: "Kente patterns",
      answer: "arithmetic progression",
      clues: [
        "I can model a pattern that increases by the same amount each strip.",
        "A weaving count may use my nth-term rule.",
        "My common difference remains constant.",
        "My finite sum pairs first and last counts.",
      ],
      shortcut: "Constant increase points to arithmetic progression.",
      full: "Arithmetic progressions model repeated equal increases in pattern counts.",
      trap: "A repeating colour cycle is modular; a steadily increasing count is arithmetic.",
      family: "ghana sequences",
      tags: ["ghana-context", "kente"],
    },
  ],
  PHYSICS: [
    {
      topic: "Energy",
      subtopic: "Hydroelectric power",
      answer: "hydroelectric power",
      acceptedAnswers: ["hydroelectricity"],
      clues: [
        "I begin with gravitational potential energy stored in water.",
        "At Akosombo, falling water can spin turbines.",
        "My generator stage converts mechanical energy to electrical energy.",
        "I am electricity produced from moving water.",
      ],
      shortcut: "Akosombo, turbines, and water energy identify hydroelectric power.",
      full: "Hydroelectric power converts gravitational potential energy of water into electrical energy.",
      trap: "The dam stores water; the power is produced through turbine-generator conversion.",
      family: "ghana energy",
      tags: ["ghana-context", "Akosombo"],
    },
    {
      topic: "Heat and Thermodynamics",
      subtopic: "Evaporative cooling",
      answer: "evaporation",
      clues: [
        "I remove faster molecules from a liquid surface.",
        "A porous clay pot uses me to cool water.",
        "Dry Harmattan air can make me occur faster.",
        "I am the change from liquid to vapour at a surface.",
      ],
      shortcut: "Clay-pot cooling points to evaporation.",
      full: "Evaporation removes high-energy molecules and lowers the average kinetic energy of the remaining liquid.",
      trap: "Boiling occurs throughout a liquid at its boiling point; evaporation can occur at the surface below it.",
      family: "ghana heat",
      tags: ["ghana-context", "clay-pot"],
    },
  ],
  CHEMISTRY: [
    {
      topic: "Food Chemistry",
      subtopic: "Gari processing",
      answer: "dehydration",
      clues: [
        "I am common in food preservation.",
        "I reduce the water available to microorganisms.",
        "You see me when gari is roasted.",
        "I am the removal of water from a substance.",
      ],
      shortcut: "Roasting gari removes water; that is dehydration.",
      full: "Dehydration lowers water activity and slows microbial spoilage.",
      trap: "Sterilisation kills microorganisms; dehydration mainly limits available water.",
      family: "ghana food chemistry",
      tags: ["ghana-context", "gari"],
    },
    {
      topic: "Food Chemistry",
      subtopic: "Fermentation",
      answer: "fermentation",
      acceptedAnswers: ["lactic acid fermentation"],
      clues: [
        "Microorganisms carry me out when oxygen is limited or absent.",
        "Kenkey dough souring depends on acids formed through me.",
        "Cocoa processing also relies on microbial action related to me.",
        "I am a biochemical breakdown process that can produce acids, alcohol, or gas.",
      ],
      shortcut: "Kenkey souring and cocoa processing point to fermentation.",
      full: "Fermentation is microbial biochemical conversion of organic substances, often producing acids or alcohol.",
      trap: "Cooking by heat is not fermentation; living microorganisms are involved.",
      family: "ghana fermentation",
      tags: ["ghana-context", "kenkey", "cocoa"],
    },
  ],
  BIOLOGY: [
    {
      topic: "Reproduction",
      subtopic: "Mosquito life cycle",
      answer: "complete metamorphosis",
      clues: [
        "I include a larval stage that looks unlike the adult.",
        "Mosquitoes in stagnant water pass through me.",
        "My stages include egg, larva, pupa, and adult.",
        "I am the developmental pattern seen in mosquitoes.",
      ],
      shortcut: "Egg-larva-pupa-adult identifies complete metamorphosis.",
      full: "Mosquitoes undergo complete metamorphosis, with aquatic larva and pupa before the adult.",
      trap: "Incomplete metamorphosis lacks a pupal stage.",
      family: "ghana malaria biology",
      tags: ["ghana-context", "mosquito", "malaria"],
    },
    {
      topic: "Plant Biology",
      subtopic: "Fruit ripening",
      answer: "ethene",
      acceptedAnswers: ["ethylene"],
      clues: [
        "I am a simple gaseous molecule with biological signalling effects.",
        "Stored plantain can ripen faster when my concentration rises.",
        "I promote colour change, softening, and sugar formation in fruits.",
        "I am the plant hormone associated with fruit ripening.",
      ],
      shortcut: "Fruit ripening points to ethene.",
      full: "Ethene is a gaseous plant hormone that promotes fruit ripening.",
      trap: "Auxin is important in growth responses, not the main ripening gas.",
      family: "ghana plant biology",
      tags: ["ghana-context", "plantain"],
    },
  ],
};

function riddleVariant(question: SeedQuestion, index: number, ghanaContext = false) {
  const catalog = ghanaContext
    ? ghanaRiddles[question.subject]
    : question.subject === "MATHEMATICS"
      ? mathRiddles
      : question.subject === "PHYSICS"
        ? physicsRiddles
        : question.subject === "CHEMISTRY"
          ? chemistryRiddles
          : biologyRiddles;
  const item = choose(catalog, index);
  return merge(question, {
    topic: item.topic,
    subtopic: item.subtopic,
    questionText: "Who am I?",
    answer: item.answer,
    acceptedAnswers: item.acceptedAnswers ?? [`a ${item.answer}`, `the ${item.answer}`],
    shortcutSolution: item.shortcut,
    fullSolution: item.full,
    commonTrap: item.trap,
    repeatedPattern: "layered clue identification",
    patternFamily: item.family,
    tags: [...item.tags, ...roundTag(question), ...finalTag(question), ...(ghanaContext ? ["ghana-context"] : [])],
    riddleClues: clues(item.clues),
  });
}

function mathRoundOne(question: SeedQuestion, index: number) {
  const k = 2 + (index % 8);
  const variants = [
    {
      questionText: `State the necessary and sufficient condition for two non-zero vectors u and v to be perpendicular. Verify it for u = (${k}, 1) and v = (1, -${k}).`,
      answer: "Their dot product is zero; the given vectors are perpendicular.",
      acceptedAnswers: ["u dot v = 0", "dot product is zero", "u.v=0"],
      shortcutSolution: `Compute ${k}(1) + 1(-${k}) = 0.`,
      fullSolution: "Two non-zero vectors are perpendicular if and only if their scalar product is zero. The given component products cancel, so the vectors are perpendicular.",
      commonTrap: "Checking equal magnitudes instead of the scalar product.",
      topic: "Vectors",
      subtopic: "Perpendicular vectors",
      family: "vector reasoning",
    },
    {
      questionText: `Differentiate y = x^${k} - ${k}x and state the condition for a stationary point.`,
      answer: `dy/dx = ${k}x^${k - 1} - ${k}; stationary point when dy/dx = 0.`,
      acceptedAnswers: [`${k}x^${k - 1}-${k}`, "dy/dx=0"],
      shortcutSolution: "Use the power rule, then set the derivative to zero.",
      fullSolution: `By the power rule, d(x^${k})/dx = ${k}x^${k - 1}; hence dy/dx = ${k}x^${k - 1} - ${k}. A stationary point occurs where dy/dx = 0.`,
      commonTrap: "Setting y equal to zero instead of setting the derivative equal to zero.",
      topic: "Calculus",
      subtopic: "Differentiation",
      family: "calculus fundamentals",
    },
  ];
  const item = choose(variants, index);
  return merge(question, {
    topic: item.topic,
    subtopic: item.subtopic,
    questionText: item.questionText,
    answer: item.answer,
    acceptedAnswers: item.acceptedAnswers,
    shortcutSolution: item.shortcutSolution,
    fullSolution: item.fullSolution,
    commonTrap: item.commonTrap,
    repeatedPattern: item.family,
    patternFamily: item.family,
    tags: ["mathematics", ...roundTag(question), ...finalTag(question)],
    examinerFocus: "State the theorem or condition precisely, then apply it without changing the requested quantity.",
  });
}

function physicsRoundOne(question: SeedQuestion, index: number) {
  const laws = [
    ["Lenz's law", "The induced current flows in a direction that opposes the change in magnetic flux that produced it.", "electromagnetic induction"],
    ["the principle of moments", "For a body in rotational equilibrium, total clockwise moment equals total anticlockwise moment about the same point.", "moments"],
    ["Archimedes' principle", "The upthrust on a body equals the weight of fluid displaced by the body.", "fluids"],
    ["conservation of momentum", "The total momentum of an isolated system remains constant.", "mechanics"],
  ] as const;
  const [name, statement, family] = choose(laws, index);
  return merge(question, {
    topic: "Physical Laws",
    subtopic: name,
    questionText: `State ${name} precisely and name one condition needed for its correct application.`,
    answer: statement,
    acceptedAnswers: [statement.replace(/\.$/, "")],
    shortcutSolution: "State the physical rule and attach its system condition.",
    fullSolution: `${statement} The condition must match the law, such as an isolated system, equilibrium, or the specified inducing change.`,
    commonTrap: "Quoting a formula without the direction, system condition, or conservation idea.",
    repeatedPattern: "law statement with condition",
    patternFamily: family,
    tags: ["physics", ...roundTag(question), ...finalTag(question)],
    examinerFocus: "Precise wording, physical condition, and correct direction where applicable.",
  });
}

function chemistryRoundOne(question: SeedQuestion, index: number) {
  const items = [
    [
      "Atomic Structure",
      "Ionization energy",
      "Explain why nitrogen has a higher first ionization energy than oxygen.",
      "Nitrogen has a stable half-filled 2p subshell, while oxygen has paired electrons in one 2p orbital, increasing repulsion and making removal easier.",
      "periodicity",
    ],
    [
      "Rates of Reaction",
      "Catalysis",
      "Explain how a catalyst increases reaction rate without changing the equilibrium yield.",
      "A catalyst provides an alternative pathway with lower activation energy, increasing rate in both directions without changing the equilibrium position.",
      "catalysis",
    ],
    [
      "Chemical Bonding",
      "Molecular shape",
      "State the electron-pair geometry and molecular shape of ammonia.",
      "Ammonia has tetrahedral electron-pair geometry and trigonal pyramidal molecular shape because one electron pair is lone.",
      "VSEPR",
    ],
  ] as const;
  const [topic, subtopic, questionText, answer, family] = choose(items, index);
  return merge(question, {
    topic,
    subtopic,
    questionText,
    answer,
    acceptedAnswers: [],
    shortcutSolution: "Identify the particle-level cause before giving the final statement.",
    fullSolution: answer,
    commonTrap: "Giving an observation without the electronic or energetic explanation behind it.",
    repeatedPattern: "precise chemical explanation",
    patternFamily: family,
    tags: ["chemistry", ...roundTag(question), ...finalTag(question)],
    examinerFocus: "Use chemically precise terminology and connect structure, energy, and observation.",
  });
}

function biologyRoundOne(question: SeedQuestion, index: number) {
  const items = [
    [
      "Nervous System",
      "Action potentials",
      "Explain the physiological significance of the refractory period during transmission of an action potential.",
      "It ensures one-way transmission of impulses and prevents immediate overlapping impulses by limiting rapid re-excitation of the membrane.",
      "nerve transmission",
    ],
    [
      "Excretion",
      "Kidney",
      "Differentiate ultrafiltration from selective reabsorption in the nephron.",
      "Ultrafiltration forces small molecules from blood into Bowman's capsule; selective reabsorption returns useful substances from filtrate to blood.",
      "kidney physiology",
    ],
    [
      "Genetics",
      "Inheritance",
      "Define codominance and give the key feature that distinguishes it from complete dominance.",
      "Codominance occurs when both alleles in a heterozygote are fully expressed; complete dominance masks one allele.",
      "inheritance",
    ],
  ] as const;
  const [topic, subtopic, questionText, answer, family] = choose(items, index);
  return merge(question, {
    topic,
    subtopic,
    questionText,
    answer,
    acceptedAnswers: [],
    shortcutSolution: "State the biological mechanism and the effect it produces.",
    fullSolution: answer,
    commonTrap: "Naming the structure without explaining its function or mechanism.",
    repeatedPattern: "mechanism to function",
    patternFamily: family,
    tags: ["biology", ...roundTag(question), ...finalTag(question)],
    examinerFocus: "Use correct terminology and connect process to physiological significance.",
  });
}

function speedVariant(question: SeedQuestion, index: number) {
  const k = 2 + (index % 9);
  if (question.subject === "MATHEMATICS") {
    const n = 2 + (index % 6);
    return merge(question, {
      topic: "Calculus",
      subtopic: "Logarithmic differentiation",
      questionText: `Find d/dx of ln(${k}x^${n}).`,
      answer: `${n}/x`,
      acceptedAnswers: [`${n}x^-1`, `${n} over x`],
      shortcutSolution: `ln(${k}x^${n}) = constant + ${n}ln x.`,
      fullSolution: `The constant differentiates to zero and d(${n}ln x)/dx = ${n}/x.`,
      commonTrap: "Keeping the constant multiplier as if it changes the derivative.",
      repeatedPattern: "logarithm derivative speed",
      patternFamily: "calculus speed",
      tags: ["mathematics", ...roundTag(question), ...finalTag(question)],
    });
  }
  if (question.subject === "PHYSICS") {
    const focal = 8 + (index % 7);
    const object = focal + Math.ceil(focal / 2);
    return merge(question, {
      topic: "Optics",
      subtopic: "Concave mirrors",
      questionText: `An object is ${object} cm from a concave mirror of focal length ${focal} cm. State the image nature.`,
      answer: "real, inverted and magnified",
      acceptedAnswers: ["real inverted magnified", "real and inverted and enlarged"],
      shortcutSolution: "Object between F and 2F gives a real, inverted, magnified image.",
      fullSolution: "For a concave mirror, an object between the focus and centre of curvature forms a real, inverted, magnified image beyond the centre of curvature.",
      commonTrap: "Calling every real concave-mirror image diminished.",
      repeatedPattern: "image nature from object position",
      patternFamily: "optics speed",
      tags: ["physics", ...roundTag(question), ...finalTag(question)],
    });
  }
  if (question.subject === "CHEMISTRY") {
    return merge(question, {
      topic: "Redox",
      subtopic: "Oxidation states",
      questionText: "What is the average oxidation state of sulfur in S2O3^2-?",
      answer: "+2",
      acceptedAnswers: ["2", "positive two"],
      shortcutSolution: "Let the total oxidation state of sulfur be x: x + 3(-2) = -2.",
      fullSolution: "The two sulfur atoms total +4, so their average oxidation state is +2.",
      commonTrap: "Assuming the two sulfur atoms must have identical individual oxidation states.",
      repeatedPattern: "average oxidation state",
      patternFamily: "redox speed",
      tags: ["chemistry", ...roundTag(question), ...finalTag(question)],
    });
  }
  return merge(question, {
    topic: "Cell Biology",
    subtopic: "Fungal structure",
    questionText: "What polysaccharide forms the main structural component of fungal cell walls?",
    answer: "chitin",
    acceptedAnswers: ["chitin"],
    shortcutSolution: "Fungal cell walls are associated with chitin.",
    fullSolution: "Chitin is the structural polysaccharide in fungal cell walls.",
    commonTrap: "Answering cellulose, which is characteristic of plant cell walls.",
    repeatedPattern: "rapid biological identification",
    patternFamily: "biology speed",
    tags: ["biology", ...roundTag(question), ...finalTag(question)],
  });
}

function potdVariant(question: SeedQuestion, index: number) {
  const k = 2 + (index % 7);
  if (question.subject === "MATHEMATICS") {
    const r = 2 + (index % 5);
    return merge(question, {
      topic: "Calculus",
      subtopic: "Area under a curve",
      questionText: `Find the total area bounded by y = ${r * r} - x^2 and the x-axis. Also state the x-coordinate of the maximum point.`,
      answer: `${(4 * r ** 3) / 3} square units; x = 0`,
      acceptedAnswers: [`${(4 * r ** 3) / 3}, 0`],
      shortcutSolution: `Roots are -${r} and ${r}; use symmetry and integrate 2(${r * r} - x^2) from 0 to ${r}.`,
      fullSolution: `The roots are x = -${r} and x = ${r}. Area = 2 integral_0^${r} (${r * r} - x^2) dx = ${4 * r ** 3}/3 square units. The maximum occurs at x = 0 by symmetry or dy/dx = -2x.`,
      commonTrap: "Forgetting that area is positive or missing the stationary-point part.",
      repeatedPattern: "definite integration with stationary point",
      patternFamily: "calculus synthesis",
      tags: ["mathematics", ...roundTag(question), ...finalTag(question)],
      examinerFocus: "Find intercepts, set limits, integrate exactly, and connect symmetry to a maximum.",
      markingScheme: "10 marks: 2 roots, 2 integral setup, 2 antiderivative, 2 evaluation, 2 maximum point and units.",
    });
  }
  if (question.subject === "PHYSICS") {
    const mass = 2 + (index % 8);
    return merge(question, {
      topic: "Mechanics",
      subtopic: "Inclined plane with friction",
      questionText: `A ${mass} kg block slides down a 37 degree incline. The coefficient of kinetic friction is 0.25. Take sin 37 = 0.60, cos 37 = 0.80 and g = 10 m/s^2. Find the normal reaction, friction, resultant force down the plane, and acceleration.`,
      answer: `${mass * 8} N; ${mass * 2} N; ${mass * 4} N; 4 m/s^2`,
      acceptedAnswers: [`${mass * 8}, ${mass * 2}, ${mass * 4}, 4`],
      shortcutSolution: "N = mg cos theta; friction = mu N; ma = mg sin theta - friction.",
      fullSolution: `N = ${mass}(10)(0.80) = ${mass * 8} N. Friction = 0.25N = ${mass * 2} N. Downslope weight = ${mass}(10)(0.60) = ${mass * 6} N. Resultant = ${mass * 4} N, so a = 4 m/s^2.`,
      commonTrap: "Using the full weight as the normal reaction or adding friction down the plane.",
      repeatedPattern: "rough inclined plane",
      patternFamily: "multi-step mechanics",
      tags: ["physics", ...roundTag(question), ...finalTag(question)],
      examinerFocus: "Resolve forces perpendicular and parallel to the plane before applying Newton's second law.",
      markingScheme: "10 marks: 2 normal reaction, 2 friction, 2 weight component, 2 resultant, 2 acceleration and units.",
    });
  }
  if (question.subject === "CHEMISTRY") {
    const cBase = 0.10 + (index % 4) * 0.05;
    const vBase = 20 + k;
    const moles = cBase * vBase / 1000;
    const cAcid = 0.10;
    const vAcid = (moles / cAcid) * 1000;
    return merge(question, {
      topic: "Stoichiometry",
      subtopic: "Acid-base titration",
      questionText: `${vBase.toFixed(1)} cm^3 of ${cBase.toFixed(2)} mol/dm^3 NaOH is neutralized by ${cAcid.toFixed(2)} mol/dm^3 HCl. Calculate the amount of NaOH and the required volume of HCl.`,
      answer: `${moles.toFixed(4)} mol; ${vAcid.toFixed(1)} cm^3`,
      acceptedAnswers: [`${moles.toFixed(4)}, ${vAcid.toFixed(1)}`],
      shortcutSolution: "Convert cm3 to dm3, use n = cV, then the 1:1 mole ratio.",
      fullSolution: `NaOH + HCl -> NaCl + H2O. Amount NaOH = ${cBase.toFixed(2)} x ${vBase.toFixed(1)}/1000 = ${moles.toFixed(4)} mol. HCl volume = n/c = ${moles.toFixed(4)}/${cAcid.toFixed(2)} = ${(vAcid / 1000).toFixed(4)} dm3 = ${vAcid.toFixed(1)} cm3.`,
      commonTrap: "Using cm3 directly as dm3 or reversing the concentration-volume calculation.",
      repeatedPattern: "titration stoichiometry",
      patternFamily: "acid-base calculations",
      tags: ["chemistry", ...roundTag(question), ...finalTag(question)],
      examinerFocus: "Balance the equation, convert volume units, apply mole ratio, and report volume correctly.",
      markingScheme: "10 marks: 2 equation, 2 conversion, 2 NaOH amount, 2 mole ratio, 2 HCl volume and unit.",
    });
  }
  const q = (index % 9 + 1) / 100;
  const p = 1 - q;
  const carriers = 2 * p * q * 100;
  return merge(question, {
    topic: "Genetics",
    subtopic: "Hardy-Weinberg equilibrium",
    questionText: `At Hardy-Weinberg equilibrium, the recessive allele frequency q is ${q.toFixed(2)}. Calculate p, the affected percentage, and the healthy carrier percentage.`,
    answer: `p=${p.toFixed(2)}; affected=${(q * q * 100).toFixed(2)}%; carriers=${carriers.toFixed(2)}%`,
    acceptedAnswers: [`${p.toFixed(2)}, ${(q * q * 100).toFixed(2)}%, ${carriers.toFixed(2)}%`],
    shortcutSolution: "Use p = 1 - q, affected = q^2, and carriers = 2pq.",
    fullSolution: `p = 1 - ${q.toFixed(2)} = ${p.toFixed(2)}. Affected frequency = q^2 = ${(q * q).toFixed(4)} = ${(q * q * 100).toFixed(2)}%. Carrier frequency = 2pq = ${(2 * p * q).toFixed(4)} = ${carriers.toFixed(2)}%.`,
    commonTrap: "Reporting q itself as the affected frequency or omitting the factor 2 for heterozygotes.",
    repeatedPattern: "allele to genotype frequencies",
    patternFamily: "population genetics",
    tags: ["biology", ...roundTag(question), ...finalTag(question)],
    examinerFocus: "Distinguish allele frequency from homozygous and heterozygous genotype frequencies.",
    markingScheme: "10 marks: 2 p, 2 q squared, 2 affected percentage, 3 carrier percentage, 1 interpretation.",
  });
}

function trueFalseVariant(question: SeedQuestion, index: number) {
  type TrueFalseItem = readonly [string, "True" | "False", string, string];
  const math: readonly TrueFalseItem[] = [
    ["The function f(x) = |x| is differentiable at x = 0.", "False", "It has a cusp; the left and right derivatives differ.", "Assuming continuity is sufficient for differentiability."],
    ["Opposite angles of every cyclic quadrilateral are supplementary.", "True", "Opposite angles in a cyclic quadrilateral sum to 180 degrees.", "Confusing supplementary with equal."],
  ] as const;
  const physics: readonly TrueFalseItem[] = [
    ["In a uniform gravitational field with no air resistance, projectile motion follows a parabolic path.", "True", "Horizontal velocity is constant while vertical displacement is quadratic in time.", "Thinking the path must be circular because velocity direction changes."],
    ["At terminal velocity, the weight of a falling object is zero.", "False", "The resultant force is zero; weight is balanced by drag but still exists.", "Confusing zero resultant force with zero weight."],
  ] as const;
  const chemistry: readonly TrueFalseItem[] = [
    ["A catalyst increases product yield at equilibrium.", "False", "It increases the rate of reaching equilibrium, not the equilibrium position.", "Equating faster reaction with more equilibrium product."],
    ["Increasing temperature always increases the value of an exothermic reaction's equilibrium constant.", "False", "For an exothermic reaction, increasing temperature shifts equilibrium toward reactants and lowers K.", "Treating rate effects and equilibrium effects as the same."],
  ] as const;
  const biology: readonly TrueFalseItem[] = [
    ["All arteries carry oxygen-rich blood away from the heart.", "False", "Arteries carry blood away from the heart; the pulmonary artery carries deoxygenated blood.", "Defining arteries by oxygen content instead of direction."],
    ["The refractory period helps ensure one-way transmission of an action potential along an axon.", "True", "Recently depolarized membrane cannot immediately fire again, so the impulse moves forward.", "Treating the refractory period as a delay with no directional function."],
  ] as const;
  const catalog = question.subject === "MATHEMATICS" ? math : question.subject === "PHYSICS" ? physics : question.subject === "CHEMISTRY" ? chemistry : biology;
  const [statement, answer, explanation, trap] = choose(catalog, index);
  return merge(question, {
    topic: question.subject === "MATHEMATICS" ? "Conceptual Precision" : question.subject === "PHYSICS" ? "Conceptual Physics" : question.subject === "CHEMISTRY" ? "Chemical Precision" : "Biological Precision",
    subtopic: "True or False traps",
    questionText: `True or False: ${statement}`,
    answer,
    acceptedAnswers: [answer === "True" ? "T" : "F"],
    shortcutSolution: answer === "True" ? "The qualifier is valid under the stated condition." : "The qualifier overstates or misdefines the concept.",
    fullSolution: `${answer}. ${explanation}`,
    commonTrap: trap,
    repeatedPattern: "qualifier-based conceptual trap",
    patternFamily: "conceptual landmines",
    tags: [question.subject.toLowerCase(), ...roundTag(question), ...finalTag(question)],
  });
}

function ghanaVariant(question: SeedQuestion, index: number) {
  if (question.roundType === "RIDDLE") return riddleVariant(question, index, true);
  const k = 2 + (index % 8);
  if (question.subject === "MATHEMATICS") {
    if (question.roundType === "ROUND_ONE") {
      return merge(question, {
        topic: "Geometry",
        subtopic: "Kente symmetry",
        questionText: "A square kente motif is rotated through 90 degrees about its centre and still matches itself. State the order of rotational symmetry of the square and explain what the order means.",
        answer: "4; it matches itself four times in a full turn.",
        acceptedAnswers: ["4", "order 4"],
        shortcutSolution: "A square matches at 90, 180, 270, and 360 degrees.",
        fullSolution: "The order of rotational symmetry is the number of times the figure coincides with itself in 360 degrees. A square does this four times.",
        commonTrap: "Counting only turns before 360 degrees and reporting 3.",
        repeatedPattern: "rotational symmetry order",
        patternFamily: "ghana geometry",
        tags: ["ghana-context", "kente", ...roundTag(question), ...finalTag(question)],
        examinerFocus: "Connect a Ghanaian design context to the formal definition of rotational symmetry.",
      });
    }
    if (question.roundType === "SPEED_RACE") {
      return merge(question, {
        topic: "Sequences and Series",
        subtopic: "Kente repeating patterns",
        questionText: `A kente colour motif repeats every ${k} strips. Which motif position matches strip ${k * 3 + 2}?`,
        answer: "2",
        acceptedAnswers: ["second", "position 2"],
        shortcutSolution: `Use remainder after division by ${k}; ${k * 3 + 2} leaves remainder 2.`,
        fullSolution: `The repeated cycle has length ${k}. Strip ${k * 3 + 2} is in the same position as strip 2 of the cycle.`,
        commonTrap: "Giving the number of full cycles instead of the position in the cycle.",
        repeatedPattern: "modular position in a repeating design",
        patternFamily: "ghana sequences",
        tags: ["ghana-context", "kente", ...roundTag(question), ...finalTag(question)],
      });
    }
    if (question.roundType === "PROBLEM_OF_THE_DAY") {
      const first = 18 + k;
      const d = 3 + (index % 4);
      const n = 12 + (index % 6);
      const last = first + (n - 1) * d;
      const sum = (n * (first + last)) / 2;
      return merge(question, {
        topic: "Sequences and Series",
        subtopic: "Kente production pattern",
        questionText: `A weaving club records ${first} finished strips in week 1 and increases production by ${d} strips each week. Find week ${n}'s production and the total production for the first ${n} weeks.`,
        answer: `${last} strips; ${sum} strips`,
        acceptedAnswers: [`${last}, ${sum}`],
        shortcutSolution: "Model the data as an arithmetic progression.",
        fullSolution: `a_n = ${first} + (${n} - 1)${d} = ${last}. S_n = ${n}(${first} + ${last})/2 = ${sum}.`,
        commonTrap: "Using n differences instead of n - 1 for the nth term.",
        repeatedPattern: "AP term and sum in Ghanaian design context",
        patternFamily: "ghana sequences",
        tags: ["ghana-context", "kente", ...roundTag(question), ...finalTag(question)],
        examinerFocus: "Translate the production pattern into an arithmetic progression and calculate both term and sum.",
        markingScheme: "10 marks: 2 model, 3 nth term, 3 sum setup, 1 calculation accuracy, 1 units.",
      });
    }
    return merge(question, {
      topic: "Geometry",
      subtopic: "Adinkra symmetry",
      questionText: "True or False: A design with exactly two perpendicular mirror lines must have rotational symmetry of order 4.",
      answer: "False",
      acceptedAnswers: ["F"],
      shortcutSolution: "Two mirror lines do not force four quarter-turn matches.",
      fullSolution: "False. Two perpendicular mirror lines guarantee a half-turn symmetry in many cases, but quarter-turn symmetry requires additional matching.",
      commonTrap: "Assuming any perpendicular mirrors create square-like symmetry.",
      repeatedPattern: "symmetry condition versus sufficient condition",
      patternFamily: "ghana geometry landmines",
      tags: ["ghana-context", "adinkra", ...roundTag(question), ...finalTag(question)],
    });
  }
  if (question.subject === "PHYSICS") {
    if (question.roundType === "ROUND_ONE") {
      return merge(question, {
        topic: "Energy",
        subtopic: "Akosombo hydroelectric power",
        questionText: "State the main energy conversions in hydroelectric power generation at a dam such as Akosombo.",
        answer: "gravitational potential energy to kinetic energy to mechanical energy to electrical energy",
        acceptedAnswers: ["potential to kinetic to mechanical to electrical"],
        shortcutSolution: "Water falls, spins turbines, then generators produce electricity.",
        fullSolution: "Stored water has gravitational potential energy. As it falls it gains kinetic energy, turns turbines as mechanical energy, and generators convert that to electrical energy.",
        commonTrap: "Saying water is converted directly to electricity without the turbine-generator stages.",
        repeatedPattern: "energy conversion chain",
        patternFamily: "ghana energy",
        tags: ["ghana-context", "Akosombo", ...roundTag(question), ...finalTag(question)],
        examinerFocus: "Name each stage of the conversion chain in order.",
      });
    }
    if (question.roundType === "SPEED_RACE") {
      return merge(question, {
        topic: "Mechanics",
        subtopic: "Trotro motion",
        questionText: `A trotro covers ${k * 120} m in ${k * 10} s. Find its average speed.`,
        answer: "12 m/s",
        acceptedAnswers: ["12", "12m/s"],
        shortcutSolution: "Speed = distance/time.",
        fullSolution: `Average speed = ${k * 120}/${k * 10} = 12 m/s.`,
        commonTrap: "Forgetting that the units are metres per second.",
        repeatedPattern: "average speed",
        patternFamily: "ghana mechanics",
        tags: ["ghana-context", "trotro", ...roundTag(question), ...finalTag(question)],
      });
    }
    if (question.roundType === "PROBLEM_OF_THE_DAY") {
      const flow = 400 + index % 8 * 50;
      const height = 60 + index % 5 * 5;
      const input = flow * 10 * height;
      const output = input * 0.8;
      return merge(question, {
        topic: "Energy",
        subtopic: "Hydroelectric power",
        questionText: `At a hydroelectric station, water falls through ${height} m at ${flow} kg/s. If g = 10 m/s^2 and efficiency is 80%, calculate input power and electrical output power.`,
        answer: `${input} W; ${output} W`,
        acceptedAnswers: [`${input}, ${output}`],
        shortcutSolution: "Power from falling water is mass flow rate times g times height; multiply by efficiency.",
        fullSolution: `Input power = ${flow} x 10 x ${height} = ${input} W. Output power = 0.80 x ${input} = ${output} W.`,
        commonTrap: "Using total mass instead of mass flow rate or applying efficiency twice.",
        repeatedPattern: "mass-flow power with efficiency",
        patternFamily: "ghana hydroelectricity",
        tags: ["ghana-context", "Akosombo", ...roundTag(question), ...finalTag(question)],
        examinerFocus: "Use mass flow rate correctly and apply efficiency once.",
        markingScheme: "10 marks: 3 formula, 2 substitution, 2 input power, 2 efficiency, 1 units.",
      });
    }
    return merge(question, {
      topic: "Heat and Thermodynamics",
      subtopic: "Clay-pot cooling",
      questionText: "True or False: A porous clay pot can cool water because evaporation removes higher-energy molecules from the water.",
      answer: "True",
      acceptedAnswers: ["T"],
      shortcutSolution: "Evaporation removes high-energy molecules.",
      fullSolution: "True. Water seeping to the outer surface evaporates; higher-energy molecules escape and lower the average kinetic energy of the remaining water.",
      commonTrap: "Saying the clay itself creates cold.",
      repeatedPattern: "molecular explanation of evaporative cooling",
      patternFamily: "ghana heat landmines",
      tags: ["ghana-context", "clay-pot", ...roundTag(question), ...finalTag(question)],
    });
  }
  if (question.subject === "CHEMISTRY") {
    if (question.roundType === "ROUND_ONE") {
      return merge(question, {
        topic: "Organic Chemistry",
        subtopic: "Kenkey fermentation",
        questionText: "During souring of kenkey dough, microorganisms produce acids. Name the acid commonly associated with lactic fermentation and state its effect on pH.",
        answer: "lactic acid; it lowers pH",
        acceptedAnswers: ["lactic acid", "2-hydroxypropanoic acid"],
        shortcutSolution: "Lactic fermentation produces lactic acid.",
        fullSolution: "Lactic acid bacteria convert sugars to lactic acid, increasing acidity and lowering the pH of the dough.",
        commonTrap: "Answering ethanol, which is associated with alcoholic fermentation.",
        repeatedPattern: "fermentation product and acidity",
        patternFamily: "ghana fermentation",
        tags: ["ghana-context", "kenkey", ...roundTag(question), ...finalTag(question)],
        examinerFocus: "Connect microbial fermentation to acid production and pH change.",
      });
    }
    if (question.roundType === "SPEED_RACE") {
      return merge(question, {
        topic: "Acids, Bases, and Salts",
        subtopic: "Salt winning",
        questionText: "Which physical process removes water from brine during traditional salt winning?",
        answer: "evaporation",
        acceptedAnswers: ["evaporation"],
        shortcutSolution: "Sunlight removes water as vapour.",
        fullSolution: "Evaporation removes water from brine, concentrating salts until crystallisation can occur.",
        commonTrap: "Calling the water-removal step filtration.",
        repeatedPattern: "separation process identification",
        patternFamily: "ghana separation chemistry",
        tags: ["ghana-context", "salt winning", ...roundTag(question), ...finalTag(question)],
      });
    }
    if (question.roundType === "PROBLEM_OF_THE_DAY") {
      const mass = 0.05 + (index % 5) * 0.01;
      const input = mass * 30;
      const useful = input * 0.8;
      return merge(question, {
        topic: "Thermochemistry",
        subtopic: "Charcoal stove efficiency",
        questionText: `A charcoal stove burns ${mass.toFixed(2)} kg of charcoal. Charcoal releases 30 MJ/kg and ${useful.toFixed(2)} MJ reaches the pot. Calculate the chemical energy input and stove efficiency.`,
        answer: `${input.toFixed(2)} MJ; 80%`,
        acceptedAnswers: [`${input.toFixed(2)}, 80`],
        shortcutSolution: "Input energy is mass times energy per kg; efficiency is useful/input.",
        fullSolution: `Input = ${mass.toFixed(2)} x 30 = ${input.toFixed(2)} MJ. Efficiency = ${useful.toFixed(2)}/${input.toFixed(2)} x 100 = 80%.`,
        commonTrap: "Dividing input by useful energy rather than useful by input.",
        repeatedPattern: "fuel energy and efficiency",
        patternFamily: "ghana thermochemistry",
        tags: ["ghana-context", "charcoal", ...roundTag(question), ...finalTag(question)],
        examinerFocus: "Distinguish chemical energy supplied from useful heat transferred.",
        markingScheme: "10 marks: 3 energy input, 3 efficiency setup, 2 calculation, 1 percentage, 1 interpretation.",
      });
    }
    return merge(question, {
      topic: "Rates of Reaction",
      subtopic: "Cocoa fermentation",
      questionText: "True or False: Cocoa fermentation involves microbial activity and can generate heat.",
      answer: "True",
      acceptedAnswers: ["T"],
      shortcutSolution: "Fermentation is microbial and exothermic processes can release heat.",
      fullSolution: "True. Microorganisms metabolise cocoa pulp components, and the biochemical activity can release heat.",
      commonTrap: "Treating fermentation as simple drying by sunlight.",
      repeatedPattern: "microbial process qualifier",
      patternFamily: "ghana fermentation landmines",
      tags: ["ghana-context", "cocoa", ...roundTag(question), ...finalTag(question)],
    });
  }
  if (question.roundType === "ROUND_ONE") {
    return merge(question, {
      topic: "Reproduction",
      subtopic: "Mosquito life cycle",
      questionText: "Name the four stages in the mosquito life cycle and identify the stage immediately before the adult.",
      answer: "egg, larva, pupa, adult; pupa",
      acceptedAnswers: ["egg larva pupa adult", "pupa"],
      shortcutSolution: "Mosquitoes undergo complete metamorphosis.",
      fullSolution: "The mosquito life cycle is egg, larva, pupa, adult. The pupa comes immediately before the adult.",
      commonTrap: "Omitting the pupal stage.",
      repeatedPattern: "complete metamorphosis stages",
      patternFamily: "ghana malaria biology",
      tags: ["ghana-context", "mosquito", "malaria", ...roundTag(question), ...finalTag(question)],
      examinerFocus: "Link life-cycle knowledge to malaria-vector control.",
    });
  }
  if (question.roundType === "SPEED_RACE") {
    return merge(question, {
      topic: "Reproduction",
      subtopic: "Mosquito life cycle",
      questionText: "Which mosquito life-cycle stage comes immediately before the adult?",
      answer: "pupa",
      acceptedAnswers: ["pupal stage"],
      shortcutSolution: "Egg, larva, pupa, adult.",
      fullSolution: "Mosquitoes undergo complete metamorphosis, and the pupa develops into the adult.",
      commonTrap: "Answering larva and skipping the pupal stage.",
      repeatedPattern: "life-cycle order",
      patternFamily: "ghana malaria biology",
      tags: ["ghana-context", "mosquito", "malaria", ...roundTag(question), ...finalTag(question)],
    });
  }
  if (question.roundType === "PROBLEM_OF_THE_DAY") {
    return merge(question, {
      topic: "Ecology",
      subtopic: "Mosquito control",
      questionText: "A community removes 60% of mosquito breeding containers. The remaining containers produce 50% more larvae each because competition falls. Assuming adult survival is unchanged, estimate the percentage change in adult mosquito production.",
      answer: "40% decrease",
      acceptedAnswers: ["decreases by 40%", "-40%"],
      shortcutSolution: "Remaining production is 0.40 x 1.50 = 0.60 of the original.",
      fullSolution: "After removal, 40% of containers remain. Compensation makes each remaining site produce 1.5 times as many larvae, so total production is 0.40 x 1.50 = 0.60 of baseline. This is a 40% decrease.",
      commonTrap: "Subtracting 50% from 60% and claiming a 10% reduction.",
      repeatedPattern: "multiplicative ecological intervention",
      patternFamily: "ghana malaria ecology",
      tags: ["ghana-context", "mosquito", "malaria", ...roundTag(question), ...finalTag(question)],
      examinerFocus: "Model density-dependent compensation multiplicatively, not additively.",
      markingScheme: "10 marks: 3 remaining fraction, 3 compensation factor, 2 combined production, 2 percentage change.",
    });
  }
  return merge(question, {
    topic: "Plant Biology",
    subtopic: "Harmattan and transpiration",
    questionText: "True or False: Harmattan conditions can increase transpiration when dry air steepens the water-vapour gradient from leaf to atmosphere.",
    answer: "True",
    acceptedAnswers: ["T"],
    shortcutSolution: "Lower humidity outside the leaf increases the diffusion gradient.",
    fullSolution: "True. Dry air lowers external water-vapour concentration, so water vapour diffuses out more steeply if stomata remain open.",
    commonTrap: "Assuming cooler weather always reduces transpiration.",
    repeatedPattern: "environmental factor affecting transpiration",
    patternFamily: "ghana plant biology landmines",
    tags: ["ghana-context", "harmattan", ...roundTag(question), ...finalTag(question)],
  });
}

export function enhanceGeneratedQuestion(question: SeedQuestion, index: number): SeedQuestion {
  if (question.isGhanaContext) return ghanaVariant(question, index);
  if (question.roundType === "RIDDLE") return riddleVariant(question, index);
  if (question.roundType === "ROUND_ONE") {
    if (question.subject === "MATHEMATICS") return mathRoundOne(question, index);
    if (question.subject === "PHYSICS") return physicsRoundOne(question, index);
    if (question.subject === "CHEMISTRY") return chemistryRoundOne(question, index);
    return biologyRoundOne(question, index);
  }
  if (question.roundType === "SPEED_RACE") return speedVariant(question, index);
  if (question.roundType === "PROBLEM_OF_THE_DAY") return potdVariant(question, index);
  if (question.roundType === "TRUE_FALSE") return trueFalseVariant(question, index);
  return question;
}
