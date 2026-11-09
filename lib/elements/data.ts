/**
 * The 118 elements, one row each: [Z, symbol, name, category].
 * Group, period and block are NOT typed by hand; they are derived from Z (see positionOf) and
 * cross-checked by scripts/check-elements.ts, so a typo cannot silently produce a wrong question.
 */
export type Category =
  | "alkali metal" | "alkaline earth metal" | "transition metal" | "post-transition metal" | "metalloid"
  | "nonmetal" | "halogen" | "noble gas" | "lanthanide" | "actinide" | "superheavy";

const ROWS: [number, string, string, Category][] = [
  [1, "H", "Hydrogen", "nonmetal"], [2, "He", "Helium", "noble gas"],
  [3, "Li", "Lithium", "alkali metal"], [4, "Be", "Beryllium", "alkaline earth metal"], [5, "B", "Boron", "metalloid"],
  [6, "C", "Carbon", "nonmetal"], [7, "N", "Nitrogen", "nonmetal"], [8, "O", "Oxygen", "nonmetal"],
  [9, "F", "Fluorine", "halogen"], [10, "Ne", "Neon", "noble gas"],
  [11, "Na", "Sodium", "alkali metal"], [12, "Mg", "Magnesium", "alkaline earth metal"], [13, "Al", "Aluminium", "post-transition metal"],
  [14, "Si", "Silicon", "metalloid"], [15, "P", "Phosphorus", "nonmetal"], [16, "S", "Sulfur", "nonmetal"],
  [17, "Cl", "Chlorine", "halogen"], [18, "Ar", "Argon", "noble gas"],
  [19, "K", "Potassium", "alkali metal"], [20, "Ca", "Calcium", "alkaline earth metal"],
  [21, "Sc", "Scandium", "transition metal"], [22, "Ti", "Titanium", "transition metal"], [23, "V", "Vanadium", "transition metal"],
  [24, "Cr", "Chromium", "transition metal"], [25, "Mn", "Manganese", "transition metal"], [26, "Fe", "Iron", "transition metal"],
  [27, "Co", "Cobalt", "transition metal"], [28, "Ni", "Nickel", "transition metal"], [29, "Cu", "Copper", "transition metal"],
  [30, "Zn", "Zinc", "transition metal"], [31, "Ga", "Gallium", "post-transition metal"], [32, "Ge", "Germanium", "metalloid"],
  [33, "As", "Arsenic", "metalloid"], [34, "Se", "Selenium", "nonmetal"], [35, "Br", "Bromine", "halogen"], [36, "Kr", "Krypton", "noble gas"],
  [37, "Rb", "Rubidium", "alkali metal"], [38, "Sr", "Strontium", "alkaline earth metal"],
  [39, "Y", "Yttrium", "transition metal"], [40, "Zr", "Zirconium", "transition metal"], [41, "Nb", "Niobium", "transition metal"],
  [42, "Mo", "Molybdenum", "transition metal"], [43, "Tc", "Technetium", "transition metal"], [44, "Ru", "Ruthenium", "transition metal"],
  [45, "Rh", "Rhodium", "transition metal"], [46, "Pd", "Palladium", "transition metal"], [47, "Ag", "Silver", "transition metal"],
  [48, "Cd", "Cadmium", "transition metal"], [49, "In", "Indium", "post-transition metal"], [50, "Sn", "Tin", "post-transition metal"],
  [51, "Sb", "Antimony", "metalloid"], [52, "Te", "Tellurium", "metalloid"], [53, "I", "Iodine", "halogen"], [54, "Xe", "Xenon", "noble gas"],
  [55, "Cs", "Caesium", "alkali metal"], [56, "Ba", "Barium", "alkaline earth metal"],
  [57, "La", "Lanthanum", "lanthanide"], [58, "Ce", "Cerium", "lanthanide"], [59, "Pr", "Praseodymium", "lanthanide"],
  [60, "Nd", "Neodymium", "lanthanide"], [61, "Pm", "Promethium", "lanthanide"], [62, "Sm", "Samarium", "lanthanide"],
  [63, "Eu", "Europium", "lanthanide"], [64, "Gd", "Gadolinium", "lanthanide"], [65, "Tb", "Terbium", "lanthanide"],
  [66, "Dy", "Dysprosium", "lanthanide"], [67, "Ho", "Holmium", "lanthanide"], [68, "Er", "Erbium", "lanthanide"],
  [69, "Tm", "Thulium", "lanthanide"], [70, "Yb", "Ytterbium", "lanthanide"], [71, "Lu", "Lutetium", "lanthanide"],
  [72, "Hf", "Hafnium", "transition metal"], [73, "Ta", "Tantalum", "transition metal"], [74, "W", "Tungsten", "transition metal"],
  [75, "Re", "Rhenium", "transition metal"], [76, "Os", "Osmium", "transition metal"], [77, "Ir", "Iridium", "transition metal"],
  [78, "Pt", "Platinum", "transition metal"], [79, "Au", "Gold", "transition metal"], [80, "Hg", "Mercury", "transition metal"],
  [81, "Tl", "Thallium", "post-transition metal"], [82, "Pb", "Lead", "post-transition metal"], [83, "Bi", "Bismuth", "post-transition metal"],
  [84, "Po", "Polonium", "post-transition metal"], [85, "At", "Astatine", "halogen"], [86, "Rn", "Radon", "noble gas"],
  [87, "Fr", "Francium", "alkali metal"], [88, "Ra", "Radium", "alkaline earth metal"],
  [89, "Ac", "Actinium", "actinide"], [90, "Th", "Thorium", "actinide"], [91, "Pa", "Protactinium", "actinide"],
  [92, "U", "Uranium", "actinide"], [93, "Np", "Neptunium", "actinide"], [94, "Pu", "Plutonium", "actinide"],
  [95, "Am", "Americium", "actinide"], [96, "Cm", "Curium", "actinide"], [97, "Bk", "Berkelium", "actinide"],
  [98, "Cf", "Californium", "actinide"], [99, "Es", "Einsteinium", "actinide"], [100, "Fm", "Fermium", "actinide"],
  [101, "Md", "Mendelevium", "actinide"], [102, "No", "Nobelium", "actinide"], [103, "Lr", "Lawrencium", "actinide"],
  [104, "Rf", "Rutherfordium", "superheavy"], [105, "Db", "Dubnium", "superheavy"], [106, "Sg", "Seaborgium", "superheavy"],
  [107, "Bh", "Bohrium", "superheavy"], [108, "Hs", "Hassium", "superheavy"], [109, "Mt", "Meitnerium", "superheavy"],
  [110, "Ds", "Darmstadtium", "superheavy"], [111, "Rg", "Roentgenium", "superheavy"], [112, "Cn", "Copernicium", "superheavy"],
  [113, "Nh", "Nihonium", "superheavy"], [114, "Fl", "Flerovium", "superheavy"], [115, "Mc", "Moscovium", "superheavy"],
  [116, "Lv", "Livermorium", "superheavy"], [117, "Ts", "Tennessine", "superheavy"], [118, "Og", "Oganesson", "superheavy"],
];

