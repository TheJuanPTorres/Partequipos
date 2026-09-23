import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidarRutas } from "../../lib/revalidation";

/**
 * Revalida la PORTADA (`/`) cuando cambia algo que la home de ux-9 muestra:
 * marcas de maquinaria (sección 2), equipos usados (3), categorías técnicas
 * (5), vídeos (7), sedes (9), testimonios (10) y preguntas frecuentes (11).
 *
 * La portada está prerenderizada: sin esto, un cambio en esas colecciones no
 * llegaría a la home hasta el siguiente despliegue (CLAUDE.md §3.1: ISR, nunca
 * reconstruir todo el sitio). Se AÑADE a los ganchos que cada colección ya
 * tenga; no los sustituye.
 *
 * Como los demás ganchos de revalidación: nunca relanza. El editor tiene que
 * poder guardar aunque la revalidación falle.
 */
export function revalidarPortada(coleccion: string): {
  afterChange: CollectionAfterChangeHook;
  afterDelete: CollectionAfterDeleteHook;
} {
  return {
    afterChange: ({ doc }) => {
      revalidarRutas(["/"], `${coleccion} ${doc?.id ?? ""} (portada)`);
      return doc;
    },
    afterDelete: ({ doc }) => {
      revalidarRutas(["/"], `${coleccion} ${doc?.id ?? ""} borrado (portada)`);
      return doc;
    },
  };
}
