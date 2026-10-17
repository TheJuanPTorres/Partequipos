/**
 * «TIPOGRAFÍA DEL TÍTULO» DEL HERO (2026-10-17): de lo que guarda el panel
 * (`src/lib/fields/tipografiaTitulo.ts`) a lo que pinta `HeroPortada`.
 *
 * Todo llega como VARIABLES CSS en el propio título, con el estilo de siempre
 * como respaldo en `hero.module.css`: un campo vacío no escribe nada y el
 * título se pinta exactamente como antes. Puro, para poder probarlo.
 */

export type FormatoFuente = "woff2" | "woff" | "truetype";

/** Una fuente propia lista para su `@font-face`. */
export type FuenteHero = { familia: string; url: string; formato: FormatoFuente };

export type Pantalla = "escritorio" | "tablet" | "movil";
export const PANTALLAS: readonly Pantalla[] = ["escritorio", "tablet", "movil"];

/** Sufijo de las variables y atributos por pantalla (`--titulo-tam-e`, `data-pos-m`…). */
const LETRA: Record<Pantalla, string> = { escritorio: "e", tablet: "t", movil: "m" };
const SUFIJO_CAMPO: Record<Pantalla, string> = {
  escritorio: "Escritorio",
  tablet: "Tablet",
  movil: "Movil",
};

export type TipografiaTitulo = {
  fuente: FuenteHero | null;
  peso: number | null;
  tamano: Record<Pantalla, number | null>;
  interlineado: number | null;
  /** En % del tamaño de la letra (se pinta en em). */
  interletrado: number | null;
  /** `#rrggbb` o `#rgb`. */
  color: string | null;
  mayusculas: "uppercase" | "none" | "lowercase" | "capitalize" | null;
  alineacion: "left" | "center" | "right" | null;
  /** En % (0–100) de la tarjeta; `null` en un eje: como siempre en ese eje. */
  posicion: Record<Pantalla, { x: number | null; y: number | null } | null>;
};

/** La fila de la diapositiva tal como la da Payload (depth 1: la fuente, poblada). */
export type TipografiaGuardada =
  | {
      fuente?: unknown;
      peso?: string | null;
      color?: string | null;
      mayusculas?: string | null;
      alineacion?: string | null;
      interlineado?: number | null;
      interletrado?: number | null;
      [campo: string]: unknown;
    }
  | null
  | undefined;

const MAYUSCULAS = {
  mayusculas: "uppercase",
  normal: "none",
  minusculas: "lowercase",
  palabras: "capitalize",
} as const;
const ALINEACION = { izquierda: "left", centro: "center", derecha: "right" } as const;
const FORMATOS = new Set<FormatoFuente>(["woff2", "woff", "truetype"]);

/**
 * Solo URL del CDN del Blob, sin nada que pueda romper el `url("…")` del CSS
 * (comillas, paréntesis, barras invertidas, espacios, `<`). Es un dato de la
 * base, pero acaba dentro de una hoja de estilos.
 */
const RE_URL_FUENTE = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'()\\<>]+$/i;
const RE_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function numeroEn(v: unknown, min: number, max: number): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null;
}

/** La fuente poblada, si es utilizable. Un id suelto (sin poblar) no sirve: no hay URL. */
export function fuenteDe(v: unknown): FuenteHero | null {
  if (!v || typeof v !== "object") return null;
  const f = v as { id?: unknown; url?: unknown; formato?: unknown };
  if (typeof f.id !== "number" && typeof f.id !== "string") return null;
  if (typeof f.url !== "string" || !RE_URL_FUENTE.test(f.url)) return null;
  if (typeof f.formato !== "string" || !FORMATOS.has(f.formato as FormatoFuente)) return null;
  const id = String(f.id).replace(/[^a-z0-9]/gi, "");
  if (!id) return null;
  return { familia: `pq-fuente-${id}`, url: f.url, formato: f.formato as FormatoFuente };
}

/** `null` si no hay nada elegido: el título se pinta como siempre. */
export function tipografiaDe(t: TipografiaGuardada): TipografiaTitulo | null {
  if (!t) return null;
  const peso = Number(t.peso);
  const color = typeof t.color === "string" ? t.color.trim() : "";
  const tamano = {} as TipografiaTitulo["tamano"];
  const posicion = {} as TipografiaTitulo["posicion"];
  for (const p of PANTALLAS) {
    tamano[p] = numeroEn(t[`tamano${SUFIJO_CAMPO[p]}`], 12, 300);
    const x = numeroEn(t[`posicionX${SUFIJO_CAMPO[p]}`], 0, 100);
    const y = numeroEn(t[`posicionY${SUFIJO_CAMPO[p]}`], 0, 100);
    posicion[p] = x === null && y === null ? null : { x, y };
  }
  const r: TipografiaTitulo = {
    fuente: fuenteDe(t.fuente),
    peso: Number.isInteger(peso) && peso >= 100 && peso <= 900 && peso % 100 === 0 ? peso : null,
    tamano,
    interlineado: numeroEn(t.interlineado, 0.6, 3),
    interletrado: numeroEn(t.interletrado, -20, 100),
    color: RE_COLOR.test(color) ? color.toLowerCase() : null,
    mayusculas: MAYUSCULAS[t.mayusculas as keyof typeof MAYUSCULAS] ?? null,
    alineacion: ALINEACION[t.alineacion as keyof typeof ALINEACION] ?? null,
    posicion,
  };
  const vacia =
    !r.fuente &&
    r.peso === null &&
    r.interlineado === null &&
    r.interletrado === null &&
    !r.color &&
    !r.mayusculas &&
    !r.alineacion &&
    PANTALLAS.every((p) => r.tamano[p] === null && r.posicion[p] === null);
  return vacia ? null : r;
}

