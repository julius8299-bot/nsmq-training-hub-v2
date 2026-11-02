import { baseQuestion, riddleClues, type RoundType, type SeedQuestion } from "./question-factory";

type Subject = SeedQuestion["subject"];
type QuestionData = Omit<
  SeedQuestion,
  | "subject"
  | "roundType"
  | "difficulty"
  | "timeLimitSeconds"
  | "encouragement"
  | "ghanaContext"
  | "isGhanaContext"
  | "sourceType"
  | "permissionStatus"
  | "isPastQuestion"
  | "isPrivateOnly"
>;

function finalQuestion(
  subject: Subject,
  roundType: RoundType,
  index: number,
  data: QuestionData,
  ghanaContext = false,
) {
  return baseQuestion(subject, roundType, 15 + index * 20, ghanaContext, data);
}

const advanced: SeedQuestion[] = [];

for (let i = 0; i < 10; i += 1) {
  const k = 2 + i;
  advanced.push(
    finalQuestion("MATHEMATICS", "ROUND_ONE", i, {
      topic: "Vectors",
      subtopic: "Perpendicular vectors",
      questionText: `State the necessary and sufficient condition for two non-zero vectors u and v to be perpendicular, then verify it for u = (${k}, 1) and v = (1, -${k}).`,
      answer: "u dot v = 0; the given vectors are perpendicular",
      acceptedAnswers: ["their dot product is zero", "u.v=0", "u · v = 0"],
      shortcutSolution: `Perpendicular vectors have zero dot product: ${k}(1) + 1(-${k}) = 0.`,
      fullSolution: "Two non-zero vectors are perpendicular if and only if their scalar product is zero. The stated components give equal and opposite products, so the condition is satisfied.",
      commonTrap: "Checking equal magnitudes instead of the dot product.",
      repeatedPattern: "necessary and sufficient vector condition",
      patternFamily: "vector reasoning",
      tags: ["vectors", "perpendicular", "final-level"],
      examinerFocus: "State a theorem precisely and apply it to components.",
    }),
    finalQuestion("MATHEMATICS", "SPEED_RACE", i, {
      topic: "Calculus",
      subtopic: "Logarithmic differentiation",
      questionText: `Find d/dx of ln(${k}x^${k}).`,
      answer: `${k}/x`,
      acceptedAnswers: [`${k}x^-1`, `${k} over x`],
      shortcutSolution: `ln(${k}x^${k}) = constant + ${k}ln x.`,
      fullSolution: `Differentiate constant + ${k}ln x to obtain ${k}/x.`,
      commonTrap: "Keeping the constant multiplier inside the derivative.",
      repeatedPattern: "differentiate logarithm of a monomial",
      patternFamily: "calculus speed",
      tags: ["calculus", "logarithms", "speed-race", "wrong-answer-minus-one"],
    }),
  );

  const r = 2 + (i % 5);
  const area = (4 * r ** 3) / 3;
  advanced.push(
    finalQuestion("MATHEMATICS", "PROBLEM_OF_THE_DAY", i, {
      topic: "Calculus",
      subtopic: "Definite integration",
      questionText: `Find the total area bounded by y = ${r ** 2} - x^2 and the x-axis. Give an exact answer.`,
      answer: `${4 * r ** 3}/3 square units`,
      acceptedAnswers: [`${area} square units`, String(area)],
      shortcutSolution: `The curve is symmetric. Integrate 2(${r ** 2} - x^2) from 0 to ${r}.`,
      fullSolution: `The roots are x = -${r} and x = ${r}. Area = integral from -${r} to ${r} of (${r ** 2} - x^2) dx = 2[${r ** 2}x - x^3/3]_0^${r} = ${4 * r ** 3}/3 square units.`,
      commonTrap: "Integrating between the roots but forgetting that area must be positive, or omitting symmetry.",
      repeatedPattern: "area under a symmetric parabola",
      patternFamily: "definite integration",
      tags: ["calculus", "POTD", "10-mark", "final-level"],
      examinerFocus: "Find intercepts, set correct limits, exploit symmetry, and evaluate exactly.",
      markingScheme: "2 marks roots; 2 marks correct definite integral; 2 marks antiderivative; 3 marks evaluation; 1 mark units.",
    }),
    finalQuestion("MATHEMATICS", "TRUE_FALSE", i, {
      topic: "Calculus",
      subtopic: "Differentiability",
      questionText: `True or False: The function f(x) = |x - ${k}| is differentiable at x = ${k}.`,
      answer: "False",
      acceptedAnswers: ["F"],
      shortcutSolution: "An absolute-value vertex is a cusp.",
      fullSolution: `False. The left derivative is -1 and the right derivative is +1 at x = ${k}, so the derivative does not exist there.`,
      commonTrap: "Assuming continuity is sufficient for differentiability.",
      repeatedPattern: "continuity versus differentiability",
      patternFamily: "calculus precision",
      tags: ["true-false", "cusp", "final-level"],
    }),
  );
}

