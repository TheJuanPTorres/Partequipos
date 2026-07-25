import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `turbopack: {}` evita el warning de configuración webpack/Turbopack que
  // introduce withPayload (CLAUDE.md: Turbopack es el bundler por defecto en Next 16).
  turbopack: {},
  images: {
    // Permite a next/image cargar imágenes servidas desde el CDN de Vercel Blob.
    // El id del store es un subdominio variable, por eso el comodín.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default withPayload(nextConfig);
