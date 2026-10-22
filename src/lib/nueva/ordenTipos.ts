/**
 * ORDEN DE LOS TIPOS DE MAQUINARIA NUEVA (2026-10-22, dirección): el de la web antigua, para el
 * megamenú «Maquinaria pesada nueva → Por tipo de máquina» y el índice de tipos. Se compara por
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
  const n = normal(nombre);
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
 * UNA entrada por tipo (2026-10-22), para el megamenú y el índice de tipos: si una categoría y
 * un tipo con casilla se llaman igual («Bulldozer» y «Bulldozers»), gana la CATEGORÍA solo si
 * mezcla marcas (2 o más); si no, el TIPO de esa marca. Dos categorías iguales: la de más marcas.
 * El resultado, en el orden de la web antigua.
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
  for (const t of tipos) {
    const clave = claveDeTipo(t.nombre);
    const previa = porClave.get(clave);
    if (!previa || previa.marcas < 2)
      porClave.set(clave, { nombre: t.nombre, marcas: 1, dato: t.dato });
  }
  return ordenarTiposNueva([...porClave.values()], (e) => e.nombre).map((e) => e.dato);
}
