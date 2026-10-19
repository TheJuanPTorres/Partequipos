import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import {
  aplanarHaciaOcultas,
  redirectsDeMarcasOcultas,
  type HijoDeMarcaOculta,
} from "@/lib/nueva/visibilidad";
import {
  destinosDe,
  mapaConClave,
  MAX_RUTAS_CONSULTA,
  type RedirectGuardado,
} from "@/lib/redirects/mapaConClave";
import { poblado } from "@/lib/utils/relations";
import type { CategoriasMaquinaria } from "@/payload-types";

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
    /*
     * 503, NO un mapa vacío con 200 (2026-10-17): el proxy guardaría ese vacío
     * 60 s como si fuera bueno y no aplicaría ningún 301. Con el 503 no lo
     * guarda, reintenta en la petición siguiente y, si tenía un mapa anterior,
     * sigue con él. La degradación (dejar pasar la petición) la hace el proxy.
     */
    return NextResponse.json(
      { error: "mapa no disponible" },
      { headers: { "cache-control": "no-store" }, status: 503 },
    );
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
  const guardados = docs.map((doc) => ({ desde: doc.desde, hacia: doc.hacia, tipo: doc.tipo }));
  const ocultos = await redirectsDeOcultas(guardados);
  return [...aplanarHaciaOcultas(guardados, ocultos), ...ocultos];
}

/**
 * Los 301 de las marcas de maquinaria nueva ocultas (`src/lib/nueva/visibilidad.ts`):
 * su página, las de sus tipos y sus fichas, al destino de la marca. Sin
 * marcas ocultas, una sola consulta pequeña por refresco del mapa (60 s).
 */
async function redirectsDeOcultas(guardados: RedirectGuardado[]): Promise<RedirectGuardado[]> {
  const payload = await getPayload({ config });
  const { docs: marcas } = await payload.find({
    collection: "marcas-maquinaria",
    where: { mostrarEnWeb: { equals: false } },
    depth: 1,
    limit: 0,
    pagination: false,
    select: { slug: true, destinoOculta: true },
    populate: { "categorias-maquinaria": { slug: true } },
  });
  if (marcas.length === 0) return [];
  const ids = marcas.map((m) => m.id);
  const slugDe = new Map(marcas.map((m) => [m.id, m.slug]));
  const [tipos, equipos] = await Promise.all([
    payload.find({
      collection: "tipos-maquinaria",
      where: { marca: { in: ids } },
      depth: 0,
      limit: 0,
      pagination: false,
      select: { slug: true, marca: true },
    }),
    payload.find({
      collection: "equipos-nuevos",
      where: { marca: { in: ids } },
      depth: 0,
      limit: 0,
      pagination: false,
      select: { slug: true, marca: true, tipo: true },
    }),
  ]);
  const tipoDe = new Map(tipos.docs.map((t) => [t.id, t.slug]));
  const id = (v: unknown) => (typeof v === "number" ? v : ((v as { id?: number })?.id ?? -1));
  const hijos: HijoDeMarcaOculta[] = [
    ...tipos.docs.map((t) => ({ marcaSlug: slugDe.get(id(t.marca)) ?? "", tipoSlug: t.slug })),
    ...equipos.docs.map((e) => ({
      marcaSlug: slugDe.get(id(e.marca)) ?? "",
      tipoSlug: tipoDe.get(id(e.tipo)) ?? "",
      equipoSlug: e.slug,
    })),
  ].filter((h) => h.marcaSlug && h.tipoSlug);
  return redirectsDeMarcasOcultas(
    marcas.map((m) => ({
      slug: m.slug,
      destino: poblado<CategoriasMaquinaria>(m.destinoOculta)?.slug ?? null,
    })),
    hijos,
    guardados,
  );
}
