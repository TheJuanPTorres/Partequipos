/**
 * Funciones puras de la importación de las FICHAS de maquinaria nueva desde
 * WordPress (`scripts/maquinaria/importar-fichas.ts`). En WordPress cada ficha
 * es una página de Elementor; `scripts/maquinaria/extraer-xml.py` saca de cada
 * una la galería, los textos y el botón del PDF. Lo común con los repuestos
 * (código, texto alternativo, nombre de las fotos, título para buscadores) se
 * reutiliza de `src/lib/repuestos/wordpress.ts`. Detalle y decisiones en
 * `docs/fichas-nuevas-importacion.md`.
 */
import { decodificarEntidades, nombreDeFicheroWp, textoPlano } from "../blog/wordpress";
import { fotoDeRepuesto, type FotoPlan } from "../repuestos/wordpress";

export type Par = { etiqueta: string; valor: string };

/** Qué es cada bloque de texto de la sección principal. */
export type ClaseTexto = "plantilla" | "especificaciones" | "texto";

/**
 * Un bloque de texto de Elementor es:
 * - `plantilla`: solo un shortcode `[elementor-template]` (un bloque común, no un dato);
 * - `especificaciones`: una tabla, o una lista con la etiqueta en negrita;
 * - `texto`: la descripción comercial.
 */
export function clasificarTexto(html: string): ClaseTexto {
  const sinShortcodes = textoPlano(html.replace(/\[elementor-template[^\]]*\]/g, ""));
  if (/\[elementor-template/.test(html) && !sinShortcodes) return "plantilla";
  if (/<table/i.test(html)) return "especificaciones";
  if (/<li[^>]*>\s*<strong>/i.test(html)) return "especificaciones";
  return "texto";
}

