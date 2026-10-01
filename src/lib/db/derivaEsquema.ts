/**
 * DERIVA DE ESQUEMA — la decisión, separada del acceso a Payload y drizzle-kit
 * (mismo patrón que `veredictoMigraciones.ts`): una función pura que recibe las
 * sentencias que generaría una migración nueva y dice si el código y las
 * migraciones coinciden.
 *
 * Por qué existe (CLAUDE.md §10.33 p.5): `videos.focal_x` y `focal_y` entraron
 * en el código de la fase C sin su migración, y los recogió por sorpresa la
 * migración de la fase D. Nada avisó: el build no migra lo que no existe.
 */

export type VeredictoDeriva =
  { coincide: true } | { coincide: false; sentencias: string[]; mensaje: string };

/**
 * `sentencias` son las que generaría `payload migrate:create` ahora mismo,
 * comparando el esquema del código con el último snapshot de `src/migrations`.
 * Cero sentencias = el código no ha cambiado el esquema sin su migración.
 */
export function veredictoDeriva(sentencias: readonly string[]): VeredictoDeriva {
  const reales = sentencias.map((s) => s.trim()).filter((s) => s.length > 0);
  if (reales.length === 0) return { coincide: true };
  return {
    coincide: false,
    sentencias: reales,
    mensaje:
      `El esquema del código no coincide con las migraciones: faltan ${reales.length} ` +
      `sentencia(s). Crea la migración con \`npm run payload migrate:create <nombre>\` ` +
      `y súbela en el mismo PR.`,
  };
}
