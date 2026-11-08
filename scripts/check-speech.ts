import assert from "node:assert/strict";
import { toSpeech } from "../lib/text/speech";
assert.equal(toSpeech("x² − 4 = 0"), "x squared minus 4 equals 0");
assert.equal(toSpeech("H₂SO₄"), "H 2 SO 4");
assert.equal(toSpeech("2ⁿ⁻¹"), "2 to the power n minus 1");
assert.equal(toSpeech("x⁻¹"), "x to the power minus 1");
assert.equal(toSpeech("√3 × π"), "root 3 times pi");
console.log("speech checks passed");
