import { resolve } from "node:path";

const nextConfig = {
  outputFileTracingRoot: resolve("."),
  distDir: process.env.NSMQ_TEST_DIST ?? ".next",
  async rewrites() {
    return { fallback: [{ source: "/gallery/NSMQ-trophy.jpg", destination: "/gallery/nsmq-trophy.jpg" }] };
  },
  // Database drivers load native code at runtime; Next.js must not bundle them.
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql", "@prisma/adapter-pg", "pg"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
