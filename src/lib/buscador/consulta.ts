/**
 * Consulta del buscador del sitio (`/buscar/?q=…`), CLAUDE.md §10.33 p.9.
 *
 * Solo decide QUÉ se busca: la normalización de lo que escribe el visitante.
 * La búsqueda en sí (`getBusqueda.ts`) recibe el texto ya normalizado.
 */

/** Menos que esto no es una búsqueda: una letra casa con casi todo. */
export const LONGITUD_MINIMA = 2;
/** Más que esto no es un nombre de producto, y acota el trabajo de la base. */
export const LONGITUD_MAXIMA = 80;
/** Tope de resultados por grupo (equipos nuevos, usados, modelos, artículos). */
export const TOPE_POR_GRUPO = 12;

export type Consulta =
  { estado: "vacia" } | { estado: "corta"; texto: string } | { estado: "valida"; texto: string };

/**
 * `q` llega de la URL: puede faltar, repetirse (`?q=a&q=b`) o traer cualquier
 * cosa. Se toma el primer valor, se quitan los caracteres de control y los
 * comodines de `LIKE` (`%`, `_`, `\`), que no son parte de un nombre y harían
 * casar de más, se colapsan los espacios y se corta a `LONGITUD_MAXIMA`.
 */
export function normalizarConsulta(crudo: string | string[] | undefined): Consulta {
  const primero = Array.isArray(crudo) ? crudo[0] : crudo;
  if (typeof primero !== "string") return { estado: "vacia" };

  const texto = primero
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LONGITUD_MAXIMA)
    .trim();

  if (texto.length === 0) return { estado: "vacia" };
  if (texto.length < LONGITUD_MINIMA) return { estado: "corta", texto };
  return { estado: "valida", texto };
}
