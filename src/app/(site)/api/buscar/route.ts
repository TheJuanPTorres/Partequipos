import { NextResponse, type NextRequest } from "next/server";

import { normalizarConsulta } from "@/lib/buscador/consulta";
import type { Clase, Estado, Filtros } from "@/lib/buscador/motor";
import { buscarEnCatalogo, indiceActual } from "@/lib/buscador/servidor";

/**
 * `GET /api/buscar/?q=…&marca=…&tipo=…&estado=nueva|usada&clase=…&limite=8` (2026-11-18): lo que
 * llama la lupa de la cabecera mientras se escribe y la página `/buscar/`. Solo lectura del
 * catálogo publicado; sin cookies y sin datos de quien busca. El índice vive en el servidor
 * (`servidor.ts`), así que cada letra es una búsqueda en memoria.
 */

const CLASES = new Set<Clase>([
  "nueva",
  "usada",
  "modelo",
  "repuestos",
  "marca",
  "pagina",
  "categoria",
  "lubricante",
  "blog",
  "servicio",
  "sede",
]);

const limpio = (v: string | null) =>
  (v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 60);

export async function GET(peticion: NextRequest) {
  const p = peticion.nextUrl.searchParams;
  const consulta = normalizarConsulta(p.get("q") ?? undefined);
  const cabeceras = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    "X-Robots-Tag": "noindex",
  };
  // La lupa lo pide al abrirse: carga el índice antes de que se escriba la primera letra.
  if (p.get("calentar")) {
    await indiceActual(peticion.nextUrl.origin);
    return NextResponse.json({ ok: true }, { headers: { "X-Robots-Tag": "noindex" } });
  }
  if (consulta.estado === "vacia") {
    return NextResponse.json({ consulta: "", resultados: [], total: 0 }, { headers: cabeceras });
  }

  const filtros: Filtros = {};
  const marca = limpio(p.get("marca"));
  const tipo = limpio(p.get("tipo"));
  const estado = p.get("estado");
  const clase = p.get("clase") as Clase | null;
  if (marca) filtros.marca = marca;
  if (tipo) filtros.tipo = tipo;
  if (estado === "nueva" || estado === "usada") filtros.estado = estado as Estado;
  if (clase && CLASES.has(clase)) filtros.clase = clase;
  const limite = Math.min(200, Math.max(1, Number(p.get("limite")) || 8));

  const r = await buscarEnCatalogo(consulta.texto, filtros, limite, peticion.nextUrl.origin);
  return NextResponse.json(
    {
      ...r,
      resultados: r.resultados.map((x) => ({
        id: x.doc.id,
        clase: x.doc.clase,
        titulo: x.doc.titulo,
        href: x.doc.href,
        detalle: x.doc.detalle,
        marca: x.doc.marca,
        tipo: x.doc.tipo,
        imagen: x.doc.imagen ?? null,
        exacto: x.exacto,
      })),
      exacto: r.exacto
        ? { id: r.exacto.id, titulo: r.exacto.titulo, href: r.exacto.href, clase: r.exacto.clase }
        : null,
    },
    { headers: cabeceras },
  );
}
