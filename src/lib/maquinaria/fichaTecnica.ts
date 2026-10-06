/**
 * DATOS DESTACADOS DE LA FICHA TÉCNICA de un equipo nuevo (ficha de producto
 * V2 de ux-9, docs/diseno/decisiones-ficha.md).
 *
 * En el diseño, la tarjeta principal enseña 4 datos con icono (peso, año…) y
 * cada tarjeta de «Otras referencias» enseña 3. En un equipo nuevo esos datos
 * salen de la ficha técnica: el editor marca «Destacar» en las filas que
 * quiere y elige un icono de esta lista corta. Los iconos son de Tabler
 * (licencia MIT, ya en uso en el sitio), no los de Flaticon del kit (L2).
 *
 * Este módulo es puro (sin Payload ni React): lo usan el panel (opciones y
 * validación) y la página (qué filas se pintan).
 */

export const ICONOS_FICHA = [
  { value: "peso", label: "Peso" },
  { value: "potencia", label: "Potencia" },
  { value: "motor", label: "Motor" },
  { value: "capacidad", label: "Capacidad (cucharón, carga)" },
  { value: "alcance", label: "Alcance o longitud" },
  { value: "profundidad", label: "Profundidad o altura" },
  { value: "velocidad", label: "Velocidad" },
  { value: "otro", label: "Otro dato" },
] as const;

export type IconoFicha = (typeof ICONOS_FICHA)[number]["value"];

/** La tarjeta principal tiene sitio para 4 datos; las de «Otras referencias», para 3. */
export const MAX_DESTACADAS = 4;
export const DESTACADAS_EN_TARJETA = 3;

export type FilaFicha = {
  etiqueta?: string | null;
  valor?: string | null;
  destacar?: boolean | null;
  icono?: string | null;
};

export type DatoDestacado = { etiqueta: string; valor: string; icono: IconoFicha };

const esIcono = (v: unknown): v is IconoFicha => ICONOS_FICHA.some((i) => i.value === v);

/** Filas completas de la ficha (las que tienen etiqueta y valor). */
export function filasCompletas<T extends FilaFicha>(filas: T[] | null | undefined): T[] {
  return (filas ?? []).filter((f) => f.etiqueta?.trim() && f.valor?.trim());
}

/**
 * Datos destacados, en el orden de la ficha y como mucho `max`. Una fila
 * marcada sin icono (o con uno que ya no existe) se pinta con «otro».
 */
export function destacadas(
  filas: FilaFicha[] | null | undefined,
  max: number = MAX_DESTACADAS,
): DatoDestacado[] {
  return filasCompletas(filas)
    .filter((f) => f.destacar)
    .slice(0, max)
    .map((f) => ({
      etiqueta: f.etiqueta!.trim(),
      valor: f.valor!.trim(),
      icono: esIcono(f.icono) ? f.icono : "otro",
    }));
}

/** Validación del panel: más de 4 filas marcadas no caben en la tarjeta. */
export function validarDestacadas(filas: FilaFicha[] | null | undefined): true | string {
  const n = (filas ?? []).filter((f) => f.destacar).length;
  if (n <= MAX_DESTACADAS) return true;
  return `Solo caben ${MAX_DESTACADAS} datos destacados en la ficha y hay ${n} marcados. Quita «Destacar» en ${n - MAX_DESTACADAS}.`;
}

/** Cuántas casillas «Destacar» están marcadas (valores tal cual del formulario). */
export function contarDestacadas(valores: readonly unknown[]): number {
  return valores.filter((v) => v === true).length;
}

/**
 * Validación de la casilla «Destacar» de CADA fila: el mismo criterio que
 * `validarDestacadas`, pero el mensaje sale junto a la casilla marcada. Puesto
 * en el array, Payload solo enseñaba «El siguiente campo es inválido: Ficha
 * técnica» y el editor no veía qué corregir (revisión en pantalla del
 * 2026-10-06). Solo las casillas marcadas pueden ser el error.
 */
export function validarDestacarFila(
  valor: unknown,
  { data }: { data?: { fichaTecnica?: FilaFicha[] | null } | null },
): true | string {
  if (valor !== true) return true;
  return validarDestacadas(data?.fichaTecnica);
}
