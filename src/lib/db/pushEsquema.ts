/**
 * ¿Puede Payload hacer PUSH del esquema (alterarlo en caliente, sin migración)?
 *
 * DESDE EL 2026-10-02, SOLO SI SE PIDE EXPLÍCITAMENTE: `PAYLOAD_PERMITIR_PUSH=true`
 * y nunca con `NODE_ENV=production`. Ni `npm run dev` ni ningún script lo
 * activan solos. Antes el push estaba activo por defecto fuera de producción,
 * y eso causó dos marcadores `dev` (CLAUDE.md §10.9 y §10.34) y una pregunta
 * interactiva de drizzle-kit al levantar `npm run dev` contra `development`.
 *
 * El esquema se cambia con migraciones (`payload migrate:create` y
 * `payload migrate`) en todos los entornos, `development` incluido.
 *
 * `PAYLOAD_DISABLE_PUSH=true`, que fijan los scripts de datos, sigue mandando:
 * lo apaga aunque alguien haya pedido el push.
 */
export function pushPermitido(env: Record<string, string | undefined>): boolean {
  if (env.NODE_ENV === "production") return false;
  if (env.PAYLOAD_DISABLE_PUSH === "true") return false;
  return env.PAYLOAD_PERMITIR_PUSH === "true";
}
