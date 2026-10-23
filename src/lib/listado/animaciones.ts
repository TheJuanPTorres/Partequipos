/**
 * Las animaciones del listado de usados (dirección, 2026-10-21), cada una
 * INDEPENDIENTE: este objeto es su interruptor. Una en `false` desaparece del
 * todo (ni su CSS se activa ni su código corre), sin tocar las demás.
 *
 * - A1: entrada escalonada de las tarjetas al cargar y al filtrar.
 * - A2: el catálogo viejo se funde con el nuevo (View Transitions) y, si la
 *   respuesta tarda, tarjetas «esqueleto».
 * - A3: la tarjeta sube al pasar el ratón, con zoom de la foto y la flecha del botón.
 * - A4: el resaltado de la categoría actual se desliza de un botón a otro.
 * - A5: el contador de unidades cuenta hasta el valor nuevo.
 * - A6: las fotos entran con un fundido, sobre su miniatura borrosa.
 * - A7: la casilla dibuja su check y las etiquetas de los filtros entran suaves.
 * - A8: lista ↔ rejilla con transición de recolocación.
 *
 * Todas: misma curva y duración que «Ver más» de las categorías (salvo A4 y
 * A5, abajo), solo
 * `opacity` y `transform`, apagadas con «reducir movimiento» y, sin
 * JavaScript, la página como siempre.
 */
export const ANIMACIONES = {
  A1: true,
  A2: true,
  A3: true,
  A4: true,
  A5: true,
  A6: true,
  A7: true,
  A8: true,
} as const satisfies Record<string, boolean>;

export type Animacion = keyof typeof ANIMACIONES;

/** Duración y curva comunes (las de «Ver más», `listado.module.css`). */
export const DURACION_MS = 280;
export const CURVA = "cubic-bezier(0.33, 0, 0.2, 1)";

/**
 * Excepciones pedidas por dirección (2026-10-22) para que se noten: el
 * resaltado de la categoría (A4) viaja más despacio y frena al llegar, y el
 * contador (A5) frena al acercarse al número final.
 */
export const DURACION_DESLIZAR_MS = 380;
export const CURVA_FRENADA = "cubic-bezier(0.22, 1, 0.36, 1)";
export const DURACION_CONTADOR_MS = 700;

/** La curva de frenado como función (el contador no es CSS): `1 - (1 - t)^4`. */
export const frenar = (t: number) => 1 - (1 - t) ** 4;

/** Parámetro de la URL con el que se prueban en un preview (`?anim=A1,A3`; `?anim=no`, ninguna). */
export const PARAMETRO_ANIMACIONES = "anim";

/**
 * Las animaciones que se pintan de un juego de interruptores (el del listado
 * o, desde el 2026-10-22, el del pie, `lib/animacionesPie.ts`): las encendidas
 * y, si se permite (nunca en el sitio publicado), recortadas por `?anim=`. Sin
 * parámetro, todas las encendidas; con `no`, ninguna. Una apagada en el código
 * no se enciende desde la URL.
 */
export function activasDe<K extends string>(
  interruptores: Readonly<Record<K, boolean>>,
  parametro: string | string[] | null | undefined,
  permitirUrl: boolean,
): K[] {
  const todas = (Object.keys(interruptores) as K[]).filter((a) => interruptores[a]);
  const valor = Array.isArray(parametro) ? parametro[0] : parametro;
  if (!permitirUrl || valor === undefined || valor === null) return todas;
  const pedidas = new Set(
    valor
      .split(/[\s,]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean),
  );
  return todas.filter((a) => pedidas.has(a));
}

/** Las del listado (`ANIMACIONES`). */
export function animacionesActivas(
  parametro: string | string[] | undefined,
  permitirUrl: boolean,
): Animacion[] {
  return activasDe(ANIMACIONES, parametro, permitirUrl);
}

/**
 * Desde dónde cuenta el contador (A5) hasta `final`: desde el valor de antes,
 * pero sin pasar de los dígitos de `final`, para que el número nunca ocupe más
 * que el definitivo (así no empuja el texto). Sin valor de antes, o igual, no
 * cuenta (devuelve `final`).
 */
export function inicioDelContador(anterior: number | null, final: number): number {
  if (anterior === null || anterior === final || final < 0) return final;
  const tope = 10 ** String(final).length - 1;
  return Math.max(0, Math.min(anterior, tope));
}