const mathRiddles = [
  ["derivative", ["I describe an instantaneous rate rather than an average over an interval.", "I arise as a limit of a difference quotient.", "At a point, I give the gradient of the tangent to a curve.", "Differentiation is the operation used to obtain me."]],
  ["determinant", ["I assign a scalar to a square matrix.", "My vanishing signals loss of invertibility.", "In two dimensions I scale oriented area.", "For a 2 by 2 matrix, I am ad minus bc."]],
  ["standard deviation", ["I am unchanged when the same constant is added to every observation.", "I share the units of the original data.", "I am the square root of a mean squared deviation.", "I measure spread about the mean."]],
  ["inverse function", ["I exist only when the original mapping is one-to-one on its chosen domain.", "My graph is reflected across y = x.", "Composing me with my partner returns the input.", "I reverse the action of a function."]],
  ["scalar product", ["I combine two vectors but return a number.", "My sign distinguishes acute from obtuse separation.", "I contain the cosine of the angle between vectors.", "I vanish for perpendicular non-zero vectors."]],
  ["logarithm", ["I turn multiplication into addition.", "My base must be positive and not equal to one.", "I answer the question: to what power?", "I am the inverse operation of exponentiation."]],
  ["gradient", ["I am undefined for a vertical straight line.", "My sign indicates whether a line rises or falls.", "I am change in ordinate divided by change in abscissa.", "I measure the slope of a line."]],
  ["arithmetic progression", ["Successive terms differ by a constant.", "My nth term is linear in n.", "My finite sum can pair first and last terms.", "I am a sequence with a common difference."]],
  ["conditional probability", ["My sample space is reduced by known information.", "I appear in multiplication rules and Bayes' theorem.", "My notation places one event after a vertical bar.", "I measure the chance of A given B."]],
  ["tangent", ["I meet a smooth curve locally without crossing being required.", "At a circle I am perpendicular to the radius at contact.", "My gradient can equal a derivative.", "I touch a circle at one point."]],
] as const;

mathRiddles.forEach(([answer, clues], i) => {
  advanced.push(finalQuestion("MATHEMATICS", "RIDDLE", i, {
    topic: "Mathematical Reasoning",
    subtopic: "Concept identification",
    questionText: "Who am I?",
    answer,
    acceptedAnswers: [`a ${answer}`, `the ${answer}`],
    shortcutSolution: `Link the strongest defining property to ${answer}.`,
    fullSolution: `All clues are necessary properties of ${answer}; the earlier clues distinguish it from nearby mathematical ideas.`,
    commonTrap: "Choosing a related operation rather than the object described by every clue.",
    repeatedPattern: "layered mathematical definition",
    patternFamily: "final-level riddles",
    tags: ["riddle", "mathematics", "final-level"],
    riddleClues: riddleClues([...clues]),
  }));
});

const physicsLaws = [
  ["Lenz's law", "The induced current flows in a direction that opposes the change in magnetic flux producing it."],
  ["Gauss's law", "The electric flux through a closed surface equals enclosed charge divided by permittivity."],
  ["Archimedes' principle", "The upthrust equals the weight of fluid displaced."],
  ["principle of moments", "For equilibrium, total clockwise moment equals total anticlockwise moment about a point."],
  ["conservation of momentum", "Total momentum of an isolated system remains constant."],
  ["Snell's law", "For two media, the ratio of sine of incidence to sine of refraction is constant."],
  ["first law of thermodynamics", "Heat supplied equals increase in internal energy plus work done by the system."],
  ["Coulomb's law", "Electrostatic force is proportional to the product of charges and inversely proportional to separation squared."],
  ["Faraday's law", "Induced emf equals the negative rate of change of magnetic flux linkage."],
  ["Bernoulli's principle", "Along a streamline, pressure, kinetic, and gravitational energy per unit volume have constant sum."],
] as const;

