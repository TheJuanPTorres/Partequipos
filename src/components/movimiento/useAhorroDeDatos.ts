"use client";

import { useSyncExternalStore } from "react";

/** `navigator.connection` (Network Information API): solo Chromium la tiene. */
type Conexion = EventTarget & { saveData?: boolean };

const CONSULTA = "(prefers-reduced-data: reduce)";

function conexion(): Conexion | undefined {
  return (navigator as Navigator & { connection?: Conexion }).connection;
}

function suscribir(avisar: () => void) {
  const c = conexion();
  c?.addEventListener("change", avisar);
  return () => c?.removeEventListener("change", avisar);
}

/**
 * «Ahorro de datos» del visitante (`Save-Data` de Chrome en Android, o
 * `prefers-reduced-data`): con él, los vídeos de fondo NO se cargan y queda el
 * póster (dirección, 2026-10-17). En el servidor, `false`: el vídeo se decide en
 * el cliente, y el póster está siempre en el HTML.
 */
export function useAhorroDeDatos(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => conexion()?.saveData === true || matchMedia(CONSULTA).matches,
    () => false,
  );
}
