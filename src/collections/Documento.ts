import type { CollectionConfig } from "payload";

import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { almacenEsperado } from "./hooks/almacenEsperado";
import { formatoDePdfPermitido } from "./hooks/formatoDePdfPermitido";
import { revalidarDocumento, revalidarDocumentoBorrado } from "./hooks/maquinariaHooks";
import { sinDescargaRemota } from "./hooks/sinDescargaRemota";
import { sinRecorte } from "./hooks/sinRecorte";
import { fechaActualizado } from "../lib/fields/fechasDeLista";

/**
 * Documentos descargables en PDF: hoy, la ficha técnica completa de cada
 * equipo nuevo (botón «Descargar ficha técnica completa»).
 *
 * COLECCIÓN APARTE, `Media` NO SE TOCA (decisión de dirección, CLAUDE.md
 * §10.28): un PDF elegible en un campo de imagen rompería `next/image`, y
 * `Media` sigue restringida a JPEG, PNG y WebP. Aquí solo entra
 * `application/pdf`, comprobado por contenido (`formatoDePdfPermitido`).
 *
 * Se sirve desde el CDN del Blob, como las animaciones y los vídeos.
 */
export const Documento: CollectionConfig = {
  slug: "documentos",
  labels: { singular: "Documento", plural: "Documentos" },
  admin: {
    useAsTitle: "titulo",
    // Sin «Tamaño del archivo»: la lista lo da en bytes sin unidad («714»). El
    // tamaño, legible, sale al abrir el documento.
    defaultColumns: ["titulo", "filename", "updatedAt"],
    group: "Archivos",
    description:
      "Documentos en PDF para descargar desde el sitio (por ejemplo, la ficha técnica de un equipo). Máximo 30 MB. Las imágenes van en «Imágenes».",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  upload: {
    mimeTypes: ["application/pdf"],
    // «Pegar URL» cerrado a propósito, como en Media, vídeos y animaciones (§10.32).
    pasteURL: false,
    crop: false,
    focalPoint: false,
  },
  hooks: {
    beforeOperation: [almacenEsperado, sinDescargaRemota, sinRecorte, formatoDePdfPermitido],
    // Un PDF nuevo cambia de nombre (§10.32): las fichas que lo enlazan se revalidan.
    afterChange: [revalidarDocumento],
    afterDelete: [revalidarDocumentoBorrado],
  },
  fields: [
    // «Última modificación» como fecha relativa en la lista (F3).
    fechaActualizado,
    {
      name: "titulo",
      type: "text",
      required: true,
      label: "Nombre del documento",
      admin: { description: "Para el panel. Ej. «Ficha técnica Hitachi ZX130-7H»." },
    },
    /*
     * Las páginas del PDF como imágenes (2026-10-20), para el bloque «Documento
     * en visor». Las genera `scripts/documentos/paginas-documento.ts` al
     * importar el PDF: así el visor no carga pdf.js en el navegador.
     */
    {
      name: "paginas",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      label: "Páginas como imágenes",
      admin: {
        description:
          "Una imagen por página, en orden, para el «Documento en visor». Las genera el script al importar el PDF; si cambias el PDF, hay que volver a generarlas. Vacío: el visor muestra solo el enlace de descarga.",
      },
    },
  ],
};