/** Accepted alternative spellings (British/American and older forms used in Ghanaian textbooks). */
export const ALTERNATIVE_NAMES: Record<string, string[]> = {
  Aluminium: ["Aluminum"], Sulfur: ["Sulphur"], Caesium: ["Cesium"],
};

/** Symbols that come from older (mostly Latin) names — a classic quiz-mistress twist. */
export const SYMBOL_ORIGINS: Record<string, { origin: string; language: string }> = {
  Na: { origin: "natrium", language: "Latin" }, K: { origin: "kalium", language: "Latin" },
  Fe: { origin: "ferrum", language: "Latin" }, Cu: { origin: "cuprum", language: "Latin" },
  Ag: { origin: "argentum", language: "Latin" }, Sn: { origin: "stannum", language: "Latin" },
  Sb: { origin: "stibium", language: "Latin" }, Au: { origin: "aurum", language: "Latin" },
  Hg: { origin: "hydrargyrum", language: "Latinised Greek" }, Pb: { origin: "plumbum", language: "Latin" },
  W: { origin: "wolfram", language: "German" },
};

/** States at 25 °C and 1 atm for elements whose state is established (not just predicted). */
const GASES = new Set(["H", "He", "N", "O", "F", "Ne", "Cl", "Ar", "Kr", "Xe", "Rn"]);
const LIQUIDS = new Set(["Br", "Hg"]);
const STATE_UNSETTLED = new Set(["At", "Fr"]);

/** Rounded relative atomic masses as printed in WASSCE data tables. */
export const RELATIVE_ATOMIC_MASS: Record<string, number> = {
  H: 1, He: 4, Li: 7, C: 12, N: 14, O: 16, F: 19, Ne: 20, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35.5,
  Ar: 40, K: 39, Ca: 40, Mn: 55, Fe: 56, Cu: 63.5, Zn: 65, Br: 80, Ag: 108, I: 127, Ba: 137, Pb: 207,
};

export type Block = "s" | "p" | "d" | "f";
export type Element = {
  z: number; symbol: string; name: string; category: Category;
  group: number | null; period: number; block: Block;
  /** Placement or classification that textbooks disagree on: never asked about. */
  blockContested: boolean; categoryContested: boolean;
  state: "solid" | "liquid" | "gas" | null;
};

