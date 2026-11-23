import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

import { rutaDeVuelta } from "@/lib/vistaPrevia/rutas";

/**
 * Sale de la vista previa del borrador (el botón del aviso) y vuelve a la misma página: la del
 * `Referer`, solo si es del propio sitio (`rutaDeVuelta`); si no, a la portada. POST.
 */
export const dynamic = "force-dynamic";

function vueltaDe(peticion: Request): string | null {
  try {
    const de = new URL(peticion.headers.get("referer") ?? "");
    return de.origin === new URL(peticion.url).origin ? `${de.pathname}${de.search}` : null;
  } catch {
    return null;
  }
}

export async function POST(peticion: Request) {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL(rutaDeVuelta(vueltaDe(peticion)), peticion.url), {
    status: 303,
    headers: { "cache-control": "no-store" },
  });
}
