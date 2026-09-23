"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { estaPausado } from "./pausa";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function suscribir(avisar: () => void) {
  const mq = matchMedia(CONSULTA);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}

/**
 * `prefers-reduced-motion`, vivo: si el usuario lo cambia con la página
 * abierta, el componente se entera sin recargar.
 *
 * En el servidor devuelve `false`, que es lo que se prerenderiza. Por eso
 * NINGÚN componente debe ocultar nada en el render: el estado «oculto para
 * animar» se aplica después, en el cliente, y solo si hay movimiento.
 */
export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => matchMedia(CONSULTA).matches,
    () => false,
  );
}

/**
 * Estado de pausa de una pieza que se mueve sola (desviación D2): parte de
 * `prefers-reduced-motion` y, en cuanto el usuario pulsa, manda su elección.
 */
export function usePausa() {
  const reducido = useMovimientoReducido();
  const [eleccion, setEleccion] = useState<boolean | null>(null);
  const pausado = estaPausado(eleccion, reducido);
  const alternar = useCallback(() => setEleccion(!pausado), [pausado]);
  return { pausado, alternar };
}
