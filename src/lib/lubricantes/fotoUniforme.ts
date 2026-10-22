/**
 * FOTOS DE PRODUCTO DE LUBRICANTES CON EL MISMO FORMATO (2026-10-22, dirección).
 *
 * Las fotos de WordPress traen márgenes distintos: la botella ocupa del 74 % al 100 % del alto
 * de su imagen (y algunas son verticales, sin margen). En el recuadro cuadrado de la tarjeta unas
 * se ven mucho más grandes que otras. `scripts/lubricantes/fotos-uniformes.ts` las rehace todas
 * igual: recorta lo que es fondo (transparente o casi blanco) y centra la botella en un lienzo
 * blanco cuadrado, ocupando como mucho la misma fracción del lado en todas.
 *
 * Aquí, la parte pura (con pruebas): dónde está el contenido y a qué tamaño se pone.
 */

/** Lado del lienzo cuadrado, en píxeles (la tarjeta lo pinta a ~273 px; 2× de sobra). */
export const LADO_LIENZO = 800;
/** Fracción del lado que ocupa la botella en su dimensión mayor: el margen común. */
export const FRACCION_CONTENIDO = 0.86;

/** Un píxel es fondo si es casi transparente o casi blanco. */
export const ALFA_MINIMO = 20;
export const BLANCO_MINIMO = 235;

export type Caja = { x: number; y: number; ancho: number; alto: number };

/**
 * La caja del contenido (lo que no es fondo) de una imagen en bruto RGBA (`canales` = 4).
 * `null` si toda la imagen es fondo.
 */
export function cajaDelContenido(
  datos: Uint8Array,
  ancho: number,
  alto: number,
  canales: number,
): Caja | null {
  let x0 = ancho;
  let y0 = alto;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * canales;
      const alfa = canales === 4 ? datos[i + 3]! : 255;
      const blanco =
        datos[i]! > BLANCO_MINIMO && datos[i + 1]! > BLANCO_MINIMO && datos[i + 2]! > BLANCO_MINIMO;
      if (alfa > ALFA_MINIMO && !blanco) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

/**
 * Tamaño y posición del contenido en el lienzo: su dimensión mayor ocupa `fraccion` del lado,
 * conserva la proporción y queda centrado.
 */
export function encajeEnLienzo(
  contenido: { ancho: number; alto: number },
  lado = LADO_LIENZO,
  fraccion = FRACCION_CONTENIDO,
): Caja {
  const maximo = Math.round(lado * fraccion);
  const escala = maximo / Math.max(contenido.ancho, contenido.alto);
  const ancho = Math.max(1, Math.round(contenido.ancho * escala));
  const alto = Math.max(1, Math.round(contenido.alto * escala));
  return {
    x: Math.round((lado - ancho) / 2),
    y: Math.round((lado - alto) / 2),
    ancho,
    alto,
  };
}
