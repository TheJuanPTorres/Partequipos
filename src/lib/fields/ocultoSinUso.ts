import type { Field } from "payload";

/**
 * LIMPIEZA DEL PANEL, PASO 1 «OCULTAR» (fase 2, 2026-11-18, aprobada por dirección; informe
 * `partequipos-cierre\informes\2026-11-18-panel-organizacion-fase1.md` §1.2 y §8.1).
 *
 * Oculta en el panel un campo que la web ya no pinta, SIN tocar el esquema: la columna y sus
 * datos siguen en la base y en la API (los importadores pueden seguir escribiéndolo). El paso 3
 * de la limpieza los borra con migración, después de comprobar en producción que nadie los
 * necesita y con copia de Neon. La lista de lo ocultado la vigila `ocultoSinUso.test.ts`.
 */
export function ocultoSinUso<F extends Field>(campo: F): F {
  const admin = "admin" in campo && campo.admin ? campo.admin : {};
  return { ...campo, admin: { ...admin, hidden: true } } as F;
}
