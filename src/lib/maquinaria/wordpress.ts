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
 * ETIQUETAS CORREGIDAS (decisión de dirección, 2026-10-13): solo tildes,
 * erratas y mayúsculas sueltas en medio de la etiqueta. Los sinónimos NO se
 * unifican («Peso operacional» y «Peso operativo» siguen siendo dos): eso
 * cambiaría lo que dice el fabricante. La clave es la etiqueta tal como sale
 * de `etiquetaLegible`; se aplica en `etiquetaCorregida`.
 */
export const ETIQUETAS_CORREGIDAS: Readonly<Record<string, string>> = {
  "Alance maximo en el suelo": "Alcance máximo en el suelo",
  "Alcance maximo en el suelo": "Alcance máximo en el suelo",
  "Alcance Máximo horizontal": "Alcance máximo horizontal",
  "Altura de Transporte": "Altura de transporte",
  "Altura maxima de descarga con angulo de articulacion de 45°":
    "Altura máxima de descarga con ángulo de articulación de 45°",
  "Altura máxima de descarga con ángulo de articulación de 45º":
    "Altura máxima de descarga con ángulo de articulación de 45°",
  "Ancho de Transporte": "Ancho de transporte",
  "Bomba de los implementos hidraulicos": "Bomba de los implementos hidráulicos",
  "Bomba de ﬂujo variable": "Bomba de flujo variable",
  "Capacidad maxima de la cucharón colmado": "Capacidad máxima del cucharón colmado",
  "Elevación del braz de excavación a 3.660 mm (12’)":
    "Elevación del brazo de excavación a 3.660 mm (12’)",
  "Fabricante del Motor": "Fabricante del motor",
  "Fuerza de Arranque": "Fuerza de arranque",
  "Fuerza de excavacion del balde trasero (estándar)":
    "Fuerza de excavación del balde trasero (estándar)",
  "Fuerza de excavacion del brazo de penetracion (estándar)":
    "Fuerza de excavación del brazo de penetración (estándar)",
  "Largura de la hoja": "Largo de la hoja",
  "Longitud de Transporte": "Longitud de transporte",
  "Longitud total con brazo de penetracion estándar":
    "Longitud total con brazo de penetración estándar",
  "Maxima profundidad de excavacion (estándar)": "Máxima profundidad de excavación (estándar)",
  "Peso de Operación": "Peso de operación",
  "Potencia Bruta": "Potencia bruta",
  "Potencia Bruta (ISO 14396)": "Potencia bruta (ISO 14396)",
  "Potencia Bruta (SAE J1995)": "Potencia bruta (SAE J1995)",
  "Potencia Bruta SAE J1995 a 2500 rpm": "Potencia bruta SAE J1995 a 2500 rpm",
  "Potencia Neta": "Potencia neta",
  "Potencia Neta (SAE J1349)": "Potencia neta (SAE J1349)",
  "Potencia Neta SAE J1349 a 2500 rpm": "Potencia neta SAE J1349 a 2500 rpm",
  "Potência neta (SAE J1349)": "Potencia neta (SAE J1349)",
  "Presión de alívio principal (estándar)": "Presión de alivio principal (estándar)",
  "Profundidad maxima excavacion": "Profundidad máxima de excavación",
  "Rotación del circulo": "Rotación del círculo",
  "Tipo del Motor": "Tipo del motor",
  "Velocidad maxima de desplazamiento (avance)": "Velocidad máxima de desplazamiento (avance)",
  "Velocidad máxima de desplazamiento (Avance)": "Velocidad máxima de desplazamiento (avance)",
  "Área da la oruga no solo": "Área de la oruga en el suelo",
};

/**
 * Etiqueta legible: sin los dos puntos del final y, si viene TODA en
 * mayúsculas («POTENCIA NETA»), en minúscula con la primera en mayúscula
 * («Potencia neta»). Si ya trae mayúsculas y minúsculas, tal cual. La
 * ortografía solo se toca con la tabla `ETIQUETAS_CORREGIDAS`.
 */
export function etiquetaLegible(texto: string): string {
  const t = texto.replace(/\s*:\s*$/, "").trim();
  if (!/\p{Lu}/u.test(t) || t !== t.toUpperCase()) return t;
  const min = t.toLocaleLowerCase("es");
  return min.charAt(0).toLocaleUpperCase("es") + min.slice(1);
}

/** La etiqueta legible, con la corrección de la tabla si la tiene. */
export const etiquetaCorregida = (texto: string) => {
  const e = etiquetaLegible(texto);
  return ETIQUETAS_CORREGIDAS[e] ?? e;
};

/**
 * Pares etiqueta/valor de un bloque de especificaciones. Tres formas en las
 * fichas de WordPress:
 * - tabla de 2 o 4 columnas, con la etiqueta en una celda y el valor en la
 *   siguiente (la celda de la etiqueta suele ir en negrita, pero no siempre);
 * - tabla del fabricante con `<th>` y una celda de grupo con `rowspan`
 *   («Motor» abarcando sus filas): el grupo no es un dato y se salta;
 * - lista con `<li><strong>ETIQUETA:</strong> valor</li>` (si la negrita se
 *   cerró tarde y se llevó el principio del valor, se le devuelve).
 * Las etiquetas pasan por `etiquetaCorregida`. Las celdas vacías y los pares sin valor se descartan: no se inventa nada.
 */
export function paresDeEspecificaciones(html: string): Par[] {
  const pares: Par[] = [];
  const anadir = (etiqueta: string, valor: string) => {
    const e = etiquetaCorregida(limpio(etiqueta));
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

/**
 * ERRORES DEL PROPIO WORDPRESS que se corrigen al importar (decisión de
 * dirección, 2026-10-13). Están anotados para que el cliente los corrija
 * también en su web (`docs/fichas-nuevas-importacion.md`). Por ruta.
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
};
