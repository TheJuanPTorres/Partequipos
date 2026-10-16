import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload, type Where } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";

import { TOPE_POR_GRUPO } from "@/lib/buscador/consulta";
import { rutas } from "@/lib/routes";
import { poblado } from "@/lib/utils/relations";
import type {
  CategoriasUsada,
  Marca,
  MarcasMaquinaria,
  TiposEquipo,
  TiposMaquinaria,
} from "@/payload-types";

/**
 * Búsqueda del sitio (`/buscar/?q=…`, CLAUDE.md §10.33 p.9): por nombre —y por
 * código, donde lo hay— en equipos nuevos, equipos usados disponibles, modelos
 * de repuesto y artículos del blog. API local de Payload (CLAUDE.md §3.2).
 *
 * Una consulta por grupo, con tope (`TOPE_POR_GRUPO`). `contains` es un
 * `ILIKE '%…%'`: no distingue mayúsculas, pero sí tildes.
 *
 * EN LA CACHÉ DE DATOS desde el 2026-10-15 (`datos:busqueda`, con el id del
 * despliegue en la clave): las búsquedas se repiten, y sin caché cada una
 * eran cuatro `ILIKE` contra la base. La clave es la consulta EN MINÚSCULAS
 * (el resultado no cambia, por el `ILIKE`), así que «CAT» y «cat» comparten
 * entrada. Vigencia de 10 min además de la etiqueta: lee cuatro colecciones y
 * no todos sus ganchos la invalidan (`revalidarIndices`).
 */

export type ResultadoBusqueda = {
  id: number;
  titulo: string;
  /** Dirección de la página del resultado. Nunca vacía. */
  href: string;
  /** Línea de contexto bajo el título (marca, tipo, categoría…). */
  detalle?: string;
};

export type GrupoBusqueda = {
  /** Resultados mostrados (a lo sumo `TOPE_POR_GRUPO`). */
  items: ResultadoBusqueda[];
  /** Cuántos casan en total. */
  total: number;
};

export type ResultadosBusqueda = {
  nuevos: GrupoBusqueda;
  usados: GrupoBusqueda;
  modelos: GrupoBusqueda;
  articulos: GrupoBusqueda;
};

const porNombreOCodigo = (texto: string): Where => ({
  or: [{ nombre: { contains: texto } }, { codigo: { contains: texto } }],
});

/** Vigencia de los resultados en caché, en segundos. */
export const VIGENCIA_BUSQUEDA = 600;

async function buscarEnLaBase(texto: string): Promise<ResultadosBusqueda> {
  const payload = await getPayload({ config });
  const comun = { depth: 1, limit: TOPE_POR_GRUPO, sort: "nombre", pagination: true } as const;

  const [nuevos, usados, modelos, articulos] = await Promise.all([
    payload.find({
      collection: "equipos-nuevos",
      where: porNombreOCodigo(texto),
      ...comun,
    }),
    payload.find({
      collection: "equipos-usados",
      where: { and: [{ disponible: { equals: true } }, { nombre: { contains: texto } }] },
      ...comun,
    }),
    payload.find({
      collection: "modelos-repuesto",
      where: porNombreOCodigo(texto),
      ...comun,
    }),
    payload.find({
      collection: "articulos",
      where: { titulo: { contains: texto } },
      depth: 0,
      limit: TOPE_POR_GRUPO,
      sort: "-fechaPublicacion",
    }),
  ]);

  return {
    nuevos: {
      total: nuevos.totalDocs,
      items: nuevos.docs.flatMap((e) => {
        const marca = poblado<MarcasMaquinaria>(e.marca);
        const tipo = poblado<TiposMaquinaria>(e.tipo);
        // Sin marca y tipo poblados no se puede construir la dirección: se omite.
        if (!marca || !tipo) return [];
        return [
          {
            id: e.id,
            titulo: e.nombre,
            href: rutas.equipoNuevo(marca.slug, tipo.slug, e.slug),
            detalle: `${marca.nombre} · ${tipo.nombre}`,
          },
        ];
      }),
    },
    usados: {
      total: usados.totalDocs,
      items: usados.docs.flatMap((u) => {
        // Las unidades usadas no tienen página propia (decisión del cliente):
        // el resultado lleva a su categoría, donde se listan.
        const categoria = poblado<CategoriasUsada>(u.categoria);
        if (!categoria) return [];
        return [
          {
            id: u.id,
            titulo: u.nombre,
            href: rutas.categoriaUsada(categoria.slug),
            detalle: `Maquinaria usada · ${categoria.nombre}`,
          },
        ];
      }),
    },
    modelos: {
      total: modelos.totalDocs,
      items: modelos.docs.flatMap((m) => {
        const marca = poblado<Marca>(m.marca);
        const tipo = poblado<TiposEquipo>(m.tipo);
        if (!marca || !tipo) return [];
        return [
          {
            id: m.id,
            titulo: m.nombre,
            href: rutas.modelo(marca.slug, tipo.slug, m.slug),
            detalle: `Repuestos · ${marca.nombre} · ${tipo.nombre}`,
          },
        ];
      }),
    },
    articulos: {
      total: articulos.totalDocs,
      items: articulos.docs.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        href: rutas.articulo(a.slug),
        detalle: "Noticias",
      })),
    },
  };
}

const busquedaEnCache = unstable_cache(buscarEnLaBase, ["busqueda", CLAVE_DESPLIEGUE], {
  revalidate: VIGENCIA_BUSQUEDA,
  tags: [ETIQUETAS_DATOS.busqueda],
});

/** Busca `texto` (ya normalizado con `normalizarConsulta`). */
export function buscar(texto: string): Promise<ResultadosBusqueda> {
  return busquedaEnCache(texto.toLocaleLowerCase("es"));
}
