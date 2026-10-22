import { normalizar } from "./indice";

/**
 * LA CATEGORÍA DEL SITIO RELACIONADA con un artículo (propuesta, 2026-10-21):
 * la llamada final del artículo enlaza a la categoría del catálogo de la que
 * habla. Sin campo nuevo ni esquema: se deduce del TÍTULO del artículo.
 *
 * Una candidata es una categoría técnica de repuestos o una categoría de
 * maquinaria usada. Casa si una palabra DISTINTIVA de su nombre (de seis
 * letras o más, en singular aproximado y sin las genéricas «repuestos»,
 * «maquinaria»…) aparece en el título. Si casan varias, gana la que aparece
 * antes en el título; con empate, la primera de la lista (las de repuestos van
 * antes, porque el blog habla sobre todo de piezas).
 *
 * Es una heurística: puede no encontrar nada (el bloque no se pinta) o elegir
 * una categoría cercana pero no exacta. El camino exacto sería un campo
 * «Categoría relacionada» en el artículo, con su migración; queda propuesto
 * a dirección.
 */
export type CandidataRelacion = {
  nombre: string;
  href: string;
  /** De dónde sale: cambia el texto del enlace («Repuestos de…», «… usadas»). */
  tipo: "repuestos" | "usada" | "nueva";
};

const GENERICAS = new Set([
  "repuesto",
  "maquinaria",
  "componente",
  "miscelaneo",
  "mayor",
  "herramienta",
  "pesada",
  "equipo",
]);

/** Singular aproximado: sin «s» ni «es» finales. */
function raiz(palabra: string): string {
  if (palabra.endsWith("es") && palabra.length > 6) return palabra.slice(0, -2);
  if (palabra.endsWith("s") && palabra.length > 4) return palabra.slice(0, -1);
  return palabra;
}

function palabrasDistintivas(nombre: string): string[] {
  return normalizar(nombre)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(raiz)
    .filter((p) => p.length >= 6 && !GENERICAS.has(p));
}

export function categoriaRelacionada(
  titulo: string,
  candidatas: readonly CandidataRelacion[],
): CandidataRelacion | null {
  const textoTitulo = normalizar(titulo);
  let mejor: { candidata: CandidataRelacion; posicion: number } | null = null;
  for (const candidata of candidatas) {
    for (const palabra of palabrasDistintivas(candidata.nombre)) {
      const posicion = textoTitulo.search(new RegExp(`\\b${palabra}`));
      if (posicion < 0) continue;
      if (!mejor || posicion < mejor.posicion) mejor = { candidata, posicion };
    }
  }
  return mejor?.candidata ?? null;
}

/** El texto del enlace de la llamada final. */
export function textoEnlaceRelacionada(c: CandidataRelacion): string {
  if (c.tipo === "repuestos") return `Ver repuestos de ${c.nombre}`;
  if (c.tipo === "nueva") return `Ver ${c.nombre.trim()} nuevas`;
  return `Ver ${c.nombre.trim()} usadas`;
}

/**
 * ¿La entradilla repite el comienzo del cuerpo? (los artículos importados
 * llevan como entradilla el primer párrafo). Compara sin tildes, mayúsculas ni
 * signos: si el primer párrafo contiene la entradilla o la entradilla lo
 * contiene, no se pinta dos veces.
 */
export function entradillaRepiteCuerpo(entradilla: string, primerParrafo: string): boolean {
  const limpiar = (t: string) =>
    normalizar(t)
      .replace(/[^a-z0-9 ]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const e = limpiar(entradilla);
  const p = limpiar(primerParrafo);
  if (!e || !p) return false;
  return p.includes(e) || e.includes(p);
}

/** Palabras de un título que cuentan para parecerse a otro (cinco letras o más, en singular aproximado). */
function palabrasDeTitulo(titulo: string): Set<string> {
  return new Set(
    normalizar(titulo)
      .split(/[^a-z0-9]+/)
      .map(raiz)
      .filter((p) => p.length >= 5),
  );
}

/**
 * Los `n` artículos que más se parecen al actual (palabras en común de los
 * títulos y la categoría) y, a igualdad, los más recientes. Nunca el propio.
 * Siempre devuelve `n` si el blog tiene artículos de sobra: sin parecido, los
 * más recientes.
 */
export function articulosRelacionados<
  T extends { id: number; titulo: string; fecha: string; categoria: { slug: string } | null },
>(actual: T, todos: readonly T[], n = 3): T[] {
  const propias = palabrasDeTitulo(actual.titulo);
  const puntos = (a: T) =>
    [...palabrasDeTitulo(a.titulo)].filter((p) => propias.has(p)).length * 2 +
    (a.categoria && a.categoria.slug === actual.categoria?.slug ? 1 : 0);
  return todos
    .filter((a) => a.id !== actual.id)
    .map((a) => ({ a, p: puntos(a) }))
    .sort((x, y) => y.p - x.p || y.a.fecha.localeCompare(x.a.fecha) || y.a.id - x.a.id)
    .slice(0, n)
    .map(({ a }) => a);
}
