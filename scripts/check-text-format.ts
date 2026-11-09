import assert from "node:assert/strict";
import { formatShortcut, parseShortcut, prettyMaths } from "../lib/text/shortcut";

const text = formatShortcut({ recognise: "AP sum", fastRoute: "17 × 71 = 1207", formula: "Sₙ = n/2 [2a + (n − 1)d]", check: "ends in 7" });
assert.equal(text.split("\n").length, 4);
assert.deepEqual(parseShortcut(text), { recognise: "AP sum", fastRoute: "17 × 71 = 1207", formula: "Sₙ = n/2 [2a + (n − 1)d]", check: "ends in 7" });
assert.deepEqual(parseShortcut("Fast route: step one\nstep two\nCheck: ok"), { fastRoute: "step one\nstep two", check: "ok" });
assert.equal(parseShortcut("Model the data as an arithmetic progression."), null);
assert.equal(parseShortcut("Use the formula.\nRecognise: x"), null);
assert.equal(prettyMaths("x^2 + x^-1 + 2^(10) and sqrt(3) 4*5"), "x² + x⁻¹ + 2¹⁰ and √(3) 4 × 5");
assert.equal(prettyMaths("10^3.5 stays"), "10^3.5 stays");
assert.equal(prettyMaths("ms^-1"), "ms⁻¹");
console.log("text formatting checks passed");
