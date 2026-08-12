/**
 * Verificación de Cloudflare Turnstile en el servidor.
 *
 * El widget del navegador solo produce un token; **no protege nada por sí
 * mismo**. Lo que protege es esta comprobación contra la API de Cloudflare, que
 * ocurre antes de persistir nada.
 *
 * CLAVES DE PRUEBA. Mientras no haya claves reales del cliente se usan las
 * públicas de Cloudflare, documentadas en
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/:
 *
 *   Site key   1x00000000000000000000AA  (siempre supera el reto, visible)
 *   Secret key 1x0000000000000000000000000000000AA  (siempre valida)
 *
 * Son claves de prueba: **aceptan cualquier token**, así que en este estado el
 * formulario NO está protegido de verdad. Al recibir las claves reales basta
 * rellenar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`; no hay que
 * tocar código.
 */

const SITE_KEY_PRUEBA = "1x00000000000000000000AA";
const SECRET_PRUEBA = "1x0000000000000000000000000000000AA";

const ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Clave pública del widget. Cae a la de prueba si no hay una configurada. */
export function turnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || SITE_KEY_PRUEBA;
}

/** ¿Estamos usando las claves de prueba? Sirve para avisarlo en el reporte. */
export function turnstileEnModoPrueba(): boolean {
  return !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
}

type RespuestaCloudflare = {
  success: boolean;
  "error-codes"?: string[];
};

/**
 * Comprueba el token contra Cloudflare.
 *
 * Ante un fallo de red se devuelve `false`, no se deja pasar. Es la decisión
 * conservadora: preferimos pedirle al usuario que reintente antes que abrir la
 * puerta a un envío sin verificar cada vez que Cloudflare tenga un mal minuto.
 */
export async function verificarTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() || SECRET_PRUEBA;

  const cuerpo = new URLSearchParams({ secret, response: token });
  if (ip) cuerpo.append("remoteip", ip);

  try {
    // Tiempo límite corto: el usuario está esperando con el formulario abierto.
    const respuesta = await fetch(ENDPOINT, {
      method: "POST",
      body: cuerpo,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!respuesta.ok) return false;

    const datos = (await respuesta.json()) as RespuestaCloudflare;
    return datos.success === true;
  } catch {
    return false;
  }
}
