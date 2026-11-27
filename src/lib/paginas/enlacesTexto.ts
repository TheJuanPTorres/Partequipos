/**
 * ENLACES DEL TEXTO ENRIQUECIDO DE UNA PÁGINA, AL GUARDAR (tanda 26, tarea 6). Lexical admite
 * cualquier dirección en un enlace; su conversor solo la «sanea» al pintar. Aquí se rechaza antes
 * de guardar lo que no tiene que estar nunca: `javascript:`, `data:`, `vbscript:`, `file:`… Se
 * admiten rutas del sitio («/…»), anclas («#…»), `https:`, `http:`, `mailto:` y `tel:`.
 *
 * Recorre TODO el documento (contenido, secciones, bloques…), así que cubre cualquier campo de
 * texto enriquecido de la colección, también los que se añadan después.
 */

const ESQUEMAS_PERMITIDOS = new Set(["http", "https", "mailto", "tel"]);

/** `null` si el enlace es aceptable; si no, el esquema que lo hace inaceptable. */
export function esquemaInseguro(url: string): string | null {
  // Los navegadores ignoran espacios y caracteres de control al leer el esquema («java\tscript:»).
  const limpio = url.replace(/[\u0000- \u007f-\u009f]/g, "").toLowerCase();
  const m = /^([a-z][a-z0-9+.-]*):/.exec(limpio);
  if (!m) return null; // relativo, ancla o ruta del sitio
  return ESQUEMAS_PERMITIDOS.has(m[1]!) ? null : `${m[1]}:`;
}

/** Los enlaces inseguros de un documento (dirección y esquema), en el orden en que aparecen. */
export function enlacesInseguros(datos: unknown): { url: string; esquema: string }[] {
  const encontrados: { url: string; esquema: string }[] = [];
  const visitar = (nodo: unknown, profundidad: number) => {
    if (!nodo || typeof nodo !== "object" || profundidad > 200) return;
    if (Array.isArray(nodo)) {
      for (const n of nodo) visitar(n, profundidad + 1);
      return;
    }
    const o = nodo as Record<string, unknown>;
    if ((o.type === "link" || o.type === "autolink") && o.fields && typeof o.fields === "object") {
      const url = (o.fields as { url?: unknown }).url;
      if (typeof url === "string") {
        const esquema = esquemaInseguro(url);
        if (esquema) encontrados.push({ url, esquema });
      }
    }
    for (const valor of Object.values(o)) visitar(valor, profundidad + 1);
  };
  visitar(datos, 0);
  return encontrados;
}

/** El mensaje para el editor, o `null` si no hay ninguno. */
export function errorDeEnlaces(datos: unknown): string | null {
  const malos = enlacesInseguros(datos);
  if (!malos.length) return null;
  const lista = [...new Set(malos.map((m) => m.esquema))].join(", ");
  return (
    `El texto tiene ${malos.length === 1 ? "un enlace" : `${malos.length} enlaces`} con una ` +
    `dirección no permitida (${lista}). Usa una ruta del sitio que empiece por «/», un ancla «#…» ` +
    "o una dirección https://, mailto: o tel:."
  );
}

/**
 * IMÁGENES SIN FICHERO (apoyo de C, 2026-11-27): al pegar desde Word o Google Docs, Lexical deja un
 * bloque de imagen VACÍO (nodo `upload` sin `value`) que se guardaba sin error y se pinta como un
 * hueco. Cuántos hay en el documento.
 */
export function imagenesSinFichero(datos: unknown): number {
  let n = 0;
  const visitar = (nodo: unknown, profundidad: number) => {
    if (!nodo || typeof nodo !== "object" || profundidad > 200) return;
    if (Array.isArray(nodo)) {
      for (const x of nodo) visitar(x, profundidad + 1);
      return;
    }
    const o = nodo as Record<string, unknown>;
    // Pegado de Word/Docs: `{ type: "upload", pending: { src: "file:///…" } }`, sin `relationTo` ni
    // `value`. Cualquier nodo de imagen sin un fichero de «Imágenes» cuenta.
    if (o.type === "upload") {
      const v = o.value;
      const sinFichero =
        v === null ||
        v === undefined ||
        v === "" ||
        (typeof v === "object" && !("id" in (v as object)));
      if (sinFichero || "pending" in o) n++;
    }
    for (const valor of Object.values(o)) visitar(valor, profundidad + 1);
  };
  visitar(datos, 0);
  return n;
}

/** El mensaje para el editor, o `null` si todas las imágenes del texto tienen su fichero. */
export function errorDeImagenesVacias(datos: unknown): string | null {
  const n = imagenesSinFichero(datos);
  if (!n) return null;
  return (
    `El texto tiene ${n === 1 ? "un bloque de imagen vacío" : `${n} bloques de imagen vacíos`} ` +
    "(suele pasar al pegar desde Word o Google Docs). Quítalo o elige su imagen en «Imágenes» antes de guardar."
  );
}
