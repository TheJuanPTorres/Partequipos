/**
 * FLUIDEZ DEL MEGAMENÚ (dirección, 2026-10-25): que un desplegable nunca se trabe
 * ni se cruce con otro. Cada mejora es INDEPENDIENTE y este objeto es su
 * interruptor, como las del listado de usados (#320, `activasDe`): una en `false`
 * no corre su código.
 *
 * - M1 INTENCIÓN: el panel no se abre ni cambia al rozar un botón al pasar; espera
 *   `RETRASO_ABRIR_MS`. Y no se cierra al salir un instante: espera `RETRASO_CERRAR_MS`.
 * - M2 PASILLO SEGURO: al bajar en diagonal hacia el panel abierto, cruzar otro
 *   botón del menú no lo cambia (`dentroDelPasillo`).
 * - M3 UN SOLO PANEL: al pasar de un menú a otro, el marco no se cierra y reabre:
 *   ajusta su tamaño suavemente y el contenido se cruza en un fundido.
 * - M4 ACORDEONES SUAVES: los acordeones (también los del menú móvil) se abren y
 *   cierran con una animación de altura, y al abrir uno se cierra el que estaba
 *   abierto a su lado.
 *
 * Teclado y lectores de pantalla, como siempre. Con «reducir movimiento» no hay
 * animación (M3 y M4 cambian al instante; M1 y M2 siguen: no mueven nada).
 *
 * En un preview se prueban con `?anim=M1,M3` (`?anim=no`, ninguna); en el sitio
 * publicado, la URL no cuenta. El mismo parámetro manda en el pie (P1–P4): para
 * ver el pie como siempre, añadir sus claves (`?anim=M1,M2,M3,M4,P1,P2,P3,P4`).
 */
export const FLUIDEZ_MEGAMENU = {
  M1: true,
  M2: true,
  M3: true,
  M4: true,
} as const satisfies Record<string, boolean>;

export type MejoraMegamenu = keyof typeof FLUIDEZ_MEGAMENU;

/**
 * M1. Abrir: lo justo para no reaccionar al cruzar un botón de paso (un barrido
 * rápido tarda unos 50–80 ms por botón) sin que se note la espera al apuntar.
 */
export const RETRASO_ABRIR_MS = 120;

/** M1. Cerrar: más largo, para no cerrar al salirse un momento del panel o del botón. */
export const RETRASO_CERRAR_MS = 350;

/** Sin M1, el de siempre: se abre al instante y se cierra a los 200 ms. */
export const RETRASO_CERRAR_SIN_M1_MS = 200;

/** M2. Cuánto se espera, como mucho, mientras el puntero va por el pasillo hacia el panel. */
export const ESPERA_PASILLO_MS = 300;

/** M3 y M4: duración y curva de los cambios de tamaño y del fundido. */
export const DURACION_MARCO_MS = 260;
export const DURACION_ACORDEON_MS = 240;
export const CURVA_MENU = "cubic-bezier(0.33, 0, 0.2, 1)";

export type Punto = { x: number; y: number };
export type Caja = { left: number; top: number; right: number; bottom: number };

/** Signo del área del triángulo `a b c` (positivo: `c` a la izquierda de `a → b`). */
const lado = (a: Punto, b: Punto, c: Punto) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/**
 * M2. ¿Está `punto` dentro del PASILLO SEGURO? Es el triángulo entre donde estaba
 * el puntero (`origen`) y las dos esquinas de ARRIBA del panel abierto, con un
 * margen a cada lado (`holgura`). Si el puntero va dentro, se dirige al panel:
 * cruzar otro botón no cambia de menú. Un punto ya dentro del panel también vale.
 */
export function dentroDelPasillo(origen: Punto, punto: Punto, panel: Caja, holgura = 12): boolean {
  if (
    punto.x >= panel.left &&
    punto.x <= panel.right &&
    punto.y >= panel.top &&
    punto.y <= panel.bottom
  )
    return true;
  // El panel queda debajo: si el puntero no baja (o sube), no va hacia él.
  if (punto.y < origen.y) return false;
  const a = origen;
  const b = { x: panel.left - holgura, y: panel.top };
  const c = { x: panel.right + holgura, y: panel.top };
  const d1 = lado(a, b, punto);
  const d2 = lado(b, c, punto);
  const d3 = lado(c, a, punto);
  const negativo = d1 < 0 || d2 < 0 || d3 < 0;
  const positivo = d1 > 0 || d2 > 0 || d3 > 0;
  return !(negativo && positivo);
}
