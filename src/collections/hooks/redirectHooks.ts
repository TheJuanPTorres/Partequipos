import type {
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from "payload";
import { APIError } from "payload";

import { cadenasAAplanar, creaBucle, normalizarRuta } from "@/lib/redirects/normalizar";
import type { RedirectSimple } from "@/lib/redirects/normalizar";

/** Trae todos los redirects existentes, excluyendo opcionalmente uno por id. */
async function redirectsExistentes(
  req: PayloadRequest,
  excluirId?: number | string,
): Promise<(RedirectSimple & { id: number })[]> {
  const { docs } = await req.payload.find({
    collection: "redirects",
    depth: 0,
    limit: 0,
    overrideAccess: true,
  });

  return docs
    .filter((doc) => doc.id !== excluirId)
    .map((doc) => ({ id: doc.id, desde: doc.desde, hacia: doc.hacia }));
}

/**
 * Rechaza redirects inválidos antes de escribir (ADR 0005):
 *  - A → A y cualquier ciclo.
 */
export const validarRedirect: CollectionBeforeValidateHook = async ({ data, req, originalDoc }) => {
  if (!data?.desde || !data?.hacia) return data;

  const nuevo = { desde: normalizarRuta(data.desde), hacia: data.hacia };

  if (nuevo.desde === normalizarRuta(nuevo.hacia)) {
    throw new APIError("El origen y el destino no pueden ser la misma ruta.", 400);
  }

  // Los destinos externos (otro dominio) no pueden formar ciclos internos.
  if (!/^https?:\/\//i.test(String(nuevo.hacia).trim())) {
    const existentes = await redirectsExistentes(req, originalDoc?.id);
    if (creaBucle(nuevo, existentes)) {
      throw new APIError(
        `Esta redirección crearía un bucle: ${nuevo.desde} → ${nuevo.hacia}.`,
        400,
      );
    }
  }

  return data;
};

/**
 * Aplana cadenas: si existía A → B y se crea B → C, A pasa a apuntar a C.
 * Los buscadores no siguen cadenas largas y cada salto diluye la señal.
 */
export const aplanarCadenas: CollectionAfterChangeHook = async ({ doc, req }) => {
  try {
    const existentes = await redirectsExistentes(req, doc.id);
    const aActualizar = cadenasAAplanar({ desde: doc.desde, hacia: doc.hacia }, existentes);

    for (const viejo of aActualizar) {
      const id = (viejo as RedirectSimple & { id: number }).id;
      await req.payload.update({
        collection: "redirects",
        id,
        data: { hacia: doc.hacia },
        overrideAccess: true,
        context: { saltarAplanado: true },
      });
    }
  } catch (error) {
    console.error("[redirects] fallo al aplanar cadenas:", error);
  }
  return doc;
};

// Nota: no hay invalidación push de la caché del proxy. El proxy puede correr en
// otro proceso (o en el CDN), así que no se puede alcanzar su memoria desde aquí.
// El mecanismo de frescura es el TTL de 60 s documentado en el ADR 0005.

/**
 * Invalida el veredicto del destino cuando `hacia` cambia.
 *
 * Sin esto, un redirect verificado hace un mes seguiría luciendo «✓ Resuelve»
 * después de que alguien le cambiara el destino en el panel — una seguridad
 * falsa, que es peor que no tener el campo. Se vuelve a poner en verde solo
 * cuando `npm run redirects:check` lo comprueba de nuevo.
 */
export const marcarDestinoSinVerificar: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data;

  const cambio = !originalDoc || data.hacia !== originalDoc.hacia;
  if (cambio && data.estadoDestino !== "sin-verificar") {
    return { ...data, estadoDestino: "sin-verificar", destinoVerificadoEn: null };
  }
  return data;
};
