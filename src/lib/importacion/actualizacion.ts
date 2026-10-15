/**
 * El modo `actualizar` de los importadores de usados y de fichas nuevas, por
 * tandas que AVANZAN.
 *
 * Antes, con `actualizar`, cada ejecución tomaba otra vez los primeros N de la
 * lista (10 o 20) y nunca pasaba de ahí: para repasarlas todas había que poner
 * `tanda=` mayor que el total. Ahora el manifiesto guarda qué registros se
 * actualizaron ya con ESA fuente, y cada ejecución sigue por donde iba.
 *
 * - La «huella» es el hash del fichero fuente. Con una fuente distinta (una
 *   exportación nueva del WordPress) la actualización empieza de cero sola.
 * - `reiniciar` la empieza de cero con la misma fuente.
 * - Sin `actualizar`, nada de esto se usa: la tanda avanza por lo que aún no
 *   se ha importado, como siempre.
 */
export type EstadoActualizacion = {
  /** Huella (hash) de la fuente con la que se está actualizando. */
  fuente: string;
  /** Claves de los registros ya actualizados con esa fuente. */
  hechas: string[];
};

/**
 * El estado con el que se trabaja en esta ejecución y lo que queda por
 * actualizar, en el orden de `planes`.
 */
export function pendientesDeActualizar<T>(
  planes: T[],
  clave: (p: T) => string,
  anterior: EstadoActualizacion | undefined,
  huella: string,
  reiniciar = false,
): { estado: EstadoActualizacion; pendientes: T[]; reiniciada: boolean } {
  const vale = !reiniciar && anterior !== undefined && anterior.fuente === huella;
  const estado: EstadoActualizacion = vale
    ? { fuente: huella, hechas: [...anterior.hechas] }
    : { fuente: huella, hechas: [] };
  const hechas = new Set(estado.hechas);
  return {
    estado,
    pendientes: planes.filter((p) => !hechas.has(clave(p))),
    reiniciada: anterior !== undefined && !vale,
  };
}

/** Apunta un registro como actualizado (sin repetirlo). */
export function marcarActualizada(estado: EstadoActualizacion, clave: string): void {
  if (!estado.hechas.includes(clave)) estado.hechas.push(clave);
}
