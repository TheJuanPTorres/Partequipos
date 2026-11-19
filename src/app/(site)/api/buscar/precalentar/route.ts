import { NextResponse } from "next/server";

import { datosDelBuscador } from "@/lib/buscador/datos";

/**
 * LOS DATOS DEL BUSCADOR, PRECALCULADOS (2026-11-18). Ruta ESTÁTICA: Next la genera al construir y la
 * sirve la CDN, así que una instancia fría del buscador toma de aquí los documentos sin arrancar
 * Payload ni tocar la base (`servidor.ts`). Un cambio en el panel invalida la etiqueta
 * `datos:busqueda` y se regenera. Solo contiene lo que ya es público en el sitio.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(await datosDelBuscador(), {
    headers: { "X-Robots-Tag": "noindex" },
  });
}
