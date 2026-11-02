import { resolve } from "node:path";

const nextConfig = {
  outputFileTracingRoot: resolve("."),
  distDir: process.env.NSMQ_TEST_DIST ?? ".next",
  async rewrites() {
    return { fallback: [{ source: "/gallery/NSMQ-trophy.jpg", destination: "/gallery/nsmq-trophy.jpg" }] };
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
