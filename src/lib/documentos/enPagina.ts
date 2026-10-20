/**
 * Poner el «Documento en visor» en el texto de una página (2026-10-20). Lógica
 * pura sobre el JSON de Lexical; la usa `scripts/documentos/visor.ts`.
 *
 * El importador de WordPress dejó cada visor DearFlip como un PÁRRAFO QUE SOLO
 * ENLAZA AL PDF («Descargar en PDF: …»). Ese párrafo, y solo ese, se cambia por
 * el bloque del visor de su documento, en el mismo sitio. Un enlace a un PDF
 * dentro de una frase no se toca: el texto de alrededor se perdería.
 */

type Nodo = {
  type?: string;
  text?: string;
  url?: string;
  fields?: Record<string, unknown> | null;
  children?: Nodo[];
  [clave: string]: unknown;
};

export type EstadoLexical = { root: Nodo & { children: Nodo[] } };

export type DocumentoConUrl = { id: number; url: string; titulo?: string | null };

/** Sin query ni fragmento: la misma URL del Blob con o sin `?…`. */
const sinQuery = (u: string) => u.split(/[?#]/)[0] ?? u;

/** El nodo de bloque que guarda el BlocksFeature de Lexical para el visor. */
export function bloqueVisor(documento: number, id: string): Nodo {
  return {
    type: "block",
    version: 2,
    format: "",
    fields: { id, blockName: "", blockType: "documentoVisor", documento, titulo: null },
  };
}

/** La URL del enlace si el párrafo no tiene nada más (salvo espacios). */
function enlaceSolo(p: Nodo): string | null {
  if (p.type !== "paragraph") return null;
  const hijos = (p.children ?? []).filter(
    (h) => !(h.type === "text" && !(h.text ?? "").trim()) && h.type !== "linebreak",
  );
  if (hijos.length !== 1) return null;
  const h = hijos[0]!;
  if (h.type !== "link" && h.type !== "autolink") return null;
  const url = (h.fields?.url as string | undefined) ?? h.url;
  return typeof url === "string" ? url : null;
}

export function cambiarEnlacesPorVisor(
  estado: EstadoLexical | null | undefined,
  documentos: readonly DocumentoConUrl[],
  nuevoId: () => string,
): { estado: EstadoLexical | null; cambiados: { id: number; titulo: string }[] } {
  if (!estado?.root?.children) return { estado: estado ?? null, cambiados: [] };
  const porUrl = new Map(documentos.map((d) => [sinQuery(d.url), d]));
  const cambiados: { id: number; titulo: string }[] = [];
  const children = estado.root.children.map((n) => {
    const url = enlaceSolo(n);
    const doc = url ? porUrl.get(sinQuery(url)) : undefined;
    if (!doc) return n;
    cambiados.push({ id: doc.id, titulo: doc.titulo ?? `documento ${doc.id}` });
    return bloqueVisor(doc.id, nuevoId());
  });
  return cambiados.length
    ? { estado: { ...estado, root: { ...estado.root, children } }, cambiados }
    : { estado, cambiados };
}
