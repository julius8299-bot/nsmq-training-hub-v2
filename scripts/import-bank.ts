/**
 * Deploy step: loads the encrypted NSMQ question bank (prisma/bank/bank.enc) when BANK_KEY is set.
 * The bank is encrypted because this repository is public; without the key the file is unreadable,
 * and the step is skipped. Format: 12-byte IV | 16-byte GCM tag | AES-256-GCM(gzip(JSON rows)).
 */
import { createDecipheriv } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { createPrismaClient } from "../lib/prisma-factory";
import { syncBank, type BankRow } from "../lib/questions/bank-sync";

export function decryptBank(file: Buffer, keyBase64: string): BankRow[] {
  const key = Buffer.from(keyBase64.trim(), "base64");
  if (key.length !== 32) throw new Error("BANK_KEY must be 32 bytes in base64.");
  const decipher = createDecipheriv("aes-256-gcm", key, file.subarray(0, 12));
  decipher.setAuthTag(file.subarray(12, 28));
  return JSON.parse(gunzipSync(Buffer.concat([decipher.update(file.subarray(28)), decipher.final()])).toString("utf8"));
}

async function main() {
  const file = path.join(process.cwd(), "prisma", "bank", "bank.enc");
  if (!process.env.BANK_KEY) { console.log("Question bank: BANK_KEY not set, skipping."); return; }
  if (!existsSync(file)) { console.log("Question bank: no bank file, skipping."); return; }
  const rows = decryptBank(readFileSync(file), process.env.BANK_KEY);
  console.log(`Question bank: ${rows.length} rows (${rows.filter((row) => row.visibility === "AI_CHECKED").length} ready for students).`);
  const db = createPrismaClient();
  try { console.log("Question bank:", await syncBank(db, rows)); } finally { await db.$disconnect(); }
}

if (require.main === module) main().catch((error) => { console.error("Question bank import failed:", error); process.exit(1); });