/** Texto de una celda o de un trozo: sin etiquetas, entidades decodificadas y espacios plegados. */
const limpio = (html: string) =>
  decodificarEntidades(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

/**
 * Etiqueta tal como la escribe WordPress, sin los dos puntos del final
 * («POTENCIA NETA:» → «POTENCIA NETA»). Ni mayúsculas ni ortografía se tocan:
 * decisión del cliente (2026-10-18), se migra todo como está en su web, con
 * las erratas, y se le pasa la lista. Hasta entonces se corregían 38 etiquetas
 * y se pasaban a minúsculas las escritas en mayúsculas.
 */
export function etiquetaLegible(texto: string): string {
  return texto.replace(/\s*:\s*$/, "").trim();
}

/**
 * Pares etiqueta/valor de un bloque de especificaciones. Tres formas en las
 * fichas de WordPress:
 * - tabla de 2 o 4 columnas, con la etiqueta en una celda y el valor en la
 *   siguiente (la celda de la etiqueta suele ir en negrita, pero no siempre);
 * - tabla del fabricante con `<th>` y una celda de grupo con `rowspan`
 *   («Motor» abarcando sus filas): el grupo no es un dato y se salta;
 * - lista con `<li><strong>ETIQUETA:</strong> valor</li>` (si la negrita se
 *   cerró tarde y se llevó el principio del valor, se le devuelve).
 * Las etiquetas pasan por `etiquetaLegible` (tal cual, sin los dos puntos). Las celdas vacías y los pares sin valor se descartan: no se inventa nada.
 */
export function paresDeEspecificaciones(html: string): Par[] {
  const pares: Par[] = [];
  const anadir = (etiqueta: string, valor: string) => {
    const e = etiquetaLegible(limpio(etiqueta));
    const v = limpio(valor);
    if (e && v) pares.push({ etiqueta: e, valor: v });
  };
  if (/<table/i.test(html)) {
    for (const fila of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
      const celdas = (fila.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).filter((c) => limpio(c));
      if (celdas.length % 2 === 1 && /^<t[dh][^>]*rowspan/i.test(celdas[0]!)) celdas.shift();
      for (let i = 0; i + 1 < celdas.length; i += 2) anadir(celdas[i]!, celdas[i + 1]!);
    }
    return pares;
  }
  for (const li of html.match(/<li[\s\S]*?<\/li>/gi) ?? []) {
    const m = li.match(/<strong>([\s\S]*?)<\/strong>([\s\S]*)<\/li>/i);
    if (!m) continue;
    // Negrita mal cerrada: «ANCHO: 1</strong>676 mm» → «Ancho» y «1676 mm».
    const partida = limpio(m[1]!).match(/^(.*?):\s*(\S.*)$/);
    if (partida) {
      const resto = limpio(m[2]!);
      const junto = /\d$/.test(partida[2]!) && /^\d/.test(resto);
      anadir(partida[1]!, `${partida[2]}${junto ? "" : " "}${resto}`);
    } else anadir(m[1]!, m[2]!);
  }
  return pares;
}

/**
 * Nombre de la ficha: el título de la página de WordPress, tal cual («Bulldozer
 * Case Construction 1150M Tier4»). Es el `<title>` que hoy publica el sitio y
 * el título por defecto de la ficha en el sitio nuevo.
 */
export const nombreDeFicha = (tituloWp: string) => textoPlano(tituloWp).replace(/\s+/g, " ").trim();

/**
 * Nombre de una foto en `Media`: el mismo esquema que los repuestos
 * (`fotoDeRepuesto`: id del adjunto y nombre, AVIF → WebP) con el prefijo
 * `wp-ficha-`, para reconocerlas y retirarlas por separado.
 */
export function fotoDeFicha(urlWp: string, idAdjunto: number, nombre: string): FotoPlan | null {
  const plan = fotoDeRepuesto(urlWp, idAdjunto, nombre);
  return plan && { ...plan, fichero: plan.fichero.replace(/^wp-repuesto-/, "wp-ficha-") };
}

/** Nombre del PDF en `documentos`: `wp-ficha-` y el nombre del fichero de WordPress. */
export function pdfDeFicha(urlWp: string): { fichero: string } | null {
  if (!/\.pdf(\?|$)/i.test(urlWp)) return null;
  return { fichero: `wp-ficha-${nombreDeFicheroWp(urlWp).replace(/^wp-/, "")}` };
}

/**
 * Peso operativo en kg, para el campo numérico que se use en los filtros
 * (aprobado para B). Busca la fila «Peso operativo / operacional / de
 * operación / en funcionamiento» y entiende t, kg y lb. `null` si no hay fila o no se entiende el
 * valor: nunca se adivina.
 */
export function pesoOperativoKg(pares: Par[]): number | null {
  const fila = pares.find((p) =>
    /^peso\s+(operativo|operacional|de\s+operaci[oó]n|en\s+funcionamiento)/i.test(p.etiqueta),
  );
  if (!fila) return null;
  const m = fila.valor.match(/(\d[\d.,]*)\s*(t|ton|toneladas|kg|lb|lbs)\b/i);
  if (!m) return null;
  const unidad = m[2]!.toLowerCase();
  const numero = unidad.startsWith("t") ? numeroEs(m[1]!, true) : numeroEnteroEs(m[1]!);
  if (numero === null) return null;
  const kg = unidad.startsWith("t")
    ? numero * 1000
    : unidad.startsWith("lb")
      ? numero * 0.45359237
      : numero;
  return Math.round(kg);
}

/**
 * Número escrito en español: el punto separa miles y la coma, decimales
 * («31.134» → 31134; «14,3» → 14.3). Con toneladas, un punto con 1–2 cifras
 * detrás es decimal («14.3 t»).
 */
function numeroEs(texto: string, toneladas: boolean): number | null {
  let t = texto.replace(/[.,]$/, "");
  if (toneladas && /^\d+\.\d{1,2}$/.test(t)) return Number(t);
  // Ningún grupo de miles empieza por 0: «0.717 t» son 717 kg (Ammann ARW 65).
  if (/^0[.,]\d+$/.test(t)) return Number(t.replace(",", "."));
  t = t.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * Cantidad en kg o lb: en las fichas de WordPress el separador de miles es
 * el punto o la COMA, indistintamente («31.134 kg», «1,700kg»). Solo vale un
 * número entero con grupos de 3 cifras; cualquier otra cosa («20,4000kg»,
 * «14,3 kg») es ambigua y da `null`: nunca se adivina.
 */
function numeroEnteroEs(texto: string): number | null {
  const t = texto.replace(/[.,]$/, "");
  if (!/^\d{1,3}([.,]\d{3})*$/.test(t) && !/^\d+$/.test(t)) return null;
  return Number(t.replace(/[.,]/g, ""));
}

/** Los enlaces (`href`) de un trozo de HTML, en orden y sin repetir. */
export function enlacesDe(html: string): string[] {
  return [...new Set([...html.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]!))];
}

/**
 * ERRORES DEL PROPIO WORDPRESS que NO se copian (decisión de dirección,
 * 2026-10-13, confirmada el 2026-10-18 aunque el cliente pide migrar todo tal
 * cual): un PDF de otro modelo, o un título o descripción para buscadores que
 * nombran otro modelo. Están en la lista para el cliente
 * (`docs/fichas-nuevas-importacion.md` §4). Por ruta.
 */
export const CORRECCIONES_WP: Readonly<
  Record<string, { sinPdf?: string; sinTituloSeo?: string; sinDescripcionSeo?: string }>
> = {
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-1150m/":
    { sinPdf: "WordPress enlaza el PDF de otro modelo (1650M)" },
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-580sv-tier4/":
    { sinTituloSeo: "el <title> de WordPress nombra otro modelo (580N)" },
  // Hallazgo de C (2026-10-13): su meta descripción es la de la 570 ST.
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-851-fx-tier4/":
    { sinDescripcionSeo: "la meta descripción de WordPress habla de otro modelo (570 ST)" },
  // La ficha del SV208 cuelga en WordPress donde van los tipos (auditoría de
  // estructura, 2026-10-17; `scripts/maquinaria/extraer-xml.py`, FICHAS_EN_TIPO).
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/vibrocompactador-case-sv208/":
    // Su <title> («sv 208») se copia tal cual (decisión del cliente, 2026-10-18).
    { sinPdf: "el PDF del fabricante que enlaza WordPress responde 403" },
};

// ---------- Descripción para buscadores (decisión de dirección, 2026-10-14) ----------

/** Pasa a mayúsculas y quita espacios, guiones y tildes: «CX-130D» y «cx 130d» comparan igual. */
const plegar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[\s-]+/g, "");

