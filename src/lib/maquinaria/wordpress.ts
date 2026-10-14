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
 * Etiqueta legible: sin los dos puntos del final y, si viene TODA en
 * mayúsculas («POTENCIA NETA»), en minúscula con la primera en mayúscula
 * («Potencia neta»). Si ya trae mayúsculas y minúsculas, tal cual. No se
 * corrige la ortografía: lo que escribió el cliente se respeta.
 */
export function etiquetaLegible(texto: string): string {
  const t = texto.replace(/\s*:\s*$/, "").trim();
  if (!/\p{Lu}/u.test(t) || t !== t.toUpperCase()) return t;
  const min = t.toLocaleLowerCase("es");
  return min.charAt(0).toLocaleUpperCase("es") + min.slice(1);
}

/**
 * Pares etiqueta/valor de un bloque de especificaciones. Tres formas en las
 * fichas de WordPress:
 * - tabla de 2 o 4 columnas, con la etiqueta en una celda y el valor en la
 *   siguiente (la celda de la etiqueta suele ir en negrita, pero no siempre);
 * - tabla del fabricante con `<th>` y una celda de grupo con `rowspan`
 *   («Motor» abarcando sus filas): el grupo no es un dato y se salta;
 * - lista con `<li><strong>ETIQUETA:</strong> valor</li>`.
 * Las celdas vacías y los pares sin valor se descartan: no se inventa nada.
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
    if (m) anadir(m[1]!, m[2]!);
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
  const numero = numeroEs(m[1]!, unidad.startsWith("t"));
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
  t = t.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Los enlaces (`href`) de un trozo de HTML, en orden y sin repetir. */
export function enlacesDe(html: string): string[] {
  return [...new Set([...html.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]!))];
}
