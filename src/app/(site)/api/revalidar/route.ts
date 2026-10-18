import { NextResponse } from "next/server";

import { revalidarCachesDelSitio } from "@/lib/revalidation";
import { tokenDeRevalidacionValido } from "@/lib/seguridad/tokenRevalidacion";

/**
 * VACIAR LA CACHÉ DEL SITIO DESPLEGADO (2026-10-18, dirección).
 *
 * Una importación por script (los runbooks) escribe en la base desde fuera de
 * Next: sus ganchos no revalidan nada y la caché de datos sobrevive a los
 * redeploys, así que una página puede seguir sirviendo datos viejos o un 404
 * de cuando la unidad aún no existía. El runbook termina llamando aquí:
 *
 *     POST /api/revalidar/   con la cabecera `x-partequipos-revalidar`
 *
 * Revalida todas las etiquetas de la caché de datos y todas las páginas
 * (`revalidarCachesDelSitio`). Solo POST y solo con el secreto
 * `REVALIDACION_TOKEN` (`tokenRevalidacion.ts`); sin él, 403 sin hacer nada.
 * No lee ni escribe datos y no devuelve nada sensible.
 */
export const dynamic = "force-dynamic";

export async function POST(peticion: Request) {
  if (!tokenDeRevalidacionValido(peticion.headers)) {
    return NextResponse.json(
      { ok: false },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }
  const r = revalidarCachesDelSitio("POST /api/revalidar/");
  return NextResponse.json(
    { ok: r.fallos.length === 0, etiquetas: r.etiquetas, paginas: r.paginas, fallos: r.fallos },
    { status: r.fallos.length ? 500 : 200, headers: { "cache-control": "no-store" } },
  );
}
