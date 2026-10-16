import { createHash, timingSafeEqual } from "node:crypto";

/**
 * TOKEN DE LECTURA DE LA API (2026-10-15).
 *
 * Hasta esta fecha, la API REST y GraphQL de Payload se leían SIN SESIÓN: el
 * catálogo tenía `read: () => true`. El sitio no la usa (lee con la API local,
 * CLAUDE.md §3.2), pero cualquiera podía pedir `/api/<colección>/?limit=0&depth=2`
 * y llevarse la colección entera con sus relaciones en una sola petición, con
 * su coste de transferencia en la base (`propuestas/2026-10-15-consumo-base.md`).
 *
 * Ahora la lectura por la API exige una de dos cosas:
 *
 * - **sesión del panel** (editor o administrador), o
 * - la cabecera `x-partequipos-lectura` con el valor de `API_LECTURA_TOKEN`.
 *
 * El token es para los runbooks y los scripts de comprobación: abre la
 * LECTURA de lo que antes era público y nada más. No escribe, no lee
 * `solicitudes` ni `users` (que nunca fueron públicas) y no salta los filtros
 * de testimonios y preguntas. Con fuga, el daño es volver a la situación de
 * antes; se rota cambiando la variable y redesplegando.
 *
 * La API LOCAL no pasa por aquí: ignora el acceso salvo `overrideAccess: false`,
 * y entonces lleva el `user` del panel.
 *
 * FALLA CERRADO: sin variable, o con una de menos de `LONGITUD_MINIMA`
 * caracteres, ningún valor de la cabecera vale.
 */

export const CABECERA_LECTURA = "x-partequipos-lectura";

/** Un token más corto se trata como si no existiera. */
export const LONGITUD_MINIMA = 32;

type Entorno = Record<string, string | undefined>;

const huella = (texto: string) => createHash("sha256").update(texto, "utf8").digest();

/**
 * ¿Trae la petición el token de lectura correcto? Compara en tiempo constante
 * (sobre las huellas, que siempre miden lo mismo). Nunca devuelve ni registra
 * el token.
 */
export function tokenDeLecturaValido(
  cabeceras: Pick<Headers, "get"> | undefined | null,
  env: Entorno = process.env,
): boolean {
  const esperado = env.API_LECTURA_TOKEN?.trim();
  if (!esperado || esperado.length < LONGITUD_MINIMA) return false;
  const recibido = cabeceras?.get(CABECERA_LECTURA)?.trim();
  if (!recibido) return false;
  return timingSafeEqual(huella(recibido), huella(esperado));
}
