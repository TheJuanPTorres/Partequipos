import { unstable_cache } from "next/cache";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";

import config from "@payload-config";
import { getPayload } from "payload";

import { cargarDocumentos } from "./catalogo";
import { gruposDelPanel } from "./sinonimos";
import {
  buscarEnIndice,
  crearIndice,
  type DocBusqueda,
  type Filtros,
  type Indice,
  type RespuestaBusqueda,
} from "./motor";

/**
 * EL ÍNDICE EN EL SERVIDOR (2026-11-18). Los documentos del catálogo van en la caché de datos con
 * la etiqueta `datos:busqueda` (la que invalidan `revalidarIndices` y los ganchos del panel) y una
 * vigencia de una hora como red. El índice invertido se construye una vez por instancia y se
 * reconstruye solo cuando los documentos cambian: cada letra que escribe el visitante es una
 * búsqueda en memoria, sin tocar la base.
 */

const VIGENCIA_DOCUMENTOS = 3600;

const documentosEnCache = unstable_cache(
  cargarDocumentos,
  ["buscador-documentos", CLAVE_DESPLIEGUE],
  {
    revalidate: VIGENCIA_DOCUMENTOS,
    tags: [ETIQUETAS_DATOS.busqueda],
  },
);

/** Los sinónimos propios del panel (global «Buscador»), en la misma caché y con la misma etiqueta. */
const sinonimosEnCache = unstable_cache(
  async (): Promise<string> => {
    const payload = await getPayload({ config });
    const ajustes = await payload.findGlobal({ slug: "buscador", depth: 0 });
    return ajustes.sinonimos ?? "";
  },
  ["buscador-sinonimos", CLAVE_DESPLIEGUE],
  { revalidate: VIGENCIA_DOCUMENTOS, tags: [ETIQUETAS_DATOS.busqueda] },
);

let memoria: { huella: string; indice: Indice } | null = null;

/** Una huella barata de los documentos: si no cambia, el índice en memoria sigue valiendo. */
function huellaDe(docs: DocBusqueda[]): string {
  let h = 5381;
  for (const d of docs) {
    const s = `${d.id}|${d.titulo}|${d.href}|${d.campos.descripcion ?? ""}|${d.campos.specs ?? ""}`;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return `${docs.length}:${h}`;
}

export async function indiceActual(): Promise<Indice> {
  const [docs, sinonimos] = await Promise.all([documentosEnCache(), sinonimosEnCache()]);
  const huella = `${huellaDe(docs)}|${sinonimos}`;
  if (memoria?.huella === huella) return memoria.indice;
  const indice = crearIndice(docs, gruposDelPanel(sinonimos));
  memoria = { huella, indice };
  return indice;
}

/** Busca en el catálogo publicado. */
export async function buscarEnCatalogo(
  consulta: string,
  filtros: Filtros = {},
  limite = 200,
): Promise<RespuestaBusqueda> {
  return buscarEnIndice(await indiceActual(), consulta, filtros, limite);
}
