import { spawn, spawnSync } from "node:child_process";
import { delimiter, dirname, resolve } from "node:path";

const port = 3111;
const baseUrl = `http://127.0.0.1:${port}`;
const nextCli = resolve("node_modules/next/dist/bin/next");
const npmCli = process.env.NPM_CLI_PATH;
const inheritedPath = Object.entries(process.env).find(
  ([key]) => key.toLowerCase() === "path",
)?.[1];
const environmentEntries = Object.entries(process.env).filter(
  (entry): entry is [string, string] =>
    entry[0].toLowerCase() !== "path" && entry[1] !== undefined,
);
const childEnvironment = {
  ...Object.fromEntries(environmentEntries),
  PATH: [dirname(process.execPath), inheritedPath].filter(Boolean).join(delimiter),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
const commandArguments = npmCli
  ? [npmCli, "run", "dev", "--", "-p", String(port)]
  : [nextCli, "dev", "-p", String(port)];
const server = spawn(process.execPath, commandArguments, {
  cwd: process.cwd(),
  env: childEnvironment,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

let serverLog = "";
server.stdout.on("data", (chunk) => {
  serverLog += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverLog += chunk.toString();
});

const delay = (milliseconds: number) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited before becoming ready.\n${serverLog}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/questions?page=1&pageSize=1`);
      if (response.ok) return;
    } catch {
      // The development server is still compiling.
    }
    await delay(1_000);
  }
  throw new Error(`Timed out waiting for Next.js.\n${serverLog}`);
}

async function requireOk(path: string) {
  const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}.`);
  }
  console.log(`${path}: ${response.status}`);
}

async function main() {
  await waitForServer();

  const routes = [
    "/",
    "/gallery",
    "/question-bank",
    "/practice",
    "/full-contest",
    "/speed-race",
    "/potd",
    "/tf",
    "/riddles",
    "/dashboard",
    "/admin",
    "/brand/nsmq-logo.png",
    "/gallery/nsmq-trophy.jpg",
    "/api/questions?page=1&pageSize=1&isGhanaContext=true",
    "/api/questions?page=1&pageSize=1&roundType=RIDDLE&isGhanaContext=true",
  ];

  for (const route of routes) {
    await requireOk(route);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    if (server.pid && process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      server.kill();
    }
    process.exit(process.exitCode ?? 0);
  });
