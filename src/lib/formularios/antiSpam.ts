import { createHash, randomBytes } from "node:crypto";

import { CAMPO_TIEMPO, CAMPO_TRAMPA } from "./camposAntiSpam";

/**
 * FORMULARIOS SIN SPAM, SIN CAPTCHAS (2026-11-23, dirección). Lógica pura, con pruebas:
 *
 * 1. CAMPO TRAMPA (`sitio_web`): un campo que una persona no ve y un robot rellena. Con él relleno
 *    se responde «enviado» sin guardar nada, para que el robot no aprenda.
 * 2. TIEMPO MÍNIMO: el formulario lleva la hora a la que se mostró (`tiempo_inicio`); un envío
 *    que llega antes de `TIEMPO_MINIMO_MS` lo mandó un programa. Sin ese campo NO se rechaza (sin JavaScript no
 *    existe): perder una solicitud real es peor que algo de spam; quedan la trampa y el límite. Lo pone el navegador, así que un robot atento puede
 *    falsearlo: es una barrera más, no la única (el límite por IP y Turnstile siguen).
 * 3. LÍMITE POR IP, SIN GUARDAR LA IP: en memoria de cada instancia, con la IP convertida en una
 *    huella (SHA-256 con una sal que nace con la instancia y no se guarda en ninguna parte). La
 *    huella no se puede volver a la IP y desaparece al reiniciar o a los `VENTANA_MS`.
 *    APROXIMADO EN SERVERLESS: cada instancia cuenta por su cuenta, así que el tope real puede
 *    ser mayor; si hace falta más exactitud, se pasa a una tabla (con migración).
 */

// Los nombres de los campos viven en `camposAntiSpam.ts` (sin Node), que es de donde los toma
// el formulario; aquí se reexportan para el servidor y las pruebas.
export { CAMPO_TIEMPO, CAMPO_TRAMPA };

/** Menos que esto entre mostrar el formulario y enviarlo no lo escribe una persona. */
export const TIEMPO_MINIMO_MS = 3_000;
/** Un formulario abierto más de un día se da por caducado (la hora no vale). */
export const TIEMPO_MAXIMO_MS = 24 * 60 * 60 * 1_000;

export type VeredictoTiempo = "ok" | "muy-rapido" | "sin-dato";

export function trampaRellena(formData: FormData): boolean {
  const v = formData.get(CAMPO_TRAMPA);
  return typeof v === "string" && v.trim() !== "";
}

export function revisarTiempo(formData: FormData, ahora: number = Date.now()): VeredictoTiempo {
  const crudo = formData.get(CAMPO_TIEMPO);
  const inicio = typeof crudo === "string" ? Number(crudo) : Number.NaN;
  if (!Number.isFinite(inicio) || inicio <= 0) return "sin-dato";
  const pasado = ahora - inicio;
  // Una hora del futuro (reloj descuadrado) o caducada no se puede juzgar: se pide reenviar.
  if (pasado < TIEMPO_MINIMO_MS) return "muy-rapido";
  if (pasado > TIEMPO_MAXIMO_MS) return "sin-dato";
  return "ok";
}

export const VENTANA_MS = 10 * 60 * 1_000;
export const MAX_ENVIOS = 5;
const MAX_HUELLAS = 5_000;

export type LimitePorIp = {
  /** Cuenta un envío de esa IP; `false` si ya pasó el tope dentro de la ventana. */
  permitir: (ip: string | undefined, ahora?: number) => boolean;
  /** Para las pruebas: cuántas huellas hay en memoria. */
  tamano: () => number;
};

export function crearLimitePorIp(
  max: number = MAX_ENVIOS,
  ventanaMs: number = VENTANA_MS,
): LimitePorIp {
  const sal = randomBytes(16);
  const envios = new Map<string, number[]>();

  const huella = (ip: string) => createHash("sha256").update(sal).update(ip).digest("base64url");

  return {
    permitir(ip, ahora = Date.now()) {
      // Sin IP (no debería pasar tras el proxy) no se puede limitar: se deja pasar.
      if (!ip) return true;
      // Límite desactivado (solo fuera de producción, `maxEnviosDelEntorno`): no se cuenta nada.
      if (!Number.isFinite(max)) return true;
      const clave = huella(ip);
      const vigentes = (envios.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
      if (vigentes.length >= max) {
        envios.set(clave, vigentes);
        return false;
      }
      vigentes.push(ahora);
      envios.set(clave, vigentes);
      if (envios.size > MAX_HUELLAS) {
        for (const [k, tiempos] of envios) {
          if (tiempos.every((t) => ahora - t >= ventanaMs)) envios.delete(k);
        }
        // Si aun así hay demasiadas (un ataque desde muchas IP), se suelta lo más viejo.
        while (envios.size > MAX_HUELLAS) {
          const primera = envios.keys().next().value;
          if (primera === undefined) break;
          envios.delete(primera);
        }
      }
      return true;
    },
    tamano: () => envios.size,
  };
}

/**
 * LÍMITE AJUSTABLE SOLO PARA PRUEBAS DE CARGA (2026-11-26, el cliente): en un preview o en local,
 * `ANTISPAM_MAX_ENVIOS` sube el tope por IP (un número entero ≥ 1) o lo desactiva (`0` u `off`).
 * EN PRODUCCIÓN NUNCA SE LEE: manda siempre `MAX_ENVIOS`, aunque la variable esté puesta. Producción
 * es `VERCEL_ENV=production`, o un servidor de producción fuera de Vercel (`NODE_ENV=production`
 * sin `VERCEL_ENV`): ante la duda, se trata como producción. Una variable mal escrita se ignora.
 */
export const VARIABLE_MAX_ENVIOS = "ANTISPAM_MAX_ENVIOS";

export function maxEnviosDelEntorno(env: Record<string, string | undefined> = process.env): number {
  const enProduccion =
    env.VERCEL_ENV === "production" || (!env.VERCEL_ENV && env.NODE_ENV === "production");
  if (enProduccion) return MAX_ENVIOS;
  const crudo = env[VARIABLE_MAX_ENVIOS]?.trim().toLowerCase();
  if (!crudo) return MAX_ENVIOS;
  if (crudo === "0" || crudo === "off") return Number.POSITIVE_INFINITY;
  return /^[1-9]\d{0,8}$/.test(crudo) ? Number(crudo) : MAX_ENVIOS;
}

/** El límite de esta instancia, compartido por todos los envíos que atienda. */
export const limiteDeEnvios = crearLimitePorIp(maxEnviosDelEntorno());
