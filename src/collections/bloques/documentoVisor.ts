import type { Block } from "payload";

import { validarAncla } from "../../lib/fields/ancla";

/**
 * «DOCUMENTO EN VISOR» (2026-10-20, petición del cliente): un PDF de
 * «Documentos» que se lee como un libro, pasando páginas, con miniaturas,
 * zoom, pantalla completa y «Descargar PDF». Sustituye a los visores DearFlip
 * de WordPress (la página de la política de garantía tenía dos).
 *
 * El MISMO bloque sirve en dos sitios:
 * - en el campo «Bloques» de una página (`BLOQUES_PAGINA`), y
 * - dentro de cualquier texto enriquecido (bloque de Lexical, `payload.config.ts`),
 *   para ponerlo entre párrafos de una sección, como en la política de garantía.
 *
 * El visor usa las «Páginas como imágenes» del documento, que genera el script
 * `scripts/documentos/` al importar el PDF. Sin ellas, el bloque se pinta como
 * un enlace de descarga, nunca vacío.
 */
export const BloqueDocumentoVisor: Block = {
  slug: "documentoVisor",
  interfaceName: "BloqueDocumentoVisor",
  labels: { singular: "Documento en visor", plural: "Documentos en visor" },
  fields: [
    // Como el resto de bloques de página (`bloquesPagina.ts`); en el texto no se usa.
    {
      name: "ancla",
      type: "text",
      label: "Ancla",
      validate: validarAncla,
      admin: {
        description:
          "Opcional. Identificador para enlazar a este bloque, sin «#». Solo en los bloques de una página.",
      },
    },
    {
      name: "documento",
      type: "relationship",
      relationTo: "documentos",
      required: true,
      label: "Documento (PDF)",
      admin: {
        description:
          "El PDF de «Documentos». Para verlo como libro tiene que tener sus «Páginas como imágenes»; sin ellas sale solo el enlace para descargarlo.",
      },
    },
    {
      name: "titulo",
      type: "text",
      label: "Título",
      admin: { description: "Opcional. Vacío: el nombre del documento." },
    },
  ],
};
