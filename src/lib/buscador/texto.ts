/**
 * TEXTO DEL BUSCADOR (2026-11-18): cómo se «lee» lo que escribe el visitante y lo que hay en el
 * catálogo para que casen aunque estén escritos distinto. Puro, sin dependencias.
 *
 * - Sin mayúsculas, tildes ni signos: «Filtración» = «filtracion», «ZX-200» = «zx 200».
 * - Los MODELOS se parten donde una letra toca un número: «ZX200LC» → zx · 200 · lc, igual que
 *   «zx 200 lc» y «ZX-200LC». Así «zx200lc» encuentra «ZX200» (casan zx y 200).
 * - Plurales: se quita la «s» o «es» final de las palabras de 4 letras o más.
 */

/** Quita tildes y diéresis (la «ñ» queda como «n»: el visitante rara vez la escribe). */
export function sinTildes(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Minúsculas, sin tildes, y todo lo que no es letra o número, como espacio. */
export function plegar(texto: string): string {
  return sinTildes(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Palabras de un texto ya plegado, con las letras y los números separados («zx200» → zx, 200). */
export function palabras(texto: string): string[] {
  const plano = plegar(texto);
  if (!plano) return [];
  return plano
    .replace(/([a-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([a-z])/g, "$1 $2")
    .split(" ")
    .filter(Boolean);
}

/** La forma sin plural: «excavadoras» → «excavadora», «filtros» → «filtro», «cargadores» → «cargador». */
export function singular(palabra: string): string {
  if (palabra.length < 4 || /[0-9]/.test(palabra)) return palabra;
  if (palabra.endsWith("ces")) return palabra.slice(0, -3) + "z";
  if (palabra.endsWith("es") && /[rnldz]es$/.test(palabra) && palabra.length > 5) {
    return palabra.slice(0, -2);
  }
  if (palabra.endsWith("s") && !palabra.endsWith("ss")) return palabra.slice(0, -1);
  return palabra;
}

/** Palabras de búsqueda de un texto: plegadas, partidas y en singular. */
export function terminos(texto: string): string[] {
  return palabras(texto).map(singular);
}

/** El texto sin separadores: «ZX-200 LC» → «zx200lc». Sirve para comparar modelos de forma exacta. */
export function compacto(texto: string): string {
  return plegar(texto).replace(/ /g, "");
}

/**
 * Distancia de edición con transposiciones (Damerau–Levenshtein restringida), cortada en `tope`:
 * devuelve `tope + 1` si la distancia es mayor. Acota el trabajo del buscador por letra.
 */
export function distancia(a: string, b: string, tope: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  const n = a.length;
  const m = b.length;
  let anterior2: number[] = [];
  let anterior = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const actual = [i];
    let minimo = i;
    for (let j = 1; j <= m; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      let valor = Math.min(
        (anterior[j] ?? 0) + 1,
        (actual[j - 1] ?? 0) + 1,
        (anterior[j - 1] ?? 0) + coste,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        valor = Math.min(valor, (anterior2[j - 2] ?? 0) + 1);
      }
      actual[j] = valor;
      if (valor < minimo) minimo = valor;
    }
    if (minimo > tope) return tope + 1;
    anterior2 = anterior;
    anterior = actual;
  }
  return Math.min(anterior[m] ?? tope + 1, tope + 1);
}

/** Cuántos errores se toleran en una palabra de esta longitud (0 con 1–3 letras o con números). */
export function toleranciaDe(palabra: string): number {
  if (/[0-9]/.test(palabra)) return 0;
  if (palabra.length <= 3) return 0;
  if (palabra.length <= 6) return 1;
  return 2;
}
