import { NextResponse } from "next/server";

import { indiceActual } from "@/lib/buscador/servidor";

/**
 * PRECALIENTA EL BUSCADOR EN EL BUILD (2026-11-18). Es una ruta estática: Next la genera al construir
 * y, al hacerlo, llena la caché de datos con los documentos del catálogo (`servidor.ts`). Así la
 * primera búsqueda del despliegue no espera a la base (eran ~3 s) y solo construye el índice en
 * memoria. Un cambio en el panel invalida la etiqueta `datos:busqueda` y se regenera como siempre.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const indice = await indiceActual();
  return NextResponse.json(
    { documentos: indice.docs.length },
    { headers: { "X-Robots-Tag": "noindex" } },
  );
}
