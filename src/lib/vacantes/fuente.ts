import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "../cacheDatos";
import { calcularVacantes } from "./calcular";
import { CONTEXTO_ESCRITURA_VACANTES, SLUG_VACANTES_BUK } from "./constantes";
import { vacantesGuardadas, type Guardado } from "./estado";
import { leerPortalBuk } from "./portalBuk";

/**
 * LA ÚNICA PUERTA de la página a sus vacantes (2026-10-23). Hoy lee el portal
 * público de Buk; el día de la API oficial se cambia `leer` por la llamada a
 * la API y la página no se toca.
 *
 * Reglas (Juan Pablo):
 * - Buk se lee COMO MUCHO CADA 6 HORAS, también si la lectura falla
 *   (`tocaLeer`), y siempre desde el servidor.
 * - La ÚLTIMA COPIA BUENA se guarda en la base (global «Vacantes de Buk»), así
 *   sobrevive a los despliegues; si la lectura falla o el marcado cambia, se
 *   pinta esa copia. Sin copia, estado vacío con enlace al portal de Buk.
 * - El interruptor «Leer vacantes de Buk» del mismo global lo corta al
 *   instante: su gancho invalida esta caché.
 *
 * En la caché de datos (`datos:vacantes`) con vigencia de 1 hora: la base se
 * consulta como mucho una vez por hora y despliegue, y Buk, cada 6 horas.
 */
const VIGENCIA_CACHE_S = 60 * 60;

async function leerGuardado(): Promise<Guardado> {
  const payload = await getPayload({ config });
  const g = await payload.findGlobal({ slug: SLUG_VACANTES_BUK, depth: 0 });
  return {
    leer: g.leer !== false,
    vacantes: vacantesGuardadas(g.vacantes),
    copiaEl: g.copiaEl ?? null,
    ultimoIntento: g.ultimoIntento ?? null,
    ultimoError: g.ultimoError ?? null,
  };
}

async function guardar(datos: Partial<Omit<Guardado, "leer">>): Promise<void> {
  const payload = await getPayload({ config });
  await payload.updateGlobal({
    slug: SLUG_VACANTES_BUK,
    data: {
      ...datos,
      ...(datos.vacantes ? { numeroVacantes: datos.vacantes.length } : {}),
    },
    overrideAccess: true,
    context: { [CONTEXTO_ESCRITURA_VACANTES]: true },
  });
}

/** Las vacantes que pinta «Trabaja con nosotros». */
export const obtenerVacantes = unstable_cache(
  () => calcularVacantes({ ahora: Date.now, leerGuardado, guardar, leer: () => leerPortalBuk() }),
  ["vacantes-buk", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.vacantes], revalidate: VIGENCIA_CACHE_S },
);
