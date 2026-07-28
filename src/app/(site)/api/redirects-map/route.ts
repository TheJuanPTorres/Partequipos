import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Mapa completo de redirects, consumido por `proxy.ts` (ADR 0005).
 *
 * Ruta DINÁMICA a propósito: la frescura la controla la caché en memoria del
 * proxy (TTL 60 s). Si además se cachease aquí, la latencia máxima de
 * propagación sería la suma de ambos TTL y se pasaría del SLA de un minuto.
 *
 * Coste real: una consulta a la base de datos cada 60 s por instancia del proxy,
 * no una por visita.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "redirects",
      depth: 0,
      limit: 0,
      overrideAccess: true,
    });

    const mapa = docs.map((doc) => ({
      desde: doc.desde,
      hacia: doc.hacia,
      tipo: doc.tipo,
    }));

    return NextResponse.json({ redirects: mapa }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[redirects] no se pudo construir el mapa:", error);
    // Degradación elegante: un mapa vacío deja pasar las peticiones.
    return NextResponse.json({ redirects: [] }, { status: 200 });
  }
}
