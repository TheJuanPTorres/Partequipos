# ADR 0001 — Adoptar Next.js 16 en lugar de Next.js 15

- **Estado:** Aceptada
- **Fecha:** 2026-07-24
- **Decisión tomada por:** Dirección técnica (aprobación explícita en el arranque del repo)

## Contexto

CLAUDE.md §2 fijaba el framework en **Next.js 15**. Al iniciar el repositorio se
verificó la documentación oficial vigente (procedimiento de instalación, no de
memoria) y se encontró que:

- `next@latest` y `create-next-app@latest` instalan hoy **Next.js 16.2.11**.
  La última versión de la rama 15 es 15.5.21.
- La documentación oficial de instalación ya describe Next.js 16
  (actualizada 2026-07-22).
- El comando "de memoria" `npx create-next-app@latest` produce un proyecto
  Next.js 16, no 15.

Esto constituye un cambio respecto al stack aprobado, que según CLAUDE.md §2
requiere aprobación previa. Se detuvo el trabajo y se consultó.

## Decisión

Adoptar **Next.js 16.2.11** como framework base del proyecto. Se actualiza
CLAUDE.md §2 en consecuencia.

## Consecuencias

### Positivas

- Se usa el default oficial actual; menos fricción para actualizaciones y soporte.
- Turbopack es el bundler por defecto (dev y build).

### Cambios de comportamiento a tener presentes (Next 15 → 16)

- **`next lint` fue eliminado.** El linting se ejecuta con la CLI de ESLint
  directamente (`"lint": "eslint"`). Ya reflejado en `package.json`.
- **`next build` ya NO ejecuta el linter automáticamente.** Por eso el flujo de
  calidad separa explícitamente:
  - `npm run lint` — reglas de ESLint (incluye prohibición de `any` y `console.log`).
  - `npm run typecheck` — `tsc --noEmit` (chequeo de tipos estricto).
  - `npm run build` — compilación de producción.
    El CI debe correr los tres, no asumir que el build cubre lint/tipos.
- El scaffolding genera por defecto `AGENTS.md` + su propio `CLAUDE.md`; se
  desactivó con `--no-agents-md` para no colisionar con la fuente de verdad.

## Alternativa descartada

Fijar `next@15.5.21`. Descartada: implicaba anclarse a la rama anterior desde el
día cero sin una razón de negocio que lo justifique. Nada en el alcance del MVP
depende de una API exclusiva de 15.
