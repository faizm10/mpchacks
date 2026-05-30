import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

// Monorepo-style layout: secrets live in repo-root .env.local, app runs from client/
const repoRoot = path.join(__dirname, "..");
const isDev = process.env.NODE_ENV !== "production";
loadEnvConfig(repoRoot, isDev);
loadEnvConfig(__dirname, isDev);

const nextConfig: NextConfig = {
  turbopack: {},
};

export default nextConfig;
