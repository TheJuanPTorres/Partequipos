/**
 * Decisiones de la pantalla de acceso al panel (`src/components/admin/acceso/`),
 * separadas del componente para poder probarlas.
 *
 * La autenticación sigue siendo la de Payload (`POST /api/users/login`, bloqueo
 * por intentos, cookie de sesión): aquí solo se decide QUÉ SE DICE y si el botón
 * de Microsoft está activo. Detalle en `docs/diseno/decisiones-panel.md` §17.
 */

/** Lo que llega del campo `imagenAcceso` del global `seo` con `depth: 1`. */
export type ImagenAccesoGlobal =
  | number
  | { url?: string | null; width?: number | null; height?: number | null }
  | null
  | undefined;

export type ImagenAcceso = { url: string; width: number; height: number };

/**
 * La imagen del panel visual, elegida en «SEO y datos de la empresa» →
 * «Imágenes» → «Imagen de la pantalla de acceso». Si el campo está vacío, sin
 * poblar o sin medidas, `null`: la pantalla pinta el degradado.
 */
export function imagenDeAcceso(valor: ImagenAccesoGlobal): ImagenAcceso | null {
  if (!valor || typeof valor !== "object") return null;
  const url = valor.url?.trim();
  const { width, height } = valor;
  if (!url || !width || !height || width <= 0 || height <= 0) return null;
  return { url, width, height };
}

/**
 * Variable de entorno del botón «Continuar con Microsoft». Sin ella, o con un
 * valor que no sea una dirección `https://`, el botón sale DESACTIVADO con
 * «Próximamente». Hoy no está definida en ningún entorno: el inicio de sesión
 * con Microsoft (Auth Central, §10.29) no está construido.
 */
export const VARIABLE_MICROSOFT = "PANEL_ACCESO_MICROSOFT_URL";

/**
 * Dirección a la que lleva el botón de Microsoft, o `null` si va desactivado.
 * Solo se acepta `https://`: un valor mal escrito deja el botón apagado en vez
 * de llevar a cualquier sitio.
 */
export function urlMicrosoft(valor: string | undefined): string | null {
  const limpio = valor?.trim();
  if (!limpio) return null;
  try {
    const url = new URL(limpio);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export type Bloqueo = { intentos: number; minutos: number };

/**
 * Mensaje al fallar el acceso.
 *
 * Payload responde 401 tanto con una contraseña mala como con la cuenta
 * BLOQUEADA, pero con textos distintos —y el de bloqueo solo puede salir si el
 * correo existe—. Por eso aquí NO se lee el texto del servidor: cualquier 401
 * da el MISMO mensaje, que además avisa del bloqueo para que quien lo sufra
 * sepa por qué sigue sin entrar. Cualquier otro fallo (red, 5xx, 429) da un
 * mensaje genérico que no habla de credenciales.
 */
export function mensajeDeError(estado: number | null, bloqueo: Bloqueo): string {
  if (estado === 401 || estado === 403) {
    return `Correo o contraseña incorrectos. Tras ${bloqueo.intentos} intentos fallidos seguidos, el acceso se bloquea ${bloqueo.minutos} minutos.`;
  }
  if (estado === 400) return "Escribe tu correo y tu contraseña.";
  return "No se pudo iniciar sesión. Comprueba tu conexión e inténtalo de nuevo en unos segundos.";
}

/** Minutos de bloqueo a partir del `lockTime` de Payload (milisegundos). */
export function minutosDeBloqueo(lockTimeMs: number | undefined): number {
  // 600 000 ms es el valor por defecto de Payload si la colección no lo fija.
  return Math.max(1, Math.round((lockTimeMs ?? 600_000) / 60_000));
}
