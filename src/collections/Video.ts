import type { CollectionConfig } from "payload";

import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { formatoDeVideoPermitido } from "./hooks/formatoDeVideoPermitido";
import { sinDescargaRemota } from "./hooks/sinDescargaRemota";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("videos");

/**
 * Vídeos: el fondo de la sección 7 de la home de ux-9 (y los de testimonios,
 * si algún día los hay).
 *
 * COLECCIÓN APARTE, `Media` NO SE TOCA. `Media` está restringida a JPEG, PNG y
 * WebP por la mitigación del CVE GHSA-2xp9-vwfh-vxw4 (CLAUDE.md §10.28).
 * Ampliarla para meter vídeo abriría esa lista. Aquí la lista es otra: MP4 y
 * WebM, comprobados POR CONTENIDO (`formatoDeVideoPermitido`, que además
 * rechaza un AVIF disfrazado de MP4).
 *
 * TAMAÑO: máximo 4 MB, porque la subida pasa por una función de Vercel y estas
 * cortan el cuerpo en 4,5 MB. El MP4 de ux-9 pesa 6,5 MB, y hay que reexportarlo
 * igualmente (H.264 de 8 bits, pendiente antes de la fase F). La subida directa
 * del navegador a Blob se estudió y se descartó de momento: ver
 * docs/diseno/decisiones-home-ux9.md §9.
 *
 * El control de pausa NO es un campo: es del componente y siempre está
 * (desviación D2). Un editor no puede quitarlo.
 *
 * `sharp` no interviene: Payload solo redimensiona imágenes.
 */
export const Video: CollectionConfig = {
  slug: "videos",
  labels: { singular: "Vídeo", plural: "Vídeos" },
  admin: {
    useAsTitle: "descripcion",
    defaultColumns: ["filename", "descripcion", "decorativo"],
    group: "Contenido",
    description: "Vídeos del sitio: MP4 o WebM, máximo 4 MB, con imagen de póster obligatoria.",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  upload: {
    mimeTypes: ["video/mp4", "video/webm"],
    // «Pegar URL» cerrado a propósito, como en Media (CLAUDE.md §10.32).
    pasteURL: false,
  },
  hooks: {
    // Sin el cierre, un vídeo traído por url se saltaría el tope de 4 MB (§10.32).
    beforeOperation: [sinDescargaRemota, formatoDeVideoPermitido],
    afterChange: [portada.afterChange],
    afterDelete: [portada.afterDelete],
  },
  fields: [
    {
      name: "descripcion",
      type: "textarea",
      required: true,
      label: "Qué muestra el vídeo",
      admin: {
        description:
          "Para quien no lo ve. Aunque sea decorativo, dilo aquí: es lo que queda en el panel.",
      },
    },
    {
      name: "poster",
      type: "upload",
      relationTo: "media",
      required: true,
      label: "Imagen de póster",
      admin: {
        description:
          "Lo que se ve antes de cargar, con «reducir movimiento» activado, al pausar y si el vídeo no se puede reproducir.",
      },
    },
    {
      name: "decorativo",
      type: "checkbox",
      label: "Es decorativo (no aporta información)",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Un vídeo de fondo sin información se oculta a los lectores de pantalla.",
      },
    },
  ],
};
