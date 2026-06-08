import { baseQuestion, type SeedQuestion } from "./question-factory";

type Subject = SeedQuestion["subject"];

function original(
  subject: Subject,
  index: number,
  topic: string,
  subtopic: string,
  questionText: string,
  answer: string,
  shortcutSolution: string,
  fullSolution: string,
  patternFamily: string,
  acceptedAnswers: string[] = [],
): SeedQuestion {
  return baseQuestion(subject, "ROUND_ONE", 1000 + index, false, {
    topic,
    subtopic,
    questionText,
    answer,
    acceptedAnswers,
    shortcutSolution,
    fullSolution,
    commonTrap: "Check units, signs, and the exact quantity requested before giving the final answer.",
    repeatedPattern: patternFamily,
    patternFamily,
    tags: [topic.toLowerCase(), subtopic.toLowerCase(), "curated-pattern"],
  });
}

export const supplementalPatternQuestions: SeedQuestion[] = [
  original("MATHEMATICS", 1, "Trigonometry", "Trigonometric ratios", "In a right triangle, the side opposite angle theta is 6 cm and the hypotenuse is 10 cm. Find sin theta.", "0.6", "sin theta = opposite/hypotenuse = 6/10.", "Using SOH, sin theta = 6/10 = 3/5 = 0.6.", "trigonometric ratios", ["3/5"]),
  original("MATHEMATICS", 2, "Probability", "Simple probability", "A bag contains 3 red and 7 blue balls. One ball is selected at random. Find the probability that it is red.", "0.3", "Favourable/total = 3/10.", "There are 10 balls and 3 favourable outcomes, so P(red) = 3/10 = 0.3.", "probability", ["3/10"]),
  original("MATHEMATICS", 3, "Logarithms", "Common logarithms", "Evaluate log base 10 of 100000.", "5", "Count the zeros in 100000.", "Since 100000 = 10^5, log10(100000) = 5.", "logarithms"),
  original("MATHEMATICS", 4, "Coordinate Geometry", "Midpoint", "Find the midpoint of the points (2, 5) and (8, 11).", "(5, 8)", "Average the x-coordinates and y-coordinates separately.", "The midpoint is ((2 + 8)/2, (5 + 11)/2) = (5, 8).", "coordinate geometry", ["5,8"]),
  original("MATHEMATICS", 5, "Vectors", "Vector magnitude", "Find the magnitude of the vector 3i + 4j.", "5", "Recognize the 3-4-5 right triangle.", "Magnitude = sqrt(3^2 + 4^2) = sqrt(25) = 5.", "vectors"),

  original("PHYSICS", 6, "Mechanics", "Uniform acceleration", "A car starts from rest and accelerates uniformly at 3 m/s^2 for 8 s. Find its final speed.", "24 m/s", "From rest, v = at.", "v = u + at = 0 + (3)(8) = 24 m/s.", "speed from acceleration and time", ["24"]),
  original("PHYSICS", 7, "Mechanics", "Newton's second law", "Find the force that gives a 6 kg body an acceleration of 4 m/s^2.", "24 N", "Use F = ma.", "F = 6 x 4 = 24 N.", "force from mass and acceleration", ["24"]),
  original("PHYSICS", 8, "Electricity", "Ohm's law", "A 4 ohm resistor carries a current of 3 A. Find the potential difference across it.", "12 V", "Use V = IR.", "V = 3 x 4 = 12 V.", "Ohm's law", ["12"]),
  original("PHYSICS", 9, "Energy", "Work and power", "A machine does 900 J of work in 30 s. Find its power.", "30 W", "Power = work/time.", "P = 900/30 = 30 W.", "power energy and work", ["30"]),
  original("PHYSICS", 10, "Waves", "Wave equation", "A wave has frequency 50 Hz and wavelength 2 m. Find its speed.", "100 m/s", "Use v = f lambda.", "v = 50 x 2 = 100 m/s.", "wave speed", ["100"]),

  original("CHEMISTRY", 11, "Acids and Bases", "pH", "Find the pH of a solution with hydrogen ion concentration 1 x 10^-3 mol/dm^3.", "3", "For 10^-n, pH = n.", "pH = -log10(1 x 10^-3) = 3.", "pH from hydrogen ion concentration"),
  original("CHEMISTRY", 12, "Acids and Bases", "pOH", "Find the pOH of a solution with hydroxide ion concentration 1 x 10^-5 mol/dm^3.", "5", "For 10^-n, pOH = n.", "pOH = -log10(1 x 10^-5) = 5.", "pOH and hydroxide concentration"),
  original("CHEMISTRY", 13, "Stoichiometry", "Mole calculations", "How many moles are present in 18 g of water? Molar mass of water = 18 g/mol.", "1 mol", "Moles = mass/molar mass.", "n = 18/18 = 1 mol.", "mole calculations", ["1"]),
  original("CHEMISTRY", 14, "Stoichiometry", "Empirical formula", "A compound contains 40.0% carbon, 6.7% hydrogen, and 53.3% oxygen by mass. Determine its empirical formula.", "CH2O", "Convert each percentage to moles, then divide by the smallest.", "For 100 g: C = 40/12, H = 6.7/1, O = 53.3/16. Dividing by about 3.33 gives 1:2:1, hence CH2O.", "empirical formula", ["CH2O"]),
  original("CHEMISTRY", 15, "Stoichiometry", "Percentage yield", "A reaction has a theoretical yield of 25 g but produces 20 g. Calculate the percentage yield.", "80%", "Actual/theoretical x 100.", "Percentage yield = (20/25) x 100 = 80%.", "percentage yield", ["80"]),
  original("CHEMISTRY", 16, "Stoichiometry", "Limiting reagent", "For the reaction 2H2 + O2 -> 2H2O, identify the limiting reagent when 3 mol H2 reacts with 2 mol O2.", "hydrogen", "Compare available moles with the 2:1 equation ratio.", "Two moles of O2 require 4 mol H2, but only 3 mol H2 is available. Hydrogen is limiting.", "limiting reagent", ["H2", "hydrogen gas"]),
  original("CHEMISTRY", 17, "Electrochemistry", "Electrolysis", "During electrolysis of molten sodium chloride, which substance forms at the cathode?", "sodium", "Positive sodium ions gain electrons at the negative electrode.", "At the cathode, Na+ gains an electron to form sodium.", "electrolysis", ["Na"]),
  original("CHEMISTRY", 18, "Organic Chemistry", "Functional groups", "Name the functional group present in ethanol.", "hydroxyl group", "Alcohols contain the -OH group.", "Ethanol is an alcohol, so its characteristic functional group is hydroxyl, -OH.", "organic functional groups", ["hydroxyl", "-OH", "OH"]),
  original("CHEMISTRY", 19, "Gas Laws", "Boyle's law", "A gas occupies 300 cm^3 at 100 kPa. Find its volume at 150 kPa at constant temperature.", "200 cm^3", "Use P1V1 = P2V2.", "V2 = (100 x 300)/150 = 200 cm^3.", "gas laws", ["200"]),

  original("BIOLOGY", 20, "Genetics", "Monohybrid inheritance", "Two heterozygous tall pea plants, Tt and Tt, are crossed. What is the probability of a dwarf offspring?", "25%", "Tt x Tt gives one tt in four.", "The genotypes are TT, Tt, Tt, and tt. Only tt is dwarf, so the probability is 1/4 = 25%.", "genetic probability", ["1/4", "0.25"]),
  original("BIOLOGY", 21, "Ecology", "Population estimation", "In a quadrat study, counts of a plant species are 8, 10, 12, 6, and 9. Find the mean number per quadrat.", "9", "Add the five counts and divide by 5.", "The total is 45, and 45/5 = 9 plants per quadrat.", "ecology population estimates"),
  original("BIOLOGY", 22, "Plant Physiology", "Photosynthesis", "Name the gas absorbed by green plants during photosynthesis.", "carbon dioxide", "Recall the carbon source in photosynthesis.", "Plants absorb carbon dioxide and water to make glucose, releasing oxygen.", "photosynthesis", ["CO2", "carbon dioxide gas"]),
  original("BIOLOGY", 23, "Cell Biology", "Respiration", "In which organelle does aerobic respiration mainly occur?", "mitochondrion", "Think of the cell's ATP-producing organelle.", "The stages after glycolysis mainly occur in mitochondria.", "respiration", ["mitochondria"]),
  original("BIOLOGY", 24, "Human Biology", "Excretion", "Which organ removes urea from the blood and forms urine?", "kidney", "The urinary organ filters blood.", "The kidneys filter blood, remove urea, and regulate water and salts while forming urine.", "excretion", ["kidneys"]),
  original("BIOLOGY", 25, "Coordination", "Nervous system", "Which part of a neuron carries impulses away from the cell body?", "axon", "Dendrites arrive; the axon exits.", "The axon conducts nerve impulses away from the neuron's cell body.", "nervous system"),
  original("BIOLOGY", 26, "Plant Physiology", "Transport", "Which plant tissue transports water and mineral salts from roots to leaves?", "xylem", "Water rises in the xylem.", "Xylem vessels conduct water and dissolved mineral salts upward through the plant.", "plant transport"),
];