physicsLaws.forEach(([name, statement], i) => {
  advanced.push(finalQuestion("PHYSICS", "ROUND_ONE", i, {
    topic: "Physical Laws",
    subtopic: name,
    questionText: `State ${name} precisely and identify the condition under which it applies.`,
    answer: statement,
    acceptedAnswers: [statement.replace(/\.$/, "")],
    shortcutSolution: "Name the conserved quantity or opposing effect, then state the required system condition.",
    fullSolution: `${statement} The statement must be paired with its stated closed-system, equilibrium, streamline, or material assumptions where relevant.`,
    commonTrap: "Giving only a formula without its physical condition or direction.",
    repeatedPattern: "state law with condition",
    patternFamily: "conceptual physics",
    tags: ["physics law", "fundamentals", "final-level"],
    examinerFocus: "Precise language, direction, and conditions of validity.",
  }));
});

for (let i = 0; i < 10; i += 1) {
  const focal = 10 + i;
  const object = focal + Math.ceil(focal / 2);
  advanced.push(
    finalQuestion("PHYSICS", "SPEED_RACE", i, {
      topic: "Optics",
      subtopic: "Concave mirrors",
      questionText: `An object is ${object} cm from a concave mirror of focal length ${focal} cm. State the nature of the image.`,
      answer: "real, inverted and magnified",
      acceptedAnswers: ["real and inverted and magnified", "real inverted enlarged"],
      shortcutSolution: "The object lies between F and 2F.",
      fullSolution: "An object between the principal focus and centre of curvature forms a real, inverted, magnified image beyond 2F.",
      commonTrap: "Calling every concave-mirror image diminished.",
      repeatedPattern: "image nature from object position",
      patternFamily: "geometrical optics",
      tags: ["optics", "speed-race", "wrong-answer-minus-one"],
    }),
    finalQuestion("PHYSICS", "PROBLEM_OF_THE_DAY", i, {
      topic: "Mechanics",
      subtopic: "Inclined plane with friction",
      questionText: `A ${2 + i} kg block slides down a 37 degree incline. The coefficient of kinetic friction is 0.25. Take sin 37 = 0.60, cos 37 = 0.80, and g = 10 m/s^2. Find the normal reaction, frictional force, resultant force down the plane, and acceleration.`,
      answer: `${(2 + i) * 8} N; ${(2 + i) * 2} N; ${(2 + i) * 4} N; 4 m/s^2`,
      acceptedAnswers: [`${(2 + i) * 8}, ${(2 + i) * 2}, ${(2 + i) * 4}, 4`],
      shortcutSolution: "N = mg cos theta; friction = mu N; ma = mg sin theta - friction.",
      fullSolution: `N = ${(2 + i)}(10)(0.80) = ${(2 + i) * 8} N. Friction = 0.25N = ${(2 + i) * 2} N. Downslope weight is ${(2 + i)}(10)(0.60) = ${(2 + i) * 6} N, so resultant = ${(2 + i) * 4} N and a = 4 m/s^2.`,
      commonTrap: "Using the full weight as the normal reaction or adding friction to the downslope component.",
      repeatedPattern: "resolve forces on rough incline",
      patternFamily: "multi-step mechanics",
      tags: ["POTD", "forces", "10-mark", "final-level"],
      examinerFocus: "Resolve perpendicular and parallel components before applying Newton's second law.",
      markingScheme: "2 marks normal reaction; 2 marks friction; 2 marks downslope component; 2 marks resultant; 2 marks acceleration and units.",
    }),
    finalQuestion("PHYSICS", "TRUE_FALSE", i, {
      topic: "Mechanics",
      subtopic: "Projectile motion",
      questionText: `True or False: In a uniform gravitational field with negligible air resistance, a projectile launched at any non-vertical angle follows a parabolic path.`,
      answer: "True",
      acceptedAnswers: ["T"],
      shortcutSolution: "Horizontal motion is uniform while vertical displacement is quadratic in time.",
      fullSolution: "True. Eliminating time between constant horizontal velocity and uniformly accelerated vertical motion gives a quadratic relation between y and x.",
      commonTrap: "Assuming the path is circular because gravity continually changes the velocity direction.",
      repeatedPattern: "qualifiers in projectile motion",
      patternFamily: "conceptual landmines",
      tags: ["true-false", "projectile", "final-level"],
    }),
  );
}

