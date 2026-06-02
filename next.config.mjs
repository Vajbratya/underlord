import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This project lives nested inside another Next.js workspace on some dev
  // machines. Pin the root so Next never walks up and picks up a parent
  // lockfile / instrumentation.ts. Harmless on Vercel (already isolated).
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
