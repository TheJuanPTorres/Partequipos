import type { Payload } from "payload";

import { CONTEXTO_ESCRITURA_VACANTES, SLUG_VACANTES_BUK } from "./constantes";
import { vacantesGuardadas, type Guardado } from "./estado";

/**
 * Leer y escribir el global «Vacantes de Buk», con la instancia de Payload que
 * se le pase: la de la página (`fuente.ts`) o la de un script
 * (`scripts/vacantes/estado-preview.ts`). Sin nada de Next.
 */
export async function leerGuardado(payload: Payload): Promise<Guardado> {
  const g = await payload.findGlobal({ slug: SLUG_VACANTES_BUK, depth: 0 });
  return {
    leer: g.leer !== false,
    vacantes: vacantesGuardadas(g.vacantes),
    copiaEl: g.copiaEl ?? null,
    ultimoIntento: g.ultimoIntento ?? null,
    ultimoError: g.ultimoError ?? null,
  };
}

/** Escribe lo que diga `datos` sin revalidar nada (contexto del servidor). */
export async function guardar(
  payload: Payload,
  datos: Partial<Omit<Guardado, "leer">> & { leer?: boolean },
): Promise<void> {
  await payload.updateGlobal({
    slug: SLUG_VACANTES_BUK,
    data: {
      ...datos,
      ...(datos.vacantes !== undefined ? { numeroVacantes: datos.vacantes?.length ?? null } : {}),
    },
    overrideAccess: true,
    context: { [CONTEXTO_ESCRITURA_VACANTES]: true },
  });
}