/**
 * El código del modelo que identifica la ficha, plegado: los trozos del código
 * hasta el primero con una cifra («1150M Tier4» → «1150M», «CX 130D Tier4» →
 * «CX130D»), o la última palabra del nombre si no hay código.
 */
export function codigoClave(codigo: string | null | undefined, nombre: string): string {
  const trozos = (codigo ?? "").trim().split(/\s+/).filter(Boolean);
  let base = "";
  for (const t of trozos) {
    base += t;
    if (/\d/.test(t)) break;
  }
  return plegar(base || nombre.trim().split(/\s+/).at(-1) || "");
}

/**
 * ¿El texto nombra ESE modelo? Busca el código como palabra, y también partido
 * en dos («SR 175B»). No vale como parte de otro código: «VIO50-6» no está en
 * un texto que dice «VIO50-6A».
 */
export function mencionaModelo(texto: string, clave: string): boolean {
  if (!clave) return false;
  const palabras = texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .split(/[^A-Z0-9-]+/)
    .filter(Boolean)
    .map((p) => p.replace(/-/g, ""));
  for (let i = 0; i < palabras.length; i++) {
    if (palabras[i] === clave) return true;
    if (palabras[i]! + (palabras[i + 1] ?? "") === clave) return true;
  }
  return false;
}

