import type { Documento, Media } from "@/payload-types";

import { poblado } from "../utils/relations";

/**
 * Lógica pura del bloque «DOCUMENTO EN VISOR» (2026-10-20): de un documento de
 * «Documentos» a lo que pinta el visor tipo libro. El acceso a datos está en
 * `lib/queries/getDocumentos.ts`.
 *
 * Lo que falta no rompe: una página sin URL o sin medidas se omite, y un
 * documento sin páginas se pinta solo como enlace de descarga (`paginas: []`).
 * Sin el PDF, nada.
 */

export type PaginaVisor = { url: string; width: number; height: number; alt: string };

export type VistaDocumentoVisor = {
  titulo: string;
  pdf: { url: string; tamano: string | null };
  /** Vacío: sin «Páginas como imágenes», solo el enlace. */
  paginas: PaginaVisor[];
};

/** «215 KB», «1,2 MB». Sin tamaño, nada. */
export function tamanoLegible(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;
}

export function vistaDeDocumento(
  doc: Pick<Documento, "titulo" | "url" | "filesize" | "paginas"> | null | undefined,
  tituloBloque?: string | null,
): VistaDocumentoVisor | null {
  if (!doc?.url) return null;
  const titulo = tituloBloque?.trim() || doc.titulo?.trim() || "Documento";
  const paginas = (doc.paginas ?? []).flatMap((p, i) => {
    const m = poblado<Media>(p);
    if (!m?.url || !m.width || !m.height) return [];
    return [
      {
        url: m.url,
        width: m.width,
        height: m.height,
        alt: m.alt?.trim() || `Página ${i + 1} de ${titulo}`,
      },
    ];
  });
  return { titulo, pdf: { url: doc.url, tamano: tamanoLegible(doc.filesize) }, paginas };
}

/**
 * El contador del visor: «1 / 5» con una página a la vista y «2–3 / 5» con
 * dos (el libro abierto). `indice` es la primera página visible, desde 0.
 */
export function textoContador(indice: number, total: number, dobles: boolean): string {
  const primera = Math.min(Math.max(indice, 0), Math.max(total - 1, 0)) + 1;
  const segunda = dobles && primera < total ? primera + 1 : null;
  return segunda ? `${primera}–${segunda} / ${total}` : `${primera} / ${total}`;
}
