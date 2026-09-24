import type { CollectionConfig } from "payload";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { formatoDeImagenPermitido } from "./hooks/formatoDeImagenPermitido";
import { sinDescargaRemota } from "./hooks/sinDescargaRemota";
import { sinRecorte } from "./hooks/sinRecorte";

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
    /*
     * «Pegar URL» CERRADO A PROPÓSITO (CLAUDE.md §10.32). Con el valor por
     * defecto el panel descarga la url desde el navegador y el endpoint del
     * servidor ya estaba desactivado; `false` quita además el botón. Nadie lo
     * usa: se sube desde el equipo.
     */
    pasteURL: false,
    /*
     * RECORTE DESACTIVADO (CLAUDE.md §10.32): sobrescribía el fichero con el
     * mismo nombre y la caché de un año seguía sirviendo el original con las
     * medidas del recorte. `crop: false` quita el botón; el gancho `sinRecorte`
     * lo cierra en el servidor, que no mira esta opción.
     */
    crop: false,
  },
  /*
   * El mensaje de rechazo de Payload está cableado en inglés; este hook se
   * adelanta para decirlo en español. Ver el fichero del hook.
   */
  hooks: {
    // Primero el cierre de la descarga remota: esa vía no trae `req.file`, así
    // que el gancho de formato no la vería (§10.32).
    beforeOperation: [sinDescargaRemota, sinRecorte, formatoDeImagenPermitido],
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
