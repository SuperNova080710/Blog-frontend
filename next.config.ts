import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  // Ignore unrelated lockfiles above this app when inferring the Turbopack root.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
