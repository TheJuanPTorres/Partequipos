/**
 * LÓGICA PURA DEL MOVIMIENTO — sin DOM, para poder probarla.
 *
 * Replica el widget «Título revelado por palabras» de Andrés
 * (`bangluxor_titulo_revelado_palabras_scroll`), leído de su código, no de la
 * página pintada. Lo que hace aquel widget con GSAP + ScrollTrigger:
 *
 * - Parte el texto en palabras; cada una va en una MÁSCARA `overflow: hidden`.
 * - Estado inicial: `yPercent: distancia` y `opacity: 0`. Ojo: la distancia es
 *   un PORCENTAJE del alto de la palabra, no píxeles. Con 100 la palabra
 *   empieza entera por debajo de su máscara.
 * - Anima a `yPercent: 0` y `opacity: 1`, con la misma duración y curva para
 *   las dos propiedades, y un escalón entre palabras.
 * - Se dispara con `start: "top 85%"`: cuando el BORDE SUPERIOR del bloque
 *   llega al 85 % del alto de la ventana. Por defecto, una sola vez.
 */

export type Curva = "power3.out" | "back.out";

export type Ritmo = {
  /** Segundos entre el arranque de una palabra y el de la siguiente. */
  escalon: number;
  /** Segundos que tarda cada palabra. */
  duracion: number;
  /** Desplazamiento inicial, en % del alto de la palabra (el `yPercent` de GSAP). */
  distancia: number;
  /** Fracción del alto de la ventana donde se dispara (`top 85%` = 0,85). */
  disparo: number;
  curva: Curva;
  /** Si es `false`, se vuelve a ocultar al salir por debajo del disparo. */
  unaVez: boolean;
};

/**
 * LOS TRES RITMOS de ux-9, medidos en `docs/diseno/elementor/1717.json`.
 * El disparo y la curva varían aparte de estos tres, así que no son ritmos:
 * se ajustan por instancia (títulos de sección al 95 %, la FAQ con rebote).
 */
export const RITMOS = {
  /** El valor por defecto del widget: títulos de sección, párrafo del vidrio, FAQ. */
  titulo: { escalon: 0.06, duracion: 0.9, distancia: 100 },
  /** El título grande del hero. */
  portada: { escalon: 0.3, duracion: 2, distancia: 50 },
  /** Casi a la vez y despacio: frase de marcas (sec. 3) y «Nuestra compañía» (sec. 7). */
  pausado: { escalon: 0.01, duracion: 2, distancia: 100 },
} as const satisfies Record<string, Pick<Ritmo, "escalon" | "duracion" | "distancia">>;

export type NombreRitmo = keyof typeof RITMOS;

const POR_DEFECTO = { disparo: 0.85, curva: "power3.out", unaVez: true } as const;

export function resolverRitmo(nombre: NombreRitmo, ajustes: Partial<Ritmo> = {}): Ritmo {
  const ritmo: Ritmo = { ...POR_DEFECTO, ...RITMOS[nombre], ...ajustes };
  if (!(ritmo.disparo > 0 && ritmo.disparo <= 1)) {
    throw new RangeError(`disparo debe estar en (0, 1]; llegó ${ritmo.disparo}`);
  }
  if (ritmo.escalon < 0 || ritmo.duracion <= 0) {
    throw new RangeError("escalon no puede ser negativo y duracion debe ser positiva");
  }
  return ritmo;
}

/**
 * ¿Ya pasó el bloque la línea de disparo?
 *
 * Se decide por la POSICIÓN y no por «está en pantalla»: un bloque que al
 * cargar ya quedó POR ENCIMA de la ventana (se entró a la página con el scroll
 * bajado, o por un ancla) también tiene que verse. Es lo que hace
 * ScrollTrigger; un IntersectionObserver a secas lo dejaría oculto.
 */
export function pasoElDisparo(
  bordeSuperior: number,
  altoVentana: number,
  disparo: number,
  adelanto = 0,
): boolean {
  return bordeSuperior <= altoVentana * disparo + adelanto;
}

/**
 * `rootMargin` del IntersectionObserver para que avise al cruzar la línea.
 * En píxeles, porque el adelanto lo es (un mismo lado no mezcla % y px).
 */