const physicsRiddles = [
  ["electron", ["I am a lepton with spin one-half.", "My antiparticle has the same mass but opposite charge.", "My elementary charge is negative.", "I occupy atomic orbitals outside the nucleus."]],
  ["magnetic flux", ["I depend on field strength, area, and orientation.", "My SI unit is the weber.", "My rate of change can induce an emf.", "For a uniform field I include a cosine factor."]],
  ["critical angle", ["I exist only when light travels toward a less optically dense medium.", "At my value the refracted ray is ninety degrees to the normal.", "Beyond me total internal reflection occurs.", "My sine equals the refractive-index ratio n2/n1."]],
  ["capacitance", ["I measure stored charge per potential difference.", "Geometry and dielectric material determine me.", "My SI unit is the farad.", "For parallel plates I increase with area and decrease with separation."]],
  ["escape velocity", ["I neglect atmospheric resistance and later propulsion.", "I is independent of the projectile mass.", "My square is proportional to GM/R.", "At least this launch speed permits reaching infinity with zero final speed."]],
  ["resonance", ["I occur when a driving frequency matches a natural frequency.", "Energy transfer to an oscillator is then especially effective.", "Damping limits my amplitude.", "Musical instruments and bridges can display me."]],
  ["viscosity", ["I represent internal resistance to fluid flow.", "Temperature affects me differently in liquids and gases.", "I appear in Stokes' law.", "I is often described as fluid friction."]],
  ["half-life", ["I am statistically stable for a radioactive nuclide.", "After each interval equal to me, half the undecayed nuclei remain.", "I do not depend on the initial sample size.", "I characterize exponential radioactive decay."]],
  ["electromotive force", ["I am energy supplied per unit charge by a source.", "My unit is the volt although I am not a force.", "Terminal voltage may be less than me under load.", "Internal resistance explains that difference."]],
  ["moment of a force", ["I depend on force and perpendicular distance from a pivot.", "My rotational effect has clockwise or anticlockwise sense.", "Equilibrium requires my algebraic sum to vanish.", "My SI unit is newton metre."]],
] as const;

physicsRiddles.forEach(([answer, clues], i) => advanced.push(finalQuestion("PHYSICS", "RIDDLE", i, {
  topic: "Physics Concepts",
  subtopic: "Layered identification",
  questionText: "Who am I?",
  answer,
  acceptedAnswers: [`an ${answer}`, `the ${answer}`],
  shortcutSolution: `Use the unit, governing law, and defining relationship to identify ${answer}.`,
  fullSolution: `Each clue gives a distinct physical property of ${answer}, with the final clue providing the most accessible identification.`,
  commonTrap: "Selecting a related unit or effect rather than the physical quantity itself.",
  repeatedPattern: "layered physical definition",
  patternFamily: "final-level riddles",
  tags: ["riddle", "physics", "final-level"],
  riddleClues: riddleClues([...clues]),
})));

