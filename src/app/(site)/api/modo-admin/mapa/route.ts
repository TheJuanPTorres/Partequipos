import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import type { Permisos } from "@/lib/modoAdmin/mapa";
import { responderMapa } from "@/lib/modoAdmin/responder";
import { SLUG_PORTADA } from "@/lib/queries/getPaginas";
import { rutaVistaPreviaUsada } from "@/lib/vistaPrevia/enVivo";

/**
 * MODO ADMINISTRACIÓN SOBRE LA WEB (tanda 23, PROTOTIPO).
 *
 *     GET /api/modo-admin/mapa/?ruta=/la/pagina/
 *
 * Dice al módulo del modo administración qué bloque de esa página es qué ficha del panel.
 * SOLO LECTURA: no escribe nada (Juan Pablo: «sin endpoints nuevos que escriban datos»).
 *
 * - Exige sesión de personal: 401 sin ella. La decisión, en `responderMapa`, con pruebas.
 * - Nunca en caché: `force-dynamic` y `Cache-Control: no-store`. No usa la caché de datos de Next:
 *   consulta con `payload.find` y el acceso DE ESE USUARIO (`overrideAccess: false`).
 * - Devuelve selectores, etiquetas fijas y enlaces al panel (con el id). Ningún campo del documento.
 */
export const dynamic = "force-dynamic";

const SIN_CACHE = { "cache-control": "no-store" };

export async function GET(peticion: Request) {
  const payload = await getPayload({ config });
  const { user, permissions } = await payload.auth({ headers: peticion.headers });

  const idDe = async (
    coleccion: "paginas" | "equipos-usados",
    slug: string,
  ): Promise<number | string | null> => {
    if (!user) return null;
    const { docs } = await payload.find({
      collection: coleccion,
      where: { slug: { equals: slug } },
      overrideAccess: false,
      user,
      depth: 0,
      limit: 1,
      select: { slug: true },
    });
    return docs[0]?.id ?? null;
  };

  const { status, cuerpo } = await responderMapa({
    usuario: user,
    permisos: permissions as Permisos,
    ruta: new URL(peticion.url).searchParams.get("ruta"),
    busquedas: {
      idDePortada: () => idDe("paginas", SLUG_PORTADA),
      idDeUsada: (slug) => idDe("equipos-usados", slug),
      borradorDeUsada: (id) => rutaVistaPreviaUsada(id),
    },
  });
  return NextResponse.json(cuerpo, { status, headers: SIN_CACHE });
}
