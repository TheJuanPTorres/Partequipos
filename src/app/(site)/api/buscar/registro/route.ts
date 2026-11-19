import { NextResponse, type NextRequest } from "next/server";

import { normalizarConsulta } from "@/lib/buscador/consulta";
import { registrarSinResultado } from "@/lib/buscador/registro";
import { buscarEnCatalogo } from "@/lib/buscador/servidor";

/**
 * `POST /api/buscar/registro/` con `{ "q": "…" }` (2026-11-18): la lupa avisa de una búsqueda que se
 * quedó sin resultados. El servidor NO se fía del cliente: repite la búsqueda y solo cuenta si de
 * verdad no hay nada. Guarda el texto y un contador (`registro.ts`), sin IP ni nada de quien busca;
 * descarta lo que parezca un dato personal y limita la frecuencia. Siempre responde 204.
 */
export async function POST(peticion: NextRequest) {
  try {
    const cuerpo = (await peticion.json()) as { q?: unknown };
    const consulta = normalizarConsulta(typeof cuerpo.q === "string" ? cuerpo.q : undefined);
    if (consulta.estado === "valida") {
      const r = await buscarEnCatalogo(consulta.texto, {}, 1);
      if (r.total === 0) await registrarSinResultado(consulta.texto);
    }
  } catch {
    /* una petición mal formada no registra nada */
  }
  return new NextResponse(null, { status: 204, headers: { "X-Robots-Tag": "noindex" } });
}
