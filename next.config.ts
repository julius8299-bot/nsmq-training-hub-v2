import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve("."),
  distDir: process.env.NSMQ_TEST_DIST ?? ".next",
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
