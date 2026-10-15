import type { NextConfig } from "next";

const r2Host = (() => {
  try { return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null; } catch { return null; }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // fewer srcset candidates: smaller HTML and fewer variants for the optimizer to generate and cache
  images: {
    deviceSizes: [480, 750, 1080, 1440],
    imageSizes: [128, 256, 384],
    // listing photos live in Cloudflare R2 (lib/storage.ts); a custom photo domain is picked up from R2_PUBLIC_URL
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      ...(r2Host ? [{ protocol: "https" as const, hostname: r2Host }] : []),
    ],
  },
  allowedDevOrigins: ["192.168.10.251", "192.168.1.219"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  // Build machines can report dozens of cores; one build worker per core blew past an 8 GB limit.
  // Size the pool by free memory and cap it, and skip the source maps used only for prerender errors.
  enablePrerenderSourceMaps: false,
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
    cpus: 2,
    memoryBasedWorkersCount: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
