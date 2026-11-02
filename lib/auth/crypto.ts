import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class PasswordCapacityError extends Error {}

let deriving = false;
const waiting: Array<() => void> = [];

async function derive(password: string, salt: string): Promise<Buffer> {
  // Keep unauthenticated concurrent requests from multiplying scrypt's memory cost.
  if (deriving) {
    if (waiting.length >= 4) throw new PasswordCapacityError("Password verification is busy.");
    await new Promise<void>((resume) => waiting.push(resume));
  } else deriving = true;
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (error, key) => {
        if (error) reject(error);
        else resolve(key);
      });
    });
  } finally {
    const resume = waiting.shift();
    if (resume) resume();
    else deriving = false;
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt);
  return ["scrypt", "131072", "8", "1", salt, key.toString("hex")].join("$");
}

export async function verifyPassword(password: string, stored: string | null) {
  const parts = stored?.split("$");
  const valid = parts?.length === 6 && parts[0] === "scrypt" &&
    parts[1] === "131072" && parts[2] === "8" && parts[3] === "1" &&
    /^[a-f0-9]{32}$/.test(parts[4]) && /^[a-f0-9]{128}$/.test(parts[5]);
  const actual = await derive(password, valid ? parts![4] : "0".repeat(32));
  const expected = Buffer.from(valid ? parts![5] : "0".repeat(128), "hex");
  return timingSafeEqual(actual, expected) && Boolean(valid);
}
