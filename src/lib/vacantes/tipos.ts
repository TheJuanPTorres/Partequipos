/**
 * VACANTES DE «TRABAJA CON NOSOTROS» (2026-10-23, decisión de Juan Pablo).
 *
 * Lo que la página necesita de cada vacante, y nada más: cargo, ciudad y el
 * enlace para verla y postular en Buk. NO guardamos datos personales: la
 * postulación ocurre en Buk.
 *
 * Hoy los datos salen del portal público de Buk (`portalBuk.ts`), una solución
 * TEMPORAL hasta tener la API oficial. La página solo conoce estos tipos y
 * `obtenerVacantes()` (`fuente.ts`): cambiar de origen no la toca.
 */
export type Vacante = {
  /** El cargo en escritura normal, sin la ciudad: «Analista TIC». */
  cargo: string;
  /** La ciudad, sin el departamento: «Bogotá». */
  ciudad: string;
  /** La vacante en Buk (https), donde se ve la oferta y se postula. */
  enlace: string;
};

/**
 * De dónde salen las vacantes que se pintan.
 *
 * - `vivo`: lectura correcta (de ahora o de las últimas 6 horas).
 * - `copia`: la última lectura falló; se pinta la última copia buena.
 * - `sinDatos`: falló y nunca hubo copia: estado vacío con enlace a Buk.
 * - `apagado`: el interruptor «Leer vacantes de Buk» está desmarcado.
 */
export type OrigenVacantes = "vivo" | "copia" | "sinDatos" | "apagado";

export type ResultadoVacantes = {
  origen: OrigenVacantes;
  vacantes: Vacante[];
  /** Fecha (ISO) de la lectura buena que se pinta, o `null`. */
  leidoEl: string | null;
};
