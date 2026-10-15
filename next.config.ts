import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // fewer srcset candidates: smaller HTML and fewer variants for the optimizer to generate and cache
  images: { deviceSizes: [480, 750, 1080, 1440], imageSizes: [128, 256, 384] },
  allowedDevOrigins: ["192.168.10.251"],
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
