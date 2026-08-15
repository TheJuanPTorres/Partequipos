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

export async function GET(peticion: Request) {
  /*
   * HIGIENE, NO AUTENTICACIÓN. Que quede claro: esta cabecera la puede poner
   * cualquiera, así que no protege de nadie que se lo proponga.
   *
   * Lo que sí hace es que el mapa de redirects deje de ser recogido por
   * rastreadores y escáneres que piden rutas de API a ciegas. El contenido
   * tampoco es secreto —cualquiera puede descubrir un redirect pidiendo la URL
   * antigua—, pero enumerarlo entero de una vez no aporta nada a un visitante.
   *
   * Protegerlo de verdad exigiría un secreto compartido con el proxy, y eso es
   * una variable de entorno más y un modo de fallo más para una ruta que se
   * llama una vez por minuto. No compensa.
   */
  if (peticion.headers.get("x-proxy-internal") !== "1") {
    return NextResponse.json({ redirects: [] }, { status: 403 });
  }

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
