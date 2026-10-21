import { paginasDelLibro } from "@/lib/documentos/paginasLibro";
import { vistaDeDocumento } from "@/lib/documentos/visor";
import { getDocumentoParaVisor } from "@/lib/queries/getDocumentos";

import { VisorLibro, type PaginaLibro } from "./VisorLibro";
import estilos from "./visorLibro.module.css";

/**
 * «DOCUMENTO EN VISOR» (2026-10-20): un PDF de «Documentos» como libro. Lo usan
 * el bloque de página y el bloque dentro del texto enriquecido; los dos solo
 * saben el id del documento, así que se pide aquí con sus páginas.
 *
 * Sin «Páginas como imágenes», el enlace de descarga solo, nunca un hueco.
 * Las URL de las imágenes salen del optimizador (`getImageProps`): el visor
 * pide la página al ancho que se pinta.
 */
export async function DocumentoVisor({
  documento,
  titulo,
  conTitulo = true,
}: {
  documento: number | { id: number } | null | undefined;
  titulo?: string | null;
  /** `false` dentro del texto: lo nombra el encabezado de su sección (y el `aria-label`). */
  conTitulo?: boolean;
}) {
  const id = typeof documento === "object" ? documento?.id : documento;
  if (!id) return null;
  const vista = vistaDeDocumento(await getDocumentoParaVisor(id), titulo);
  if (!vista) return null;

  if (vista.paginas.length === 0) {
    return (
      <p className={estilos.soloEnlace}>
        <a href={vista.pdf.url} className={estilos.descargar} rel="noopener noreferrer">
          Descargar PDF: {vista.titulo}
          {vista.pdf.tamano ? (
            <span className={estilos.tamano}> (PDF, {vista.pdf.tamano})</span>
          ) : null}
        </a>
      </p>
    );
  }

  const paginas: PaginaLibro[] = paginasDelLibro(vista.paginas);

  return (
    <VisorLibro titulo={vista.titulo} pdf={vista.pdf} paginas={paginas} conTitulo={conTitulo} />
  );
}
