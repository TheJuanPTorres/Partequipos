/**
 * Lo que usa el sitio cuando los campos de «Buscadores y redes sociales»
 * quedan vacíos. UNA sola fuente para dos sitios: las páginas del catálogo
 * (en su `generateMetadata`) y el panel (`SeoGuiado`, que enseña al editor qué
 * saldrá en Google). Si cambia una plantilla aquí, cambian los dos a la vez.
 *
 * Solo funciones puras: lo importa también un componente de cliente.
 */

/** La primera palabra del nombre (el sustantivo), en minúscula y sin tildes. */
const primeraPalabra = (nombre: string) =>
  (nombre.trim().split(/\s+/)[0] ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Femenino si el SUSTANTIVO (la primera palabra) acaba en «-a» o «-as»: «Excavadora»,
 * «Motoniveladoras», «Regla Vibratoria», «Pavimentadoras Dynapac». Lo demás, masculino:
 * «Bulldozer», «Cargador Frontal», «Compactadores de Suelo», «Aditamentos».
 *
 * Los nombres de máquina pasan a SINGULAR (cliente, por SEO, 2026-10-23), y mientras se
 * renombran en el panel conviven los dos números: por eso mira el sustantivo, que
 * funciona con «Excavadora» y con «Excavadoras». Hasta entonces miraba la ÚLTIMA palabra
 * y solo «-as»: con «Excavadora» habría dicho «Excavadora usados».
 */
export function esFemenino(nombre: string): boolean {
  return /as?$/.test(primeraPalabra(nombre));
}

/** Plural si el sustantivo acaba en «-s»: «Excavadoras», «Compactadores de Suelo». */
export function esPlural(nombre: string): boolean {
  return primeraPalabra(nombre).endsWith("s");
}

/** `femenino` o `masculino` según el género del nombre (`esFemenino`). */
export function concuerda(nombre: string, femenino: string, masculino: string): string {
  return esFemenino(nombre) ? femenino : masculino;
}

/**
 * El adjetivo concordado en género y número, con mayúscula (dirección, 2026-10-23:
 * «Excavadora Usada», «Bulldozer Nuevo»). `raiz` sin la terminación: «Nuev», «Usad».
 */
export function adjetivoConcordado(nombre: string, raiz: string): string {
  return `${raiz}${esFemenino(nombre) ? "a" : "o"}${esPlural(nombre) ? "s" : ""}`;
}

/**
 * «el» o «la» delante del nombre de un equipo, con el género de su TIPO o su categoría
 * («la Excavadora Hitachi ZX130-5B», «el Compactador de suelo …», «el OKADA TOP 100» en
 * Aditamentos): el nombre del equipo puede empezar por la marca. Antes iba siempre «la».
 */
export const articuloDefinido = (tipo: string) => (esFemenino(tipo) ? "la" : "el");

/** «un» o «una» para un nombre en singular. */
export const articuloIndeterminado = (nombre: string) => (esFemenino(nombre) ? "una" : "un");

/**
 * «<tipo> <marca>», sin repetir la marca si el nombre del tipo ya la lleva
 * (auditoría de estructura, 2026-10-17: salía «Pavimentadoras Dynapac Dynapac»
 * y «Aditamentos Aditamentos»).
 */
export function tipoConMarca(tipo: string, marca: string): string {
  const t = tipo.trim();
  const m = marca.trim();
  const sinTildes = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const palabras = sinTildes(t).split(/[^a-z0-9]+/);
  const yaLaLleva =
    m !== "" &&
    sinTildes(m)
      .split(/\s+/)
      .every((p) => palabras.includes(p));
  return yaLaLleva || !m ? t : `${t} ${m}`;
}

/**
 * El tipo de máquina en un banner o título principal (petición del cliente, 2026-10-20):
 * empieza por mayúscula. Solo la PRIMERA letra: el resto, tal como está guardado
 * («Cargador Frontal» sigue así; «excavadora» → «Excavadora»). Hasta el 2026-10-22 pasaba el
 * resto a minúscula y salía «Cargador frontal» (dirección). Solo para encabezados: el cuerpo,
 * el SEO y las URL siguen como estaban.
 */
export function tipoEnTitulo(tipo: string): string {
  const t = tipo.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Título por defecto de cada página del catálogo, a partir de sus nombres. */
export const tituloPorDefecto = {
  tipoRepuesto: (tipo: string, marca: string) => `Repuestos para ${tipo.toLowerCase()} ${marca}`,
  modeloRepuesto: (modelo: string) => `Repuestos ${modelo}`,
  marcaRepuesto: (marca: string) => `Repuestos para maquinaria pesada ${marca}`,
  categoriaRepuestos: (categoria: string) => `${categoria} para maquinaria pesada`,
  marcaMaquinaria: (marca: string) => `Maquinaria pesada ${marca}`,
  tipoMaquinaria: (tipo: string, marca: string) => tipoConMarca(tipo, marca),
  categoriaNueva: (categoria: string) =>
    `${categoria.trim()} ${adjetivoConcordado(categoria, "Nuev")}`,
  categoriaUsada: (categoria: string) =>
    `${categoria.trim()} ${adjetivoConcordado(categoria, "Usad")}`,
  marcaUsada: (marca: string) => `Maquinaria ${marca} usada`,
  marcaLubricante: (marca: string) => `Lubricantes ${marca}`,
  categoriaLubricante: (categoria: string, marca: string) => `${categoria} | Lubricantes ${marca}`,
} as const;

/**
 * Descripción por defecto de las páginas del marketplace de usados, cuando ni
 * el grupo SEO ni la «Descripción» del registro tienen texto. Sin esto, salía
 * el texto general del sitio, que habla de REPUESTOS (revisión del panel,
 * 2026-10-13). Sin cifras: así la vista de Google del panel dice lo mismo que
 * la página publicada, aunque cambie el inventario.
 */
const COLA_USADOS =
  "en venta en Colombia: unidades revisadas, con fotos, año, horas de uso y peso. Consulta la disponibilidad con Partequipos.";

/**
 * Lo mismo para los listados de maquinaria NUEVA («Categoría secundaria»,
 * 2026-10-14): sin texto propio, no sale el general del sitio.
 */
const COLA_NUEVA =
  "en Colombia: equipos con ficha técnica, peso operativo, potencia y motor. Cotiza con Partequipos.";

export const descripcionPorDefecto = {
  categoriaNueva: (categoria: string) =>
    `${tituloPorDefecto.categoriaNueva(categoria)} ${COLA_NUEVA}`,
  categoriaUsada: (categoria: string) =>
    `${tituloPorDefecto.categoriaUsada(categoria)} ${COLA_USADOS}`,
  marcaUsada: (marca: string) => `${tituloPorDefecto.marcaUsada(marca)} ${COLA_USADOS}`,
} as const;

/** Largo máximo de la meta descripción: lo que pase se corta con «…». */
export const MAX_DESCRIPCION = 160;

/** Recorta una descripción a una longitud sensata para un meta tag. */
export function recortarDescripcion(texto: string, max = MAX_DESCRIPCION): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max - 1).trimEnd()}…`;
}

/** Longitudes que se le recomiendan al editor (lo que Google suele enseñar). */
export const RECOMENDADO = {
  titulo: { max: 60 },
  descripcion: { min: 120, max: MAX_DESCRIPCION },
} as const;

/** La marca al final del `<title>` (auditoría I2, decisión de dirección del 2026-10-07). */
export const SUFIJO_MARCA = " | Partequipos";

/**
 * El `<title>` que sale publicado: el título con « | Partequipos» al final,
 * salvo en la portada, si ya lleva la marca (no «… - Partequipos | Partequipos»)
 * o si con ella pasaría de los 60 caracteres que enseña Google: entonces va
 * sin marca, entero. Lo usan `buildMetadata` y la vista de Google del panel.
 */
export function tituloConMarca(titulo: string, path: string): string {
  const t = titulo.replace(/\s+/g, " ").trim();
  if (path === "/" || /partequipos/i.test(t)) return t;
  const conMarca = `${t}${SUFIJO_MARCA}`;
  return conMarca.length <= RECOMENDADO.titulo.max ? conMarca : t;
}
