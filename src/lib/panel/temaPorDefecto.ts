/**
 * TEMA CLARO POR DEFECTO EN EL PANEL (tanda 23, punto 1; Juan Pablo, 2026-11-24): el panel sale en
 * claro y el oscuro es una opción de cada usuario.
 *
 * Payload 3.89 guarda la elección en la cookie `payload-theme` (`light` o `dark`) y, SIN cookie,
 * sigue al sistema operativo (cabecera `Sec-CH-Prefers-Color-Scheme` en el servidor y
 * `prefers-color-scheme` en el navegador): quien tiene el equipo en oscuro veía el panel oscuro
 * sin haberlo pedido. `admin.theme: "light"` no sirve: quita el oscuro a todos.
 *
 * Así que, si la petición al panel llega sin una elección válida, `proxy.ts` pone la cookie en
 * `light`: en la petición (para que el servidor ya pinte en claro, sin parpadeo) y en la respuesta
 * (para el navegador). Quien elige «Oscuro» en su cuenta la cambia, y se respeta.
 *
 * DEPENDE DE PAYLOAD 3.89 (se revisa al actualizar): el nombre de la cookie
 * (`<cookiePrefix o "payload">-theme`) y que la lean `getRequestTheme` (`@payloadcms/next`) y el
 * `ThemeProvider` (`@payloadcms/ui`). La opción «Automático» de la cuenta borra la cookie, y aquí
 * volvería a claro: por eso va oculta (custom.scss).
 */
export const COOKIE_TEMA = "payload-theme";
export const TEMA_POR_DEFECTO = "light";

/** Un año, como la que pone Payload al elegir tema. */
export const VIGENCIA_COOKIE_TEMA_S = 365 * 24 * 60 * 60;

const TEMAS = new Set(["light", "dark"]);

/** ¿Es una ruta del panel? Solo `/admin` y lo que cuelga de él (no `/administracion`). */
export function esRutaDelPanel(ruta: string): boolean {
  return ruta === "/admin" || ruta.startsWith("/admin/");
}

/** El tema que hay que poner, o `null` si el usuario ya tiene una elección válida. */
export function temaQueFalta(cookieActual: string | undefined): typeof TEMA_POR_DEFECTO | null {
  return cookieActual !== undefined && TEMAS.has(cookieActual) ? null : TEMA_POR_DEFECTO;
}