/** Period, group and block from Z alone (IUPAC 18-column table; lanthanides/actinides have no group number). */
export function positionOf(z: number): { period: number; group: number | null; block: Block } {
  const starts = [1, 3, 11, 19, 37, 55, 87, 119];
  const period = starts.findIndex((start, index) => z >= start && z < starts[index + 1]) + 1;
  const offset = z - starts[period - 1]; // 0-based position along the period
  if (period === 1) return { period, group: z === 1 ? 1 : 18, block: "s" };
  if (period <= 3) {
    if (offset < 2) return { period, group: offset + 1, block: "s" };
    return { period, group: offset + 11, block: "p" }; // offsets 2..7 -> groups 13..18
  }
  if (period <= 5) {
    if (offset < 2) return { period, group: offset + 1, block: "s" };
    if (offset < 12) return { period, group: offset + 1, block: "d" }; // groups 3..12
    return { period, group: offset + 1, block: "p" }; // groups 13..18
  }
  // Periods 6 and 7: 2 s, 15 lanthanides/actinides (La/Ac..Lu/Lr), 9 more d (groups 4..12), 6 p.
  if (offset < 2) return { period, group: offset + 1, block: "s" };
  if (offset < 17) return { period, group: null, block: "f" };
  if (offset < 26) return { period, group: offset - 13, block: "d" }; // 17 -> group 4 ... 25 -> group 12
  return { period, group: offset - 13, block: "p" }; // 26 -> 13 ... 31 -> 18
}

export const ELEMENTS: Element[] = ROWS.map(([z, symbol, name, category]) => {
  const { period, group, block } = positionOf(z);
  return {
    z, symbol, name, category, group, period, block,
    // La/Ac vs Lu/Lr in group 3, and He (s-block placed over the p-block noble gases).
    blockContested: [57, 71, 89, 103].includes(z),
    // Group 12 (transition metal or not), polonium and astatine, and predicted superheavy chemistry.
    categoryContested: [30, 48, 80, 112].includes(z) || symbol === "Po" || symbol === "At" || category === "superheavy",
    state: z > 92 || STATE_UNSETTLED.has(symbol) ? null : GASES.has(symbol) ? "gas" : LIQUIDS.has(symbol) ? "liquid" : "solid",
  };
});

export const BY_SYMBOL = new Map(ELEMENTS.map((element) => [element.symbol, element]));
export const BY_Z = new Map(ELEMENTS.map((element) => [element.z, element]));
export function namesFor(element: Element) {
  return [element.name, ...(ALTERNATIVE_NAMES[element.name] ?? [])];
}

/** Ground-state configuration for Z <= 36 (SHS scope), with the two exceptions Cr and Cu. */
const ORDER = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p"] as const;
const CAPACITY: Record<string, number> = { s: 2, p: 6, d: 10 };
export function configuration(z: number): [string, number][] {
  if (z < 1 || z > 36) throw new Error("Configurations are generated for Z = 1 to 36 only.");
  const filled: [string, number][] = [];
  let left = z;
  for (const orbital of ORDER) {
    if (!left) break;
    const count = Math.min(left, CAPACITY[orbital.slice(-1)]);
    filled.push([orbital, count]);
    left -= count;
  }
  const set = (orbital: string, count: number) => { filled.find((entry) => entry[0] === orbital)![1] = count; };
  if (z === 24) { set("4s", 1); set("3d", 5); }
  if (z === 29) { set("4s", 1); set("3d", 10); }
  return filled;
}
const SUPER: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
export const superscript = (value: number) => String(value).split("").map((digit) => SUPER[digit]).join("");
export function configurationText(z: number, shorthand = true) {
  const parts = configuration(z);
  const cores: [number, string][] = [[18, "[Ar]"], [10, "[Ne]"], [2, "[He]"]];
  const core = shorthand ? cores.find(([coreZ]) => z > coreZ) : undefined;
  const skip = core ? configuration(core[0]).length : 0;
  // Within a core, 3d is written before 4s (the order chemists use for the finished atom).
  const rest = parts.slice(skip).sort((a, b) => Number(a[0][0]) - Number(b[0][0]) || "spdf".indexOf(a[0][1]) - "spdf".indexOf(b[0][1]));
  return [core?.[1], ...rest.map(([orbital, count]) => orbital + superscript(count))].filter(Boolean).join(" ");
}
export function unpairedElectrons(z: number) {
  return configuration(z).reduce((sum, [orbital, count]) => {
    const boxes = CAPACITY[orbital.slice(-1)] / 2;
    return sum + (count <= boxes ? count : 2 * boxes - count);
  }, 0);
}
/** K, L, M, N shell arrangement used at SHS level for Z <= 20 (e.g. calcium 2,8,8,2). */
export function shellArrangement(z: number) {
  if (z > 20) throw new Error("Shell arrangement questions stop at calcium.");
  const shells: number[] = [];
  let left = z;
  for (const size of [2, 8, 8, 2]) { const take = Math.min(left, size); if (take) shells.push(take); left -= take; }
  return shells;
}
export function stateOf(element: Element) { return element.state; }