type Estilo = Record<string, string>;

/**
 * Variables del aspecto de las letras (fuente, grosor, interlineado,
 * interletrado, mayúsculas, color y alineación): van en el título y en la
 * parte de abajo del título partido.
 */
export function variablesDeLetra(t: TipografiaTitulo | null): Estilo {
  if (!t) return {};
  const v: Estilo = {};
  if (t.fuente) v["--titulo-fuente"] = `"${t.fuente.familia}", var(--hero-fuente)`;
  if (t.peso !== null) v["--titulo-peso"] = String(t.peso);
  if (t.interlineado !== null) v["--titulo-interlineado"] = String(t.interlineado);
  if (t.interletrado !== null) v["--titulo-interletrado"] = `${t.interletrado / 100}em`;
  if (t.mayusculas) v["--titulo-mayusculas"] = t.mayusculas;
  if (t.color) v["--titulo-color"] = t.color;
  if (t.alineacion) {
    v["--titulo-texto"] = t.alineacion;
    v["--titulo-alinear"] =
      t.alineacion === "left" ? "flex-start" : t.alineacion === "right" ? "flex-end" : "center";
  }
  return v;
}

/** Tamaño por pantalla: la variable y el atributo que activa su regla en el CSS. */
export function tamanosDelTitulo(t: TipografiaTitulo | null): {
  estilo: Estilo;
  datos: Record<string, "">;
} {
  const estilo: Estilo = {};
  const datos: Record<string, ""> = {};
  for (const p of PANTALLAS) {
    const tam = t?.tamano[p];
    if (tam == null) continue;
    estilo[`--titulo-tam-${LETRA[p]}`] = `${tam}px`;
    datos[`data-tam-${LETRA[p]}`] = "";
  }
  return { estilo, datos };
}

/**
 * POSICIÓN por pantalla, en % del área útil de la tarjeta (con el mismo margen
 * lateral que la máquina): 0 pega el título a ese borde y 100 al contrario
 * (el título se desplaza su propio x %/y %, así nunca se sale). El eje que no
 * se rellena se queda como siempre (centrado; arriba, a su altura).
 */
export function posicionDelTitulo(t: TipografiaTitulo | null): {
  estilo: Estilo;
  datos: Record<string, "">;
} {
  const estilo: Estilo = {};
  const datos: Record<string, ""> = {};
  for (const p of PANTALLAS) {
    const pos = t?.posicion[p];
    if (!pos) continue;
    const l = LETRA[p];
    datos[`data-pos-${l}`] = "";
    const util = (f: number) =>
      `calc(var(--hero-maquina-lado) + (100% - 2 * var(--hero-maquina-lado)) * ${f / 100})`;
    if (pos.x !== null) {
      estilo[`--pos-left-${l}`] = util(pos.x);
      estilo[`--pos-tx-${l}`] = `${-pos.x}%`;
    }
    if (pos.y !== null) {
      estilo[`--pos-top-${l}`] = util(pos.y);
      estilo[`--pos-ty-${l}`] = `${-pos.y}%`;
    }
  }
  return { estilo, datos };
}

/** Las fuentes propias del hero, sin repetir. */
export function fuentesDelHero(
  diapositivas: { tipografia: TipografiaTitulo | null }[],
): FuenteHero[] {
  const vistas = new Map<string, FuenteHero>();
  for (const d of diapositivas) {
    const f = d.tipografia?.fuente;
    if (f && !vistas.has(f.familia)) vistas.set(f.familia, f);
  }
  return [...vistas.values()];
}

/**
 * `@font-face` de las fuentes propias del hero. Declararlas NO las descarga:
 * el navegador pide una solo cuando pinta texto con ella, o sea, cuando se ve
 * el título de una diapositiva que la usa. `swap`: el título sale enseguida en
 * Inter y cambia al llegar la fuente. `font-weight: 100 900`: el fichero vale
 * para cualquier grosor (si no es variable, se pinta con el que tenga).
 */
export function reglasFontFace(fuentes: FuenteHero[]): string {
  return fuentes
    .filter((f) => RE_URL_FUENTE.test(f.url) && /^pq-fuente-[a-z0-9]+$/i.test(f.familia))
    .map(
      (f) =>
        `@font-face{font-family:"${f.familia}";src:url("${f.url}") format("${f.formato}");font-weight:100 900;font-style:normal;font-display:swap}`,
    )
    .join("");
}

export const MIME_FUENTE: Record<FormatoFuente, string> = {
  woff2: "font/woff2",
  woff: "font/woff",
  truetype: "font/ttf",
};
