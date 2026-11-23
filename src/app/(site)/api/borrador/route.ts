import config from "@payload-config";
import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { rutaDePagina } from "@/lib/panel/verEnElSitio";
import { idDePagina } from "@/lib/vistaPrevia/rutas";

/**
 * VISTA PREVIA DEL BORRADOR DE UNA PÁGINA (PR 8b, 2026-11-23).
 *
 *     GET /api/borrador/?pagina=<id>      (el botón «Ver en el sitio» del panel)
 *
 * Exige una sesión del panel (401 sin ella). Con ella, activa el modo borrador de Next y redirige a
 * la dirección pública de la página, sacada de la BASE y no de la URL (sin redirección abierta).
 * Desde ahí, esa persona ve el último borrador guardado; los demás visitantes, lo publicado
 * (`getPaginaPorSlug` y `vistaPreviaActiva`). Se sale con el aviso de la parte de arriba.
 */
export const dynamic = "force-dynamic";

const SIN_CACHE = { "cache-control": "no-store" };

export async function GET(peticion: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: peticion.headers });
  if (!user)
    return new NextResponse("Inicia sesión en el panel.", { status: 401, headers: SIN_CACHE });

  const id = idDePagina(new URL(peticion.url).searchParams.get("pagina"));
  if (id === null)
    return new NextResponse("Página no válida.", { status: 400, headers: SIN_CACHE });

  // Personal con sesión: el borrador más reciente, sin filtrar lo publicado.
  const { docs } = await payload.find({
    collection: "paginas",
    where: { id: { equals: id } },
    draft: true,
    depth: 0,
    limit: 1,
    select: { slug: true },
  });
  const slug = docs[0]?.slug;
  if (typeof slug !== "string" || !slug.trim())
    return new NextResponse("La página no existe o no tiene dirección.", {
      status: 404,
      headers: SIN_CACHE,
    });

  (await draftMode()).enable();
  const destino = rutaDePagina(slug);
  return NextResponse.redirect(new URL(destino === "/" ? "/" : `${destino}/`, peticion.url), {
    status: 307,
    headers: SIN_CACHE,
  });
}
