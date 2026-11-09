/**
 * ORDEN DE LOS TIPOS DE MAQUINARIA NUEVA (2026-10-22, dirección): el de la web antigua, para el
 * megamenú «Maquinaria pesada nueva → Por tipo de máquina» y el índice de tipos. Desde el
 * 2026-11-09 las CATEGORÍAS siguen el orden del panel (`unaEntradaPorTipo`); esta lista solo
 * ordena los tipos sueltos (sin categoría) y fue el orden inicial que sembró la migración. Se compara por
 * el COMIENZO del nombre y su raíz, sin tildes ni mayúsculas, así «Bulldozers» va donde «Bulldozer». Un
 * tipo que no está en la lista va detrás, por orden alfabético.
 */
export const ORDEN_TIPOS_NUEVA = [
  "bulldozer",
  "excavadoras",
  "motoniveladoras",
  "miniexcavadoras",
  "minicargadores",
  "retrocargadoras",
  "compactadores",
  "pavimentadoras",
  "cargadores",
] as const;

const normal = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

/** Posición en el orden de la web antigua; los que no están, al final. */
export function posicionDeTipo(nombre: string): number {
  // Sin «vibro» delante: «Vibrocompactador» va donde «Compactadores» (cliente, 2026-10-25), con
  // los nombres viejos y los nuevos.
  const n = normal(nombre).replace(/^vibro(?=compactador)/, "");
  // Por la raíz, sin la terminación («compactador»): «Compactadoras» y «Compactadores» son el mismo.
  const i = ORDEN_TIPOS_NUEVA.findIndex((clave) => n.startsWith(clave.replace(/(es|s)$/, "")));
  return i === -1 ? ORDEN_TIPOS_NUEVA.length : i;
}

/** Copia ordenada: la web antigua primero; empates y desconocidos, por nombre. */
export function ordenarTiposNueva<T>(tipos: readonly T[], nombreDe: (t: T) => string): T[] {
  return [...tipos].sort(
    (a, b) =>
      posicionDeTipo(nombreDe(a)) - posicionDeTipo(nombreDe(b)) ||
      nombreDe(a).localeCompare(nombreDe(b), "es"),
  );
}

/** La clave de un tipo: su puesto en la web antigua, o su nombre normalizado si no está. */
function claveDeTipo(nombre: string): string {
  const p = posicionDeTipo(nombre);
  return p < ORDEN_TIPOS_NUEVA.length ? `#${p}` : normal(nombre);
}

/**
 * UNA entrada por tipo, para el megamenú y el índice de tipos.
 *
 * EL ORDEN ES EL DEL PANEL (dirección, 2026-11-09): las categorías llegan ya ordenadas por su
 * `_order` (se arrastran en la lista de «Categorías de maquinaria nueva», `orderable`) y se
 * conservan en ese orden. La migración `…_categorias_nueva_orden` sembró como orden inicial el de
 * la web antigua (`ORDEN_TIPOS_NUEVA`), el que había hasta entonces.
 *
 * Desde el 2026-10-23 (dirección, tarea 9) la CATEGORÍA del tipo gana SIEMPRE al tipo de una
 * marca: «Por tipo de máquina» lleva a la página GENERAL del tipo (la de las categorías que
 * mezclan marcas, #326), aunque hoy solo tenga equipos de una marca. El tipo de una marca (casilla
 * «Tarjeta en el índice de tipos») solo sale si su tipo NO tiene categoría, para no perder la
 * entrada mientras se crea: va DETRÁS de las categorías, en el orden de la web antigua. Dos
 * categorías del mismo tipo: la de más marcas, en el puesto de la primera.
 */
export function unaEntradaPorTipo<T>(
  categorias: readonly { nombre: string; marcas: number; dato: T }[],
  tipos: readonly { nombre: string; dato: T }[],
): T[] {
  const porClave = new Map<string, { nombre: string; marcas: number; dato: T }>();
  for (const c of categorias) {
    const clave = claveDeTipo(c.nombre);
    const previa = porClave.get(clave);
    if (!previa || c.marcas > previa.marcas) porClave.set(clave, c);
  }
  const sueltos = new Map<string, { nombre: string; dato: T }>();
  for (const t of tipos) {
    const clave = claveDeTipo(t.nombre);
    if (!porClave.has(clave) && !sueltos.has(clave)) sueltos.set(clave, t);
  }
  return [
    ...[...porClave.values()].map((e) => e.dato),
    ...ordenarTiposNueva([...sueltos.values()], (e) => e.nombre).map((e) => e.dato),
  ];
}
