/**
 * «COMPACTADOR» PASA A «VIBROCOMPACTADOR» EN TODA LA WEB (decisión del cliente, 2026-10-25). Lógica
 * pura del script `scripts/nueva/vibrocompactador.ts`, que cambia los DATOS del panel; las URL no
 * cambian. Dos reglas:
 *
 * - **Nombres** (categorías, tipos y productos): la palabra pasa a «Vibrocompactador», en singular
 *   (regla del sitio, 2026-10-23), y cada palabra del nombre en minúscula pasa a mayúscula inicial
 *   salvo los enlaces («de», «para»…): «Compactador doble rodillo DYNAPAC CC900» → «Vibrocompactador
 *   Doble Rodillo DYNAPAC CC900». Las palabras en mayúsculas o con cifras no se tocan.
 * - **Textos** (descripciones, metas, títulos de PDF, textos alternativos, artículos): solo la palabra,
 *   con su número y su caja («compactadores» → «vibrocompactadores»).
 *
 * Lo que ya dice «vibrocompactador» no cambia (salvo un nombre en plural, que pasa a singular).
 */

const PALABRA = /(?<!\p{L})(vibro)?(compactador)(es)?(?!\p{L})/giu;
const ENLACES = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "para",
  "y",
  "e",
  "con",
  "en",
  "a",
  "por",
  "sin",
  "o",
  "u",
]);

/** «compactador» con la caja de `muestra`: todo mayúsculas, inicial mayúscula o minúsculas. */
function conCaja(palabra: string, muestra: string): string {
  if (muestra === muestra.toUpperCase()) return palabra.toUpperCase();
  if (muestra[0] === muestra[0]?.toUpperCase()) return palabra[0]!.toUpperCase() + palabra.slice(1);
  return palabra;
}

/** ¿Nombra la palabra (con o sin «vibro»)? */
export const nombraCompactador = (texto: string): boolean => {
  PALABRA.lastIndex = 0;
  return PALABRA.test(texto);
};

/** Un TEXTO: «compactador(es)» → «vibrocompactador(es)», con su caja; lo que ya es «vibro…», igual. */
export function aVibrocompactadorTexto(texto: string): string {
  return texto.replace(
    PALABRA,
    (todo, vibro: string | undefined, _base: string, plural?: string) =>
      vibro ? todo : conCaja(`vibrocompactador${plural ?? ""}`, todo),
  );
}

/** Un NOMBRE: la palabra en singular («Vibrocompactador») y cada palabra con mayúscula inicial. */
export function aVibrocompactadorNombre(nombre: string): string {
  if (!nombraCompactador(nombre)) return nombre;
  const cambiado = nombre.replace(PALABRA, (todo) => conCaja("vibrocompactador", todo));
  return cambiado
    .split(/(\s+)/)
    .map((p, i) => {
      if (/^\s+$/.test(p) || p === "") return p;
      // Solo las palabras en minúsculas y sin cifras: «DYNAPAC», «CC900» o «VI» se quedan.
      if (p !== p.toLowerCase() || /\d/.test(p)) return p;
      if (i > 0 && ENLACES.has(p)) return p;
      return p[0]!.toUpperCase() + p.slice(1);
    })
    .join("");
}

/** Copia de un texto enriquecido (Lexical) con cada nodo de texto pasado por `aVibrocompactadorTexto`. */
export function aVibrocompactadorRico<T>(valor: T): T {
  if (Array.isArray(valor)) return valor.map((v) => aVibrocompactadorRico(v)) as T;
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [
        k,
        k === "text" && typeof v === "string"
          ? aVibrocompactadorTexto(v)
          : aVibrocompactadorRico(v),
      ]),
    ) as T;
  }
  return valor;
}

/**
 * Para que el cliente lo confirme (punto 2 del encargo): un compactador que técnicamente NO es
 * vibratorio (de llantas o neumático) o un aditamento. El cambio se le aplica igual.
 */
export function avisoNoVibratorio(texto: string): string | null {
  if (/llantas|neum[aá]tic/i.test(texto)) return "de llantas/neumático: no vibratorio";
  if (/para\s+minicargador/i.test(texto)) return "aditamento: confirmar si vibra";
  return null;
}

/**
 * Para PINTAR un título grande: un guion suave (U+00AD) entre «Vibro» y «compactador», así en el
 * móvil la palabra se divide como «Vibro-compactador» en cualquier navegador (sin diccionario de
 * guiones, Chrome la partía por donde caía). Invisible si cabe; no va en datos ni en metadatos.
 */
export const conCorteSuave = (texto: string): string =>
  texto.replace(/(vibro)(compactador)/giu, "$1\u00AD$2");
