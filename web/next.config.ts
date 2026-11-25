import type { NextConfig } from "next";

/**
 * The whole app runs in the browser (the Tử Vi engine is pure TypeScript),
 * so we ship a static export: `pnpm build` writes plain files to `out/`,
 * which any static web server (Caddy, nginx…) can serve. Security headers
 * are set by the web server — see deploy/.
 */
const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        // CSS modules must keep Turbopack's built-in module handling (`as: "*.css"` would make them global).
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