/** La primera frase del primer párrafo con texto de la descripción (sin títulos ni plantillas). */
export function primeraFrase(html: string): string | null {
  for (const p of html.match(/<p[\s\S]*?<\/p>/gi) ?? []) {
    const plano = textoPlano(p.replace(/\[elementor-template[^\]]*\]/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    if (!plano) continue;
    const frase = plano.match(/^[\s\S]+?[.!?](?=\s|$)/)?.[0] ?? plano;
    return frase.trim();
  }
  return null;
}

/** Máximo de la descripción generada (dirección: menos de 160 caracteres). */
export const MAX_DESCRIPCION_GENERADA = 159;

/**
 * Descripción generada con los datos de la ficha: distinta en cada una porque
 * lleva su nombre («Excavadora Hitachi ZX130-5B»), y de menos de 160
 * caracteres. Si el nombre es muy largo, una versión más corta.
 */
export function descripcionGenerada(nombre: string): string {
  const larga = `${nombre}: ficha técnica, fotos y cotización en Partequipos, Colombia.`;
  if (larga.length <= MAX_DESCRIPCION_GENERADA) return larga;
  const corta = `${nombre}: ficha técnica y cotización en Partequipos.`;
  return corta.length <= MAX_DESCRIPCION_GENERADA
    ? corta
    : `${nombre.slice(0, MAX_DESCRIPCION_GENERADA - 1).trimEnd()}…`;
}

export type OrigenDescripcion = "wordpress" | "frase" | "generada";

/**
 * Descripción para buscadores de una ficha (decisión de dirección, 2026-10-14).
 * Unas 50 fichas llevan en WordPress la de otro modelo, copiada de plantilla:
 * 1. la de WordPress, si nombra el modelo de la ficha (y no hay corrección que
 *    la descarte ni la lleva otra ficha: `descartarWp`);
 * 2. si no, la primera frase del texto de la propia ficha, si nombra el modelo;
 * 3. si tampoco, una generada con los datos de la ficha.
 */
export function descripcionSeoDeFicha(p: {
  metaWp: string | null;
  htmlDescripcion: string;
  nombre: string;
  codigo: string | null;
  descartarWp?: boolean;
}): { texto: string; origen: OrigenDescripcion } {
  const clave = codigoClave(p.codigo, p.nombre);
  if (p.metaWp && !p.descartarWp && mencionaModelo(p.metaWp, clave)) {
    return { texto: p.metaWp, origen: "wordpress" };
  }
  const frase = primeraFrase(p.htmlDescripcion);
  if (frase && mencionaModelo(frase, clave)) return { texto: frase, origen: "frase" };
  return { texto: descripcionGenerada(p.nombre), origen: "generada" };
}

// ---------- Etiquetas tal cual en fichas ya importadas (decisión del cliente, 2026-10-18) ----------

/** Una fila de la ficha técnica guardada (con su `id` y su «Destacar»). */
export type FilaGuardada = {
  id?: string | null;
  etiqueta: string;
  valor: string;
  destacar?: boolean | null;
};

/**
 * Las filas guardadas con la etiqueta de WordPress tal cual, conservando su
 * `id`, su valor y su «Destacar» (lo marca el editor). Solo si la ficha sigue
 * como la dejó la importación: mismas filas y mismos valores, en el mismo
 * orden. Si un editor la cambió, `null` (no se toca). Sin cambios, `"igual"`.
 */
export function etiquetasTalCual(
  guardadas: FilaGuardada[],
  deWordpress: Par[],
): FilaGuardada[] | "igual" | null {
  if (guardadas.length !== deWordpress.length) return null;
  if (guardadas.some((g, i) => g.valor !== deWordpress[i]!.valor)) return null;
  if (guardadas.every((g, i) => g.etiqueta === deWordpress[i]!.etiqueta)) return "igual";
  return guardadas.map((g, i) => ({ ...g, etiqueta: deWordpress[i]!.etiqueta }));
}
