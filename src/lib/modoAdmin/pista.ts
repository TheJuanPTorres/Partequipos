/**
 * MODO ADMINISTRACIÓN SOBRE LA WEB (tanda 23, PROTOTIPO): la PISTA.
 *
 * El panel deja esta marca en el navegador (`localStorage`) cuando alguien entra con sesión, y la
 * quita al salir. La web la mira SOLO para decidir si descarga el módulo del modo administración:
 * un visitante sin ella no descarga nada ni hace ninguna petición.
 *
 * NO ES AUTORIZACIÓN. Cualquiera puede escribirla a mano en su navegador: lo único que consigue es
 * descargar el módulo, que pregunta al servidor (`/api/users/me/`, con la cookie httpOnly de la
 * sesión) y, sin sesión, borra la pista y no pinta nada.
 *
 * No viaja al servidor (no es una cookie), así que no toca la caché de las páginas.
 */
export const CLAVE_PISTA = "pq-modo-admin";
export const VALOR_PISTA = "1";

/** ¿Hay pista en este navegador? `false` si no hay `localStorage` (modo privado, servidor). */
export function hayPista(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_PISTA) === VALOR_PISTA;
  } catch {
    return false;
  }
}

export function quitarPista(): void {
  try {
    window.localStorage.removeItem(CLAVE_PISTA);
  } catch {
    // Sin `localStorage` no hay pista que quitar.
  }
}
