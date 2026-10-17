import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { destinosDe, mapaConClave, MAX_RUTAS_CONSULTA } from "@/lib/redirects/mapaConClave";

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
   * rastreadores y escáneres que piden rutas de API a ciegas. Desde el
   * 2026-10-17 el mapa tampoco lleva las URL antiguas (algunas con el serial
   * de una unidad), solo su resumen con clave: leerlo no enseña ninguna.
   *
   * Protegerlo de verdad exigiría un secreto compartido con el proxy, y eso es
   * una variable de entorno más y un modo de fallo más para una ruta que se
   * llama una vez por minuto. No compensa.
   */
  if (peticion.headers.get("x-proxy-internal") !== "1") {
    return NextResponse.json({ redirects: [] }, { status: 403 });
  }

  try {
    // Sin el origen (`desde`): un resumen con clave por entrada (`mapaConClave`).
    const mapa = await mapaConClave(await leerRedirects(), process.env.PAYLOAD_SECRET);
    return NextResponse.json({ redirects: mapa }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[redirects] no se pudo construir el mapa:", error);
    // Degradación elegante: un mapa vacío deja pasar las peticiones.
    return NextResponse.json({ redirects: [] }, { status: 200 });
  }
}

/**
 * Consulta del comprobador de lanzamiento (`npm run lanzamiento:urls`): recibe
 * las rutas que ya conoce (`{ "rutas": [...] }`) y devuelve el destino de las
 * que redirigen. No revela ninguna otra. Por POST para que las rutas, algunas
 * con el serial de una unidad, no queden en los registros de peticiones.
 */
export async function POST(peticion: Request) {
  if (peticion.headers.get("x-proxy-internal") !== "1") {
    return NextResponse.json({ encontrados: [] }, { status: 403 });
  }
  const cuerpo = (await peticion.json().catch(() => null)) as { rutas?: unknown } | null;
  const rutas = Array.isArray(cuerpo?.rutas)
    ? cuerpo.rutas.filter((r): r is string => typeof r === "string")
    : null;
  if (!rutas || rutas.length > MAX_RUTAS_CONSULTA) {
    return NextResponse.json(
      { error: `envía { "rutas": [...] } con hasta ${MAX_RUTAS_CONSULTA} rutas` },
      { status: 400 },
    );
  }
  try {
    const redirects = await leerRedirects();
    return NextResponse.json(
      { encontrados: destinosDe(redirects, rutas), total: redirects.length },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[redirects] no se pudo consultar el mapa:", error);
    return NextResponse.json({ error: "no se pudo leer la base" }, { status: 500 });
  }
}

async function leerRedirects() {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "redirects",
    depth: 0,
    limit: 0,
    overrideAccess: true,
  });
  return docs.map((doc) => ({ desde: doc.desde, hacia: doc.hacia, tipo: doc.tipo }));
}