const chemistryFundamentals = [
  ["Atomic Structure", "Ionization energy", "Explain why nitrogen has a higher first ionization energy than oxygen.", "Nitrogen has a stable half-filled 2p subshell, while oxygen has paired 2p electrons whose repulsion makes removal easier."],
  ["Chemical Bonding", "Molecular shape", "State the electron-pair geometry and molecular shape of ammonia.", "Tetrahedral electron-pair geometry and trigonal pyramidal molecular shape."],
  ["Periodicity", "Atomic radius", "Explain why atomic radius generally decreases across Period 3.", "Nuclear charge increases while shielding changes little, so effective nuclear attraction draws electrons closer."],
  ["Equilibrium", "Le Chatelier principle", "State how increasing pressure affects a gaseous equilibrium with fewer product gas moles.", "It shifts equilibrium toward the product side with fewer gas molecules."],
  ["Electrochemistry", "Standard cells", "Define standard electrode potential.", "The emf of a half-cell relative to the standard hydrogen electrode under standard conditions."],
  ["Organic Chemistry", "Isomerism", "Differentiate structural isomerism from stereoisomerism.", "Structural isomers differ in connectivity; stereoisomers have the same connectivity but differ in spatial arrangement."],
  ["Rates of Reaction", "Activation energy", "Explain how a catalyst increases reaction rate.", "It provides an alternative pathway with lower activation energy, increasing the successful-collision fraction."],
  ["Thermochemistry", "Enthalpy", "State Hess's law.", "The enthalpy change of a reaction is independent of route and depends only on initial and final states."],
  ["Acids, Bases, and Salts", "Buffers", "Explain how an acidic buffer resists added alkali.", "Its weak acid supplies hydrogen ions that neutralize added hydroxide ions, forming water and conjugate base."],
  ["Redox", "Oxidation numbers", "State the oxidation-number definitions of oxidation and reduction.", "Oxidation is an increase and reduction is a decrease in oxidation number."],
] as const;

chemistryFundamentals.forEach(([topic, subtopic, questionText, answer], i) => advanced.push(finalQuestion("CHEMISTRY", "ROUND_ONE", i, {
  topic,
  subtopic,
  questionText,
  answer,
  acceptedAnswers: [],
  shortcutSolution: "Identify the controlling electronic, energetic, or equilibrium principle before answering.",
  fullSolution: answer,
  commonTrap: "Giving an observation without the particle-level or energetic explanation.",
  repeatedPattern: "precise chemical explanation",
  patternFamily: "chemical fundamentals",
  tags: ["chemistry", "fundamentals", "final-level"],
  examinerFocus: "Use chemically precise terminology and state the causal mechanism.",
})));

for (let i = 0; i < 10; i += 1) {
  const cBase = 0.1 + (i % 5) * 0.05;
  const vBase = 20 + i;
  const moles = cBase * vBase / 1000;
  const cAcid = 0.05 + (i % 3) * 0.05;
  const vAcid = (moles / cAcid) * 1000;
  advanced.push(
    finalQuestion("CHEMISTRY", "SPEED_RACE", i, {
      topic: "Redox",
      subtopic: "Oxidation states",
      questionText: "What is the average oxidation state of sulfur in S2O3^2-?",
      answer: "+2",
      acceptedAnswers: ["2", "positive two"],
      shortcutSolution: "Let the two sulfur atoms total x: x + 3(-2) = -2.",
      fullSolution: "The sulfur total is +4, so the average for two sulfur atoms is +2.",
      commonTrap: "Assuming the two sulfur atoms have identical individual oxidation states.",
      repeatedPattern: "average oxidation state",
      patternFamily: "redox speed",
      tags: ["redox", "speed-race", "wrong-answer-minus-one"],
    }),
    finalQuestion("CHEMISTRY", "PROBLEM_OF_THE_DAY", i, {
      topic: "Stoichiometry",
      subtopic: "Acid-base titration",
      questionText: `${vBase.toFixed(1)} cm^3 of ${cBase.toFixed(2)} mol/dm^3 NaOH is neutralized by ${cAcid.toFixed(2)} mol/dm^3 HCl. Calculate the amount of NaOH and the required HCl volume.`,
      answer: `${moles.toFixed(5)} mol; ${vAcid.toFixed(1)} cm^3`,
      acceptedAnswers: [`${moles} mol, ${vAcid} cm3`],
      shortcutSolution: "Use n = cV in dm^3; HCl and NaOH react 1:1.",
      fullSolution: `NaOH + HCl -> NaCl + H2O. n(NaOH) = ${cBase.toFixed(2)} x ${(vBase / 1000).toFixed(4)} = ${moles.toFixed(5)} mol. The same HCl amount is required, so V = n/c = ${(vAcid / 1000).toFixed(4)} dm^3 = ${vAcid.toFixed(1)} cm^3.`,
      commonTrap: "Using cubic centimetres directly in n = cV or reversing the concentration ratio.",
      repeatedPattern: "titration amount and volume",
      patternFamily: "multi-step stoichiometry",
      tags: ["POTD", "titration", "10-mark", "final-level"],
      examinerFocus: "Balance the equation, convert volume units, use mole ratio, and report the requested unit.",
      markingScheme: "2 marks equation; 2 marks volume conversion; 2 marks NaOH amount; 2 marks mole ratio; 2 marks HCl volume and unit.",
    }),
    finalQuestion("CHEMISTRY", "TRUE_FALSE", i, {
      topic: "Chemical Equilibrium",
      subtopic: "Catalysts",
      questionText: "True or False: Adding a catalyst to a closed equilibrium mixture increases the equilibrium yield of products.",
      answer: "False",
      acceptedAnswers: ["F"],
      shortcutSolution: "A catalyst changes rates equally, not the equilibrium constant.",
      fullSolution: "False. A catalyst lowers activation energy for both forward and reverse reactions, so equilibrium is reached faster but its position and yield are unchanged.",
      commonTrap: "Equating faster product formation with a larger equilibrium amount.",
      repeatedPattern: "rate versus equilibrium position",
      patternFamily: "conceptual landmines",
      tags: ["true-false", "equilibrium", "final-level"],
    }),
  );
}

