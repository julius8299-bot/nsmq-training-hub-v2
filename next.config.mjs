import { resolve } from "node:path";

const nextConfig = {
  outputFileTracingRoot: resolve("."),
  distDir: process.env.NSMQ_TEST_DIST ?? ".next",
  async rewrites() {
    return { fallback: [{ source: "/gallery/NSMQ-trophy.jpg", destination: "/gallery/nsmq-trophy.jpg" }] };
  },
  // Database drivers load native code at runtime; Next.js must not bundle them.
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql", "@prisma/adapter-pg", "pg"],
  // The Rust-free Prisma client loads its query compiler (.wasm) from disk at runtime; file tracing does not
  // detect that read, so ship it with every server function explicitly.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**/*"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