export function margenDeDisparo(disparo: number, altoVentana: number, adelanto = 0): string {
  const inferior = Math.round(adelanto - (1 - disparo) * altoVentana);
  return `0px 0px ${inferior}px 0px`;
}

/**
 * ADELANTO DEL DISPARO, en píxeles y por ancho (decisiones-home-ux9.md §27.3).
 *
 * MEDIDO en ux-9 pintado el 2026-10-05 a 390, 1010 y 1440: los títulos NO
 * arrancan en su `top 95%` / `top 85%` nominal. ScrollTrigger calcula las
 * posiciones al cargar y la página crece después (la sección 6–8 se fija y
 * alarga el recorrido, y las imágenes cargan tarde), así que desde la sección 5
 * los títulos arrancan ANTES de entrar en pantalla, y a 1440 los de las
 * secciones 2–4, algo DESPUÉS. Dirección pidió replicarlo: positivo, arranca
 * antes; negativo, después.
 */
export type Adelanto = { movil?: number; tablet?: number; escritorio?: number };

export const ADELANTOS = {
  /** Secciones 2 a 4: nominal en móvil y tablet; 110 px más tarde a 1440. */
  alto: { escritorio: -110 },
  /** Sección 5 (repuestos) y 6–8 (compañía). */
  medio: { movil: 280, tablet: 175, escritorio: 75 },
  /** Catálogo, testimonios y preguntas frecuentes. */
  bajo: { movil: 270, tablet: 520, escritorio: 420 },
} as const satisfies Record<string, Adelanto>;

/** El adelanto que toca a un ancho de ventana (cortes de 768 y 1025 px). */
export function adelantoPara(ancho: number, adelanto?: Adelanto): number {
  if (!adelanto) return 0;
  if (ancho < 768) return adelanto.movil ?? 0;
  if (ancho < 1025) return adelanto.tablet ?? 0;
  return adelanto.escritorio ?? 0;
}

/**
 * Normaliza como el widget: espacios, tabuladores y NBSP a un solo espacio;
 * `\n` es salto de línea forzado. Devuelve líneas de palabras.
 */
export function partirEnPalabras(texto: string): string[][] {
  return texto
    .replace(/\r/g, "")
    .replace(/[ \t ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim()
    .split("\n")
    .map((linea) => linea.split(" ").filter(Boolean))
    .filter((linea) => linea.length > 0);
}

/** Texto plano equivalente, para el nombre accesible. */
export function textoPlano(texto: string): string {
  return partirEnPalabras(texto)
    .map((l) => l.join(" "))
    .join(" ");
}

/*
 * CURVAS. Las de GSAP, exactas, como `linear()` de CSS muestreado; y una
 * `cubic-bezier` aproximada para navegadores sin `linear()` (Safari < 17.2).
 */
const FUNCIONES: Record<Curva, (t: number) => number> = {
  // GSAP power3.out = 1 − (1 − t)³
  "power3.out": (t) => 1 - (1 - t) ** 3,
  // GSAP back.out(1.4): el widget traduce «Back Out» a 1.4, no al 1.7 por defecto.
  "back.out": (t) => {
    const s = 1.4;
    const p = t - 1;
    return p * p * ((s + 1) * p + s) + 1;
  },
};

const APROXIMADAS: Record<Curva, string> = {
  "power3.out": "cubic-bezier(0.215, 0.61, 0.355, 1)",
  "back.out": "cubic-bezier(0.34, 1.4, 0.64, 1)",
};

export function curvaCss(curva: Curva, muestras = 24): string {
  const f = FUNCIONES[curva];
  const puntos: string[] = [];
  for (let i = 0; i <= muestras; i++) {
    const v = Math.round(f(i / muestras) * 10000) / 10000;
    puntos.push(String(v));
  }
  return `linear(${puntos.join(", ")})`;
}

export function curvaAproximada(curva: Curva): string {
  return APROXIMADAS[curva];
}

/** Valor de una curva en `t`: para las pruebas y para quien quiera dibujarla. */
export function evaluarCurva(curva: Curva, t: number): number {
  return FUNCIONES[curva](t);
}