const chemistryRiddles = [
  ["catalyst", ["I alter a pathway without changing the reaction enthalpy.", "I lower the activation-energy barrier for both directions.", "I speed attainment of equilibrium without shifting its position.", "I am regenerated overall after the reaction."]],
  ["buffer solution", ["I contain a conjugate acid-base pair in appreciable amounts.", "Added hydrogen or hydroxide ions are consumed by my components.", "My pH changes only slightly on small acid or base additions.", "I may be made from a weak acid and its salt."]],
  ["electronegativity", ["I am not measured directly for an isolated atom.", "Across a period I generally increase.", "I describe attraction for a shared pair of electrons.", "Differences in me help predict bond polarity."]],
  ["limiting reagent", ["I am identified only after stoichiometric comparison.", "I am consumed first in a complete reaction.", "I determine the maximum amount of product.", "Other reactants may remain in excess when I am exhausted."]],
  ["enthalpy change", ["I compare energy content between final and initial states.", "At constant pressure I equal heat transferred.", "My sign distinguishes exothermic from endothermic change.", "Hess's law can determine me indirectly."]],
  ["cathode", ["My sign depends on whether the cell is electrolytic or galvanic.", "Cations move toward me during electrolysis.", "Reduction always occurs at me.", "Electrons are accepted at my surface."]],
  ["structural isomer", ["I share a molecular formula with another compound.", "My atoms are connected in a different order.", "I may differ in chain, position, or functional group.", "I am not explained merely by rotation about a single bond."]],
  ["dynamic equilibrium", ["I require a closed system for stable macroscopic composition.", "Both opposing processes continue while I persist.", "My forward and reverse rates are equal.", "Constant concentrations do not mean reactions have stopped."]],
  ["activation energy", ["I am an energy threshold, not the total heat released.", "A catalyst lowers me by changing the pathway.", "Particles must meet or exceed me for successful reaction.", "I separate reactants from the transition state."]],
  ["oxidizing agent", ["I cause another species to lose electrons.", "My own oxidation number decreases.", "I accept electrons in a redox process.", "I am reduced while bringing about oxidation."]],
] as const;

chemistryRiddles.forEach(([answer, clues], i) => advanced.push(finalQuestion("CHEMISTRY", "RIDDLE", i, {
  topic: "Chemical Reasoning",
  subtopic: "Layered identification",
  questionText: "Who am I?",
  answer,
  acceptedAnswers: [`a ${answer}`, `the ${answer}`],
  shortcutSolution: `Track the particle, energy, or equilibrium behavior that uniquely identifies ${answer}.`,
  fullSolution: `The clues combine operational and particle-level properties of ${answer}.`,
  commonTrap: "Choosing the process caused by the substance instead of the substance or quantity itself.",
  repeatedPattern: "layered chemical definition",
  patternFamily: "final-level riddles",
  tags: ["riddle", "chemistry", "final-level"],
  riddleClues: riddleClues([...clues]),
})));

