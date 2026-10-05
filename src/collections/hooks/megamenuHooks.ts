import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidarTodoElSitio } from "../../lib/revalidation";

/**
 * MEGAMENÚ (decisiones-home-ux9.md §26): va en la cabecera de TODAS las
 * páginas y se lee del catálogo. Si una marca, un tipo o una categoría cambia
 * de nombre o de slug, se crea o se borra, el menú de todo el sitio tiene que
 * refrescarse, no solo las páginas de ese registro.
 *
 * Revalidar el sitio entero es caro, así que SOLO cuando cambia lo que el menú
 * pinta (nombre, slug, marca): editar una descripción no lo dispara. Se AÑADE
 * a los ganchos de cada colección; nunca relanza.
 */

type Registro = Readonly<Record<string, unknown>> | null | undefined;

const idDe = (v: unknown) =>
  v && typeof v === "object" && "id" in v ? (v as { id: unknown }).id : v;

/** ¿Cambia lo que pinta el menú? Pura, para probarla sin Payload. */
export function cambiaElMenu(operacion: string, doc: Registro, anterior: Registro): boolean {
  if (operacion === "create") return true;
  if (!doc || !anterior) return true;
  return (
    doc.nombre !== anterior.nombre ||
    doc.slug !== anterior.slug ||
    idDe(doc.marca) !== idDe(anterior.marca)
  );
}

export function revalidarMegamenu(coleccion: string): {
  afterChange: CollectionAfterChangeHook;
  afterDelete: CollectionAfterDeleteHook;
} {
  return {
    afterChange: ({ doc, previousDoc, operation }) => {
      if (cambiaElMenu(operation, doc, previousDoc)) {
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
