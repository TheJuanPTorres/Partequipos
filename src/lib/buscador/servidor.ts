import { fetchAlPreview, origenDePreview } from "@/lib/preview/derivacion.mjs";

import {
  buscarEnIndice,
  crearIndice,
  type Filtros,
  type Indice,
  type RespuestaBusqueda,
} from "./motor";
import type { DatosBuscador } from "./datos";
import { gruposDelPanel } from "./sinonimos";

/**
 * EL ÍNDICE EN EL SERVIDOR (2026-11-18). El índice invertido se construye una vez por instancia y se
 * rehace como mucho cada 30 s: cada letra que escribe el visitante es una búsqueda en memoria.
 *
 * DE DÓNDE SALEN LOS DATOS, para que la primera búsqueda no espere (antes ~3 s, casi todo el arranque
 * de Payload en una instancia fría):
 *   1. La ruta ESTÁTICA `/api/buscar/precalentar/` (se genera en el build y la sirve la CDN: unas
 *      decenas de ms, sin Payload ni base de datos). La regenera la etiqueta `datos:busqueda` cuando
 *      algo cambia en el panel.
 *   2. Si no está disponible (un preview con la protección de Vercel sin permiso, un fallo de red),
 *      la caché de datos / la base (`datos.ts`), cargada solo entonces (`import()` dinámico).
 */

const REFRESCO_MS = 30_000;
const PAUSA_ESTATICA_MS = 2500;

let memoria: { en: number; huella: string; indice: Indice } | null = null;

function huellaDe(d: DatosBuscador): string {
  let h = 5381;
  for (const x of d.docs) {
    const s = `${x.id}|${x.titulo}|${x.href}|${x.campos.descripcion ?? ""}|${x.campos.specs ?? ""}`;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return `${d.docs.length}:${h}|${d.sinonimos}`;
}

async function desdeLaRutaEstatica(origen: string): Promise<DatosBuscador | null> {
  try {
    const url = new URL("/api/buscar/precalentar/", origen).toString();
    // En un preview lleva el permiso de derivación (solo al propio origen del preview).
    const opciones = { signal: AbortSignal.timeout(PAUSA_ESTATICA_MS) };
    const r = origenDePreview(origen)
      ? await fetchAlPreview(
          url,
          origen,
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
          opciones,
        )
      : await fetch(url, opciones);
    if (!r.ok) return null;
    const d = (await r.json()) as Partial<DatosBuscador>;
    return Array.isArray(d.docs) ? { docs: d.docs, sinonimos: d.sinonimos ?? "" } : null;
  } catch {
    return null;
  }
}

export async function indiceActual(origen?: string): Promise<Indice> {
  const ahora = Date.now();
  if (memoria && ahora - memoria.en < REFRESCO_MS) return memoria.indice;
  const datos =
    (origen ? await desdeLaRutaEstatica(origen) : null) ??
    (await (await import("./datos")).datosDelBuscador());
  const huella = huellaDe(datos);
  if (memoria?.huella === huella) {
    memoria.en = ahora;
    return memoria.indice;
  }
  const indice = crearIndice(datos.docs, gruposDelPanel(datos.sinonimos));
  memoria = { en: ahora, huella, indice };
  return indice;
}

/** Busca en el catálogo publicado. `origen`: el de la petición (para tomar los datos de la ruta estática). */
export async function buscarEnCatalogo(
  consulta: string,
  filtros: Filtros = {},
  limite = 200,
  origen?: string,
): Promise<RespuestaBusqueda> {
  return buscarEnIndice(await indiceActual(origen), consulta, filtros, limite);
}
