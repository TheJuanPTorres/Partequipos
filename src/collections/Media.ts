import type { CollectionConfig } from "payload";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { formatoDeImagenPermitido } from "./hooks/formatoDeImagenPermitido";

/**
 * Archivos subidos (imágenes, logos, etc.).
 * El almacenamiento NO es en disco local: lo gestiona el plugin de Vercel Blob
 * configurado en payload.config.ts (Vercel tiene FS de solo lectura en producción).
 */
export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Contenido",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  /*
   * FORMATOS PERMITIDOS — mitigación del CVE GHSA-2xp9-vwfh-vxw4 (CLAUDE.md
   * §10.28). El fallo está en `libheif`, dentro de `sharp`, al DECODIFICAR
   * ficheros AVIF, y `payload.config.ts` pasa `sharp` a `buildConfig`: sin esta
   * lista, un editor autenticado podía subir un `.avif` manipulado y nuestro
   * propio lambda lo decodificaba.
   *
   * La lista es también la de formatos que el sitio sirve de verdad. Payload la
   * usa en las dos direcciones: filtra el selector de ficheros del panel y
   * valida en el servidor, así que no depende del navegador.
   *
   * SVG queda fuera a propósito: es ejecutable (puede llevar script) y
   * `next.config.ts` no lo permite en el optimizador (`dangerouslyAllowSVG`
   * sigue en false).
   */
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  /*
   * El mensaje de rechazo de Payload está cableado en inglés; este hook se
   * adelanta para decirlo en español. Ver el fichero del hook.
   */
  hooks: {
    beforeOperation: [formatoDeImagenPermitido],
  },
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