const biologyFundamentals = [
  ["Nervous System", "Refractory period", "Explain the physiological significance of the refractory period during action-potential transmission.", "It ensures one-way impulse transmission and limits immediate repeated firing, preventing overlapping action potentials."],
  ["Cell Biology", "Membranes", "Differentiate facilitated diffusion from active transport.", "Facilitated diffusion moves down a gradient through proteins without ATP; active transport uses energy to move against a gradient."],
  ["Genetics", "Gene expression", "Explain why the genetic code is described as degenerate but unambiguous.", "Most amino acids have multiple codons, but each codon specifies only one amino acid."],
  ["Ecology", "Energy flow", "Explain why energy transfer between trophic levels is inefficient.", "Energy is lost in respiration, heat, movement, waste, and uneaten material, so only a fraction enters the next level."],
  ["Evolution", "Natural selection", "State the conditions required for natural selection to change a population.", "Heritable variation, differential survival or reproduction, and inheritance across generations are required."],
  ["Human Physiology", "Oxygen transport", "Explain the Bohr effect.", "Higher carbon dioxide and lower pH reduce haemoglobin affinity for oxygen, promoting unloading in active tissues."],
  ["Plant Biology", "Transpiration", "Explain how cohesion-tension moves water through xylem.", "Evaporation creates tension that pulls a continuous cohesive water column upward through lignified xylem vessels."],
  ["Reproduction", "Hormonal control", "Explain the role of the LH surge in the menstrual cycle.", "The LH surge triggers ovulation and formation of the corpus luteum."],
  ["Respiration", "Oxidative phosphorylation", "State the role of oxygen in aerobic respiration.", "Oxygen is the final electron acceptor in the electron transport chain and forms water."],
  ["Excretion", "Selective reabsorption", "Explain why glucose is normally absent from urine.", "Filtered glucose is selectively reabsorbed from the proximal convoluted tubule into the blood below the renal threshold."],
] as const;

biologyFundamentals.forEach(([topic, subtopic, questionText, answer], i) => advanced.push(finalQuestion("BIOLOGY", "ROUND_ONE", i, {
  topic,
  subtopic,
  questionText,
  answer,
  acceptedAnswers: [],
  shortcutSolution: "Name the mechanism, then connect it to its physiological consequence.",
  fullSolution: answer,
  commonTrap: "Naming a structure without explaining the causal mechanism.",
  repeatedPattern: "mechanism and significance",
  patternFamily: "biological fundamentals",
  tags: ["biology", "fundamentals", "final-level"],
  examinerFocus: "Use correct biological terminology and link mechanism to function.",
})));

const biologySpeed = [
  ["What polysaccharide is the main structural component of fungal cell walls?", "chitin", ["Chitin"]],
  ["Which enzyme joins Okazaki fragments during DNA replication?", "DNA ligase", ["ligase"]],
  ["Which nephron region establishes the medullary osmotic gradient by countercurrent multiplication?", "loop of Henle", ["Henle's loop"]],
  ["Which hormone lowers blood glucose by promoting uptake and glycogenesis?", "insulin", []],
  ["Which photosynthetic pigment is at the reaction centre of both photosystems?", "chlorophyll a", []],
  ["What is the immediate source of variation produced by crossing over?", "recombination", ["genetic recombination"]],
  ["Which blood vessel carries oxygenated blood from the lungs to the heart?", "pulmonary vein", []],
  ["Which cells open and close a stomatal pore?", "guard cells", []],
  ["What nitrogenous waste is formed from ammonia in the human liver?", "urea", []],
  ["Which part of the brain coordinates balance and fine muscular movement?", "cerebellum", []],
] as const;

biologySpeed.forEach(([questionText, answer, acceptedAnswers], i) => advanced.push(finalQuestion("BIOLOGY", "SPEED_RACE", i, {
  topic: "Biological Recall",
  subtopic: "Precision recall",
  questionText,
  answer,
  acceptedAnswers: [...acceptedAnswers],
  shortcutSolution: "Use the defining structure-function association.",
  fullSolution: `${answer} is the precise term matching the stated function.`,
  commonTrap: "Giving a related organ or process instead of the requested structure or molecule.",
  repeatedPattern: "rapid biological identification",
  patternFamily: "biology speed",
  tags: ["speed-race", "biology", "wrong-answer-minus-one"],
})));

