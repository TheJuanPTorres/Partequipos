/**
 * FICHEROS DEL BLOB SIN REGISTRO QUE LOS USE — lógica pura de
 * `npm run blob:huerfanos` (CLAUDE.md §10.39). Solo compara listas: el script
 * LEE el almacén y la base, y no borra nada. El borrado, por runbook de
 * dirección.
 */
export type FicheroBlob = { pathname: string; size: number; uploadedAt: Date };

/**
 * Nombres que un registro usa: su `filename` y los de sus tamaños derivados
 * (`sizes.<tamaño>.filename`), y el último segmento de su `url`.
 */
export function nombresDeRegistro(doc: Record<string, unknown>): string[] {
  const nombres: string[] = [];
  const anadir = (v: unknown) => {
    if (typeof v === "string" && v.trim()) nombres.push(v.trim());
  };
  anadir(doc.filename);
  if (typeof doc.url === "string") anadir(nombreDeUrl(doc.url));
  const sizes = doc.sizes;
  if (sizes && typeof sizes === "object") {
    for (const s of Object.values(sizes as Record<string, unknown>)) {
      if (s && typeof s === "object") anadir((s as { filename?: unknown }).filename);
    }
  }
  return nombres;
}

/** Último segmento de una URL del Blob, decodificado; `null` si no es del Blob. */
export function nombreDeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith(".public.blob.vercel-storage.com")) return null;
    const ruta = u.pathname.replace(/^\/+/, "");
    return ruta ? decodeURIComponent(ruta) : null;
  } catch {
    return null;
  }
}

/** Los ficheros del almacén cuyo nombre no usa ningún registro, del más viejo al más nuevo. */
export function huerfanos(ficheros: FicheroBlob[], usados: Iterable<string>): FicheroBlob[] {
  const enUso = new Set(usados);
  return ficheros
    .filter((f) => !enUso.has(f.pathname.replace(/^\/+/, "")))
    .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime());
}
