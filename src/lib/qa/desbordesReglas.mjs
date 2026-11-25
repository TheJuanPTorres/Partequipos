/**
 * Reglas puras de `qa:desbordes` (`scripts/qa/desbordes.mjs`), aparte para poder probarlas
 * (`desbordesReglas.test.ts`). En JS para que las use el script `.mjs` sin compilar.
 */

/**
 * Un control GRANDE (una tarjeta entera que es un solo enlace, de ~300 px) mide al menos esto
 * veces el WhatsApp flotante. Por debajo, es un control pequeño.
 */
export const VECES_GRANDE = 4;

/** Lo que el WhatsApp puede pisar de un control grande sin que cuente: el 12 % de su área. */
export const FRACCION_TOLERADA = 0.12;

/**
 * ¿Cuenta como TAPADO un control (enlace, botón, campo) que el WhatsApp flotante pisa?
 *
 * - Un control pequeño, siempre que lo pise algo (más de 2 × 2 px): no se puede pulsar bien.
 * - Un control grande (al menos `VECES_GRANDE` veces el botón), solo si le tapa más del
 *   `FRACCION_TOLERADA` de su área visible: con la mayor parte libre, se pulsa por otro sitio
 *   (las tarjetas de repuestos y de usados, con el WhatsApp en una esquina de la foto).
 *
 * @param {{ area: number, pisada: number, areaFlotante: number }} m Áreas en px² (lo visible del
 *   control, lo que pisa el botón y el botón).
 */
export function tapadoCuenta({ area, pisada, areaFlotante }) {
  if (pisada <= 4) return false;
  const grande = area >= VECES_GRANDE * areaFlotante;
  if (!grande) return true;
  return pisada / area > FRACCION_TOLERADA;
}

/**
 * Los marcadores de un mapa (Mapbox o MapLibre) los coloca el mapa y asoman por su borde al
 * moverlo o al cambiar el ancho (la sede de Cali a 3840): no es un recorte de la página.
 */
export const SELECTOR_MARCADOR_MAPA = ".mapboxgl-marker, .maplibregl-marker";
