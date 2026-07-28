import type { PayloadRequest } from "payload";

import { normalizarRuta } from "@/lib/redirects/normalizar";

/**
 * Crea (o actualiza) el redirect 301 que salva una URL cuando cambia un slug
 * (ADR 0005, parte A). Se invoca desde los hooks `afterChange` del catálogo.
 *
 * Nunca lanza: si la creación del redirect falla, el documento ya quedó
 * guardado y el editor no debe verse bloqueado. El fallo se registra.
 */
export async function crearRedirectPorCambioDeSlug(
  req: PayloadRequest,
  rutaAnterior: string,
  rutaNueva: string,
): Promise<void> {
  const desde = normalizarRuta(rutaAnterior);
  const hacia = normalizarRuta(rutaNueva);

  if (!desde || !hacia || desde === hacia) return;

  try {
    /*
     * INVARIANTE: una URL viva nunca puede ser ORIGEN de un redirect.
     *
     * Si el slug vuelve a un valor que ya se había usado (p. ej. se revierte una
     * corrección), existiría un redirect `rutaNueva → algo` que dejaría la URL
     * recién revivida redirigiendo a un destino muerto. Se elimina antes de nada.
     */
    const obsoletos = await req.payload.find({
      collection: "redirects",
      where: { desde: { equals: hacia } },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    });
    for (const obsoleto of obsoletos.docs) {
      await req.payload.delete({
        collection: "redirects",
        id: obsoleto.id,
        overrideAccess: true,
      });
    }

    const existente = await req.payload.find({
      collection: "redirects",
      where: { desde: { equals: desde } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    const data = {
      desde,
      hacia,
      tipo: "301" as const,
      origen: "cambio-de-slug" as const,
      notas: `Creado automáticamente al cambiar el slug (${new Date().toISOString()}).`,
    };

    const anterior = existente.docs[0];
    if (anterior) {
      await req.payload.update({
        collection: "redirects",
        id: anterior.id,
        data: { hacia, tipo: "301" },
        overrideAccess: true,
      });
    } else {
      await req.payload.create({ collection: "redirects", data, overrideAccess: true });
    }
  } catch (error) {
    console.error(`[redirects] no se pudo crear el redirect ${desde} → ${hacia}:`, error);
  }
}
