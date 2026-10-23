import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "../cacheDatos";
import { calcularVacantes } from "./calcular";
import { guardar, leerGuardado } from "./guardado";
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

/** Las vacantes que pinta «Trabaja con nosotros». */
export const obtenerVacantes = unstable_cache(
  // `getPayload` va dentro de cada dependencia: si falla, `calcularVacantes`
  // lo recoge y la página sigue (estado vacío), en vez de caerse.
  () =>
    calcularVacantes({
      ahora: Date.now,
      leerGuardado: async () => leerGuardado(await getPayload({ config })),
      guardar: async (datos) => guardar(await getPayload({ config }), datos),
      leer: () => leerPortalBuk(),
    }),
  ["vacantes-buk", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.vacantes], revalidate: VIGENCIA_CACHE_S },
);
