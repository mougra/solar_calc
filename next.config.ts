import type { NextConfig } from "next";

/**
 * Два режима сборки:
 *  - обычный (SSR на VPS): output: standalone;
 *  - статический экспорт для shared-хостинга: BUILD_MODE=export → out/.
 */
const isStaticExport = process.env.BUILD_MODE === "export";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        output: "standalone" as const,
        images: {
          formats: ["image/avif", "image/webp"] as ("image/avif" | "image/webp")[],
        },
      }),
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  ...(isStaticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=()",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