for (let i = 0; i < 10; i += 1) {
  const q = (i + 1) / 100;
  const p = 1 - q;
  const carriers = 2 * p * q * 100;
  advanced.push(
    finalQuestion("BIOLOGY", "PROBLEM_OF_THE_DAY", i, {
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
      tags: ["POTD", "Hardy-Weinberg", "10-mark", "final-level"],
      examinerFocus: "Distinguish allele frequency from homozygous and heterozygous genotype frequencies.",
      markingScheme: "2 marks p; 2 marks q squared; 2 marks affected percentage; 3 marks 2pq carriers; 1 mark interpretation.",
    }),
    finalQuestion("BIOLOGY", "TRUE_FALSE", i, {
      topic: "Human Physiology",
      subtopic: "Circulation",
      questionText: "True or False: All arteries carry oxygen-rich blood away from the heart.",
      answer: "False",
      acceptedAnswers: ["F"],
      shortcutSolution: "Artery is defined by direction, not oxygen content.",
      fullSolution: "False. Arteries carry blood away from the heart, but the pulmonary artery carries deoxygenated blood to the lungs.",
      commonTrap: "Treating oxygen content as the definition of an artery.",
      repeatedPattern: "exception to an overgeneralization",
      patternFamily: "conceptual landmines",
      tags: ["true-false", "circulation", "final-level"],
    }),
  );
}

const biologyRiddles = [
  ["mitochondrion", ["I am bounded by two membranes in eukaryotic cells.", "I contain circular DNA and 70S ribosomes.", "My inner membrane forms cristae.", "I am a principal site of aerobic ATP production."]],
  ["centromere", ["I occupy a defined chromosome region where sister chromatids remain joined.", "A kinetochore assembles near me for spindle attachment.", "My position helps classify chromosome shape.", "I contribute to the X-like appearance of a duplicated chromosome."]],
  ["xylem", ["I am a complex vascular tissue.", "Many of my conducting cells are dead and lignified at maturity.", "I carry water and mineral ions from roots.", "Cohesion-tension helps explain transport through me."]],
  ["nephron", ["I am microscopic but regulate water and dissolved substances in vertebrates.", "My tubules perform selective reabsorption and secretion.", "Filtration begins in my renal corpuscle.", "I am the functional unit of the kidney."]],
  ["synapse", ["I am a junction where direct cytoplasmic continuity is usually absent.", "Neurotransmitter release depends on calcium entry.", "Transmission across me is normally one-way.", "I connect one neuron functionally to another cell."]],
  ["stoma", ["I am a pore bordered by specialized epidermal cells.", "Changes in guard-cell turgor alter my width.", "I permit carbon dioxide entry and water-vapour loss.", "I am commonly found in the leaf epidermis."]],
  ["allele", ["I occupy the same locus as another form of a hereditary unit.", "Diploid organisms may carry two copies of me.", "Dominance affects my phenotypic expression in heterozygotes.", "I am an alternative form of a gene."]],
  ["haemoglobin", ["I am a conjugated protein containing iron-bearing groups.", "My oxygen affinity changes with pH and carbon dioxide.", "I load oxygen efficiently in respiratory surfaces.", "I transport most oxygen in vertebrate blood."]],
  ["ribosome", ["I am not enclosed by a membrane.", "My subunits contain ribosomal RNA and proteins.", "Transfer RNA visits my sites during translation.", "I synthesize polypeptides from messenger RNA information."]],
  ["natural selection", ["I require heritable variation within a population.", "I act through differential reproductive success.", "I do not create needed mutations on demand.", "Across generations I can increase advantageous traits."]],
] as const;

biologyRiddles.forEach(([answer, clues], i) => advanced.push(finalQuestion("BIOLOGY", "RIDDLE", i, {
  topic: "Biological Structures and Processes",
  subtopic: "Layered identification",
  questionText: "Who am I?",
  answer,
  acceptedAnswers: [`a ${answer}`, `the ${answer}`],
  shortcutSolution: `Combine structural and functional clues to identify ${answer}.`,
  fullSolution: `The clues progress from advanced structural evidence to the defining biological role of ${answer}.`,
  commonTrap: "Choosing a nearby structure in the same organ or pathway.",
  repeatedPattern: "structure-function riddle",
  patternFamily: "final-level riddles",
  tags: ["riddle", "biology", "final-level"],
  riddleClues: riddleClues([...clues]),
}, answer === "nephron")));

export const advancedFinalQuestions = advanced;
