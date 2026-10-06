/**
 * Verificación de Cloudflare Turnstile en el servidor.
 *
 * El widget del navegador solo produce un token; **no protege nada por sí
 * mismo**. Lo que protege es esta comprobación contra la API de Cloudflare, que
 * ocurre antes de persistir nada.
 *
 * TRES MODOS, decididos en un solo sitio (`modoTurnstile`):
 *
 * - **real**: hay claves reales del cliente (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` y
 *   `TURNSTILE_SECRET_KEY`). Widget y verificación de verdad.
 * - **prueba** (local y preview): sin claves se usan las públicas de prueba de
 *   Cloudflare, documentadas en
 *   https://developers.cloudflare.com/turnstile/troubleshooting/testing/:
 *
 *     Site key   1x00000000000000000000AA  (siempre supera el reto, visible)
 *     Secret key 1x0000000000000000000000000000000AA  (siempre valida)
 *
 *   **Aceptan cualquier token**: sirven para desarrollar sin cuenta, no protegen.
 * - **sin-claves** (PRODUCCIÓN sin claves reales, o con las de prueba): NO se
 *   pinta el widget —sería una protección falsa— y el servidor acepta el envío
 *   sin verificar, como dice CLAUDE.md §10.11, avisándolo con `console.error`.
 *   Decisión de dirección del 2026-10-06, tras ver la clave de prueba en el
 *   formulario de la ficha publicada.
 *
 * Al recibir las claves reales basta rellenar las dos variables en Vercel
 * (Production) y redesplegar; no hay que tocar código.
 */

const SITE_KEY_PRUEBA = "1x00000000000000000000AA";
const SECRET_PRUEBA = "1x0000000000000000000000000000000AA";

/** Las claves de prueba de Cloudflare: `1x`/`2x`/`3x`, ceros y dos letras. */
const CLAVE_DE_PRUEBA = /^[123]x0{20,}[A-F]{2}$/;

const ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type ModoTurnstile =
  | { modo: "real" | "prueba"; siteKey: string; secret: string }
  | { modo: "sin-claves"; motivo: string };

/** El entorno de Vercel: `production`, `preview`, `development` o nada (local). */
const enProduccion = (): boolean => process.env.VERCEL_ENV === "production";

/** Decide el modo con las variables del momento. */
export function modoTurnstile(): ModoTurnstile {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";

  if (enProduccion()) {
    if (!siteKey || !secret) {
      return { modo: "sin-claves", motivo: "faltan las claves reales de Turnstile" };
    }
    if (CLAVE_DE_PRUEBA.test(siteKey) || CLAVE_DE_PRUEBA.test(secret)) {
      return { modo: "sin-claves", motivo: "las claves de Turnstile son las de PRUEBA" };
    }
    return { modo: "real", siteKey, secret };
  }

  const site = siteKey || SITE_KEY_PRUEBA;
  const sec = secret || SECRET_PRUEBA;
  const deVerdad = !CLAVE_DE_PRUEBA.test(site) && !CLAVE_DE_PRUEBA.test(sec);
  return { modo: deVerdad ? "real" : "prueba", siteKey: site, secret: sec };
}

/** Clave pública del widget, o `null` si no debe pintarse (producción sin claves). */
export function turnstileSiteKey(): string | null {
  const m = modoTurnstile();
  return m.modo === "sin-claves" ? null : m.siteKey;
}

/** ¿Estamos con las claves de prueba? Sirve para avisarlo en el reporte. */
export function turnstileEnModoPrueba(): boolean {
  return modoTurnstile().modo === "prueba";
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
 *
 * En modo `sin-claves` (producción sin claves reales) no hay widget ni token:
 * se acepta sin verificar, como en §10.11, y queda escrito en el registro.
 */
export async function verificarTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const m = modoTurnstile();
  if (m.modo === "sin-claves") {
    console.error(
      `[turnstile] Envío aceptado SIN verificación anti-bot: ${m.motivo} en producción ` +
        `(CLAUDE.md §10.11). Hay que poner NEXT_PUBLIC_TURNSTILE_SITE_KEY y TURNSTILE_SECRET_KEY reales.`,
    );
    return true;
  }

  if (!token) return false;

  const cuerpo = new URLSearchParams({ secret: m.secret, response: token });
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
