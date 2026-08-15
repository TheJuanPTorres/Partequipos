import type { CollectionConfig } from "payload";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Archivos subidos (imágenes, logos, etc.).
 * El almacenamiento NO es en disco local: lo gestiona el plugin de Vercel Blob
 * configurado en payload.config.ts (Vercel tiene FS de solo lectura en producción).
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  upload: true,
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Texto alternativo",
      admin: {
        description: "Descripción de la imagen para accesibilidad y SEO.",
      },
    },
  ],
};
