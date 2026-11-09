/** Turns written maths/chemistry into words a speech voice reads naturally, e.g. "x² − 4" → "x squared minus 4". */
const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": " minus ", "⁺": " plus ", "ⁿ": "n" };
const SUB: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9", "ₙ": "n", "₊": "plus", "₋": "minus" };
const SYMBOLS: [RegExp, string][] = [
  [/√/g, " root "], [/π/g, " pi "], [/θ/g, " theta "], [/Δ/g, " delta "], [/∞/g, " infinity "], [/∫/g, " the integral of "],
  [/Σ/g, " the sum of "], [/λ/g, " lambda "], [/μ/g, " micro "], [/Ω/g, " ohms "], [/α/g, " alpha "], [/β/g, " beta "], [/γ/g, " gamma "],
  [/×/g, " times "], [/÷/g, " divided by "], [/≤/g, " less than or equal to "], [/≥/g, " greater than or equal to "], [/≠/g, " not equal to "],
  [/≈/g, " approximately "], [/⇌/g, " in equilibrium with "], [/→/g, " gives "], [/±/g, " plus or minus "], [/°C/g, " degrees Celsius"], [/°/g, " degrees"],
  [/ − | - /g, " minus "], [/−/g, " minus "], [/\s=\s/g, " equals "], [/%/g, " percent"], [/\bm\/s\b|\bms⁻¹/g, " metres per second"],
];

export function toSpeech(text: string) {
  let out = text
    .replace(/([A-Za-z0-9)\]])([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿ]+)/g, (_, base: string, power: string) => {
      const value = [...power].map((char) => SUP[char]).join("").replace(/\s+/g, " ").trim().replace(/^minus /, "minus ");
      if (value === "2") return `${base} squared`;
      if (value === "3") return `${base} cubed`;
      return `${base} to the power ${value}`;
    })
    .replace(/[₀₁₂₃₄₅₆₇₈₉ₙ₊₋]+/g, (subs) => " " + [...subs].map((char) => SUB[char]).join("") + " ")
    .replace(/(\d)\s*\/\s*(\d)/g, "$1 over $2");
  for (const [pattern, words] of SYMBOLS) out = out.replace(pattern, words);
  return out.replace(/\s+/g, " ").trim();
}
