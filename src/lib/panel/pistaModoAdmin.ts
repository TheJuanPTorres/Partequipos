/**
 * MODO ADMINISTRACIÓN SOBRE LA WEB (tanda 23, diseño de A aprobado): la PISTA que deja el panel en
 * el navegador para que la web sepa si merece la pena descargar el módulo de edición.
 *
 * - El panel la pone (`"1"`) al pintarse con usuario (`Salir`, que solo existe con sesión) y la
 *   quita al cerrar sesión y en la pantalla de acceso (sesión caducada o cerrada por inactividad).
 * - **NO ES AUTORIZACIÓN.** Cualquiera puede escribirla a mano: la web, después de leerla, pregunta
 *   a `/api/users/me` y solo enseña algo si hay sesión del personal. La pista solo ahorra esa
 *   petición, y el módulo, a los visitantes normales.
 * - `localStorage` puede fallar (modo privado, bloqueado): se ignora en silencio.
 */
export const CLAVE_PISTA_MODO_ADMIN = "pq-modo-admin";
export const VALOR_PISTA_MODO_ADMIN = "1";

type Almacen = Pick<Storage, "setItem" | "removeItem" | "getItem">;

const almacen = (): Almacen | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export function ponerPistaModoAdmin(a: Almacen | null = almacen()): void {
  try {
    a?.setItem(CLAVE_PISTA_MODO_ADMIN, VALOR_PISTA_MODO_ADMIN);
  } catch {
    // Sin almacenamiento, sin pista: la web simplemente no carga el módulo.
  }
}

export function quitarPistaModoAdmin(a: Almacen | null = almacen()): void {
  try {
    a?.removeItem(CLAVE_PISTA_MODO_ADMIN);
  } catch {
    // Nada que hacer.
  }
}

export function hayPistaModoAdmin(a: Almacen | null = almacen()): boolean {
  try {
    return a?.getItem(CLAVE_PISTA_MODO_ADMIN) === VALOR_PISTA_MODO_ADMIN;
  } catch {
    return false;
  }
}
