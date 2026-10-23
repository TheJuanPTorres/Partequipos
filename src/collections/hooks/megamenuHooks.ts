import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { CAMPOS_MENU, type ColeccionDelMenu } from "../../lib/megamenuCampos";
import { revalidarTodoElSitio } from "../../lib/revalidation";

/**
 * MEGAMENÚ (decisiones-home-ux9.md §26): va en la cabecera de TODAS las
 * páginas y se lee del catálogo. Si un registro cambia algo que el menú pinta,
 * se crea o se borra, el menú de todo el sitio tiene que refrescarse, no solo
 * las páginas de ese registro.
 *
 * Revalidar el sitio entero es caro, así que SOLO cuando cambia un campo que
 * lee el menú: los de `CAMPOS_MENU` (`src/lib/megamenuCampos.ts`), la misma
 * lista que pide su consulta. Editar una descripción no lo dispara. Se AÑADE a
 * los ganchos de cada colección; nunca relanza.
 */

type Registro = Readonly<Record<string, unknown>> | null | undefined;

/** Un valor comparable: una relación poblada cuenta como su id, también dentro de una lista. */
function valorComparable(v: unknown): unknown {
  if (Array.isArray(v)) return JSON.stringify(v.map(valorComparable));
  if (v && typeof v === "object" && "id" in v) return (v as { id: unknown }).id;
  return v ?? null;
}

/** ¿Cambia lo que pinta el menú? Pura, para probarla sin Payload. */
export function cambiaElMenu(
  operacion: string,
  doc: Registro,
  anterior: Registro,
  coleccion: ColeccionDelMenu,
): boolean {
  if (operacion === "create") return true;
  if (!doc || !anterior) return true;
  return CAMPOS_MENU[coleccion].some(
    (campo) => valorComparable(doc[campo]) !== valorComparable(anterior[campo]),
  );
}

export function revalidarMegamenu(coleccion: ColeccionDelMenu): {
  afterChange: CollectionAfterChangeHook;
  afterDelete: CollectionAfterDeleteHook;
} {
  return {
    afterChange: ({ doc, previousDoc, operation }) => {
      if (cambiaElMenu(operation, doc, previousDoc, coleccion)) {
        revalidarTodoElSitio(`${coleccion} ${doc?.id ?? ""} (megamenú)`);
      }
      return doc;
    },
    afterDelete: ({ doc }) => {
      revalidarTodoElSitio(`${coleccion} ${doc?.id ?? ""} borrado (megamenú)`);
      return doc;
    },
  };
}
