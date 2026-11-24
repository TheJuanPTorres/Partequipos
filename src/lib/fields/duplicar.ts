import type { CollectionBeforeOperationHook, FieldHook } from "payload";

/**
 * DUPLICAR UNA FICHA (tanda 21, tarea 3, fase 2, punto 10; Juan Pablo). El botón «Duplicar» de
 * Payload copia el documento entero; estos ganchos hacen que la copia:
 * - lleve «(copia)» en el nombre (`conCopia`, en el campo del nombre de cada colección);
 * - tenga una dirección web que no choque (`slugDeCopia`, en `slugField`): «<slug>-copia», y si ya
 *   existe, «-copia-2», «-copia-3»…;
 * - nazca OCULTA (`nacerOculta`, en `mostrarEnWebField`) o, en las colecciones con borradores, en
 *   BORRADOR (`duplicarComoBorrador`, gancho de la colección).
 * Así nada de la copia sale en la web hasta que el editor lo decida.
 */

export const SUFIJO_COPIA = " (copia)";

/** El nombre de la copia: «<nombre> (copia)» (una sola vez, aunque se copie una copia). */
export function nombreDeCopia(nombre: unknown): unknown {
  if (typeof nombre !== "string" || !nombre.trim()) return nombre;
  return nombre.endsWith(SUFIJO_COPIA) ? nombre : `${nombre}${SUFIJO_COPIA}`;
}

/** Las direcciones que se prueban, en orden: «<slug>-copia», «<slug>-copia-2»… (sin repetir «-copia»). */
export function candidatosDeSlug(slug: string, maximo = 50): string[] {
  const base = `${slug.replace(/-copia(-\d+)?$/, "")}-copia`;
  return [base, ...Array.from({ length: maximo - 1 }, (_, i) => `${base}-${i + 2}`)];
}

export const conCopia: FieldHook = ({ value }) => nombreDeCopia(value);

export const nacerOculta: FieldHook = () => false;

/** La primera dirección libre en la colección (se mira en toda ella: más estricto que su índice). */
export const slugDeCopia: FieldHook = async ({ value, collection, req }) => {
  if (typeof value !== "string" || !value || !collection) return value;
  for (const candidato of candidatosDeSlug(value)) {
    const { totalDocs } = await req.payload.count({
      collection: collection.slug,
      where: { slug: { equals: candidato } },
      overrideAccess: true,
      req,
    });
    if (totalDocs === 0) return candidato;
  }
  return `${candidatosDeSlug(value)[0]}-${Date.now().toString(36)}`;
};

/** Colección con borradores: la copia se guarda como BORRADOR, nunca publicada. */
export const duplicarComoBorrador: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation === "create" && args.duplicateFromID) {
    args.draft = true;
    if (args.data && typeof args.data === "object")
      (args.data as { _status?: string })._status = "draft";
  }
  return args;
};
