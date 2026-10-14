import { cache } from "react";
import config from "@payload-config";
import { getPayload, type Where } from "payload";

/*
 * Las consultas de este módulo van envueltas en `cache()` de React.
 *
 * Sin ello cada página resolvía DOS VECES la misma cadena: una en
 * `generateMetadata` y otra en el componente, que no comparten resultado por
 * sí solos. `cache()` memoiza por petición y elimina esa duplicación. El coste
 * medido está en CLAUDE.md §10.10.
 *
 * Transparente para quien llama: las firmas no cambian. No memoiza cuando el
 * argumento es un array (identidad distinta en cada llamada); no empeora nada
 * respecto de antes, simplemente no ayuda ahí.
 */

import type {
  CategoriasMaquinaria,
  CategoriasUsada,
  EquiposNuevo,
  EquiposUsado,
  MarcasMaquinaria,
  TiposMaquinaria,
} from "@/payload-types";

import { SLUG_EXCAVADORAS, TARJETAS_POR_PESTANA } from "../portada/secciones";
import { POR_PAGINA, totalPaginas } from "../usados/paginacion";
import { conPrimeraImagen, idsDePrimeraImagen } from "../usados/primeraImagen";

/**
 * Acceso a datos de la sección maquinaria (API local de Payload, CLAUDE.md §3.2).
 * Separado de las consultas de repuestos porque son colecciones distintas
 * (ADR 0007).
 */

// --- Marcas -----------------------------------------------------------------
export const getMarcasMaquinaria = cache(async (): Promise<MarcasMaquinaria[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "marcas-maquinaria",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

export const getMarcaMaquinariaPorSlug = cache(
  async (slug: string): Promise<MarcasMaquinaria | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "marcas-maquinaria",
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);

// --- Tipos ------------------------------------------------------------------
export const getTiposMaquinaria = cache(async (): Promise<TiposMaquinaria[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tipos-maquinaria",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

export const getTiposDeMarcaMaquinaria = cache(
  async (marcaId: number): Promise<TiposMaquinaria[]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "tipos-maquinaria",
      where: { marca: { equals: marcaId } },
      depth: 0,
      limit: 0,
      sort: "nombre",
    });
    return docs;
  },
);

/**
 * Un tipo por slug DENTRO de una marca. La unicidad es compuesta (marca+slug),
 * así que buscar solo por slug devolvería el tipo de otra marca.
 */
export const getTipoMaquinariaPorSlug = cache(
  async (marcaId: number, slug: string): Promise<TiposMaquinaria | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "tipos-maquinaria",
      where: { and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }] },
      depth: 1,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);

// --- Equipos nuevos ---------------------------------------------------------
export const getEquiposNuevos = cache(async (): Promise<EquiposNuevo[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "equipos-nuevos",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

export const getEquiposDeTipo = cache(async (tipoId: number): Promise<EquiposNuevo[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "equipos-nuevos",
    where: { tipo: { equals: tipoId } },
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

/** Un equipo por slug DENTRO de un tipo. `depth: 2` puebla galería y marca. */
export const getEquipoNuevoPorSlug = cache(
  async (tipoId: number, slug: string): Promise<EquiposNuevo | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "equipos-nuevos",
      where: { and: [{ tipo: { equals: tipoId } }, { slug: { equals: slug } }] },
      depth: 2,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);

/**
 * «Otras referencias de esta categoría» de la ficha V2: hasta 3 equipos del
 * mismo tipo, sin el de la página. `depth: 1` puebla la primera imagen y el PDF.
 */
export const getOtrasReferencias = cache(
  async (tipoId: number, excluirId: number): Promise<EquiposNuevo[]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "equipos-nuevos",
      where: { and: [{ tipo: { equals: tipoId } }, { id: { not_equals: excluirId } }] },
      sort: "nombre",
      depth: 1,
      limit: 3,
    });
    return docs;
  },
);

/** Equipos de varios tipos a la vez: alimenta las categorías transversales. */
export const getEquiposDeTipos = cache(async (tipoIds: number[]): Promise<EquiposNuevo[]> => {
  if (tipoIds.length === 0) return [];
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "equipos-nuevos",
    where: { tipo: { in: tipoIds } },
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

// --- Categorías de la línea nueva -------------------------------------------
export const getCategoriasMaquinaria = cache(async (): Promise<CategoriasMaquinaria[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-maquinaria",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

export const getCategoriaMaquinariaPorSlug = cache(
  async (slug: string): Promise<CategoriasMaquinaria | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-maquinaria",
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);

// --- Línea usada ------------------------------------------------------------
export const getCategoriasUsada = cache(async (): Promise<CategoriasUsada[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-usada",
    depth: 0,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

export const getCategoriaUsadaPorSlug = cache(
  async (slug: string): Promise<CategoriasUsada | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-usada",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);

/** Una página del listado de usados de una categoría. */
export type PaginaDeUsados = {
  unidades: EquiposUsado[];
  /** Unidades disponibles en TODA la categoría, no solo en esta página. */
  total: number;
  paginas: number;
};

/**
 * Unidades DISPONIBLES de una categoría, una página cada vez (las vendidas no
 * se listan). Paginación en `src/lib/usados/paginacion.ts`.
 */
export const getEquiposUsadosDeCategoria = cache(
  async (categoriaId: number, pagina: number = 1): Promise<PaginaDeUsados> => {
    const payload = await getPayload({ config });
    const { docs, totalDocs } = await payload.find({
      collection: "equipos-usados",
      where: {
        and: [{ categoria: { equals: categoriaId } }, { disponible: { equals: true } }],
      },
      // Sin poblar: solo se pinta la primera foto, y `depth: 1` traía todas
      // (src/lib/usados/primeraImagen.ts).
      depth: 0,
      limit: POR_PAGINA,
      page: pagina,
      // El id desempata: con años repetidos, el orden tiene que ser el mismo en
      // cada página, o una unidad saldría en dos y otra en ninguna.
      sort: ["-anio", "id"],
    });
    const ids = idsDePrimeraImagen(docs);
    const fotos = ids.length
      ? (
          await payload.find({
            collection: "media",
            where: { id: { in: ids } },
            depth: 0,
            limit: 0,
            pagination: false,
          })
        ).docs
      : [];
    return {
      unidades: conPrimeraImagen(docs, fotos),
      total: totalDocs,
      paginas: totalPaginas(totalDocs),
    };
  },
);

/** Páginas del listado de cada categoría de usada, para `generateStaticParams`. */
export const getPaginasDeUsados = cache(async (): Promise<{ slug: string; paginas: number }[]> => {
  const payload = await getPayload({ config });
  const categorias = await getCategoriasUsada();
  return Promise.all(
    categorias.map(async (c) => {
      const { totalDocs } = await payload.count({
        collection: "equipos-usados",
        where: { and: [{ categoria: { equals: c.id } }, { disponible: { equals: true } }] },
      });
      return { slug: c.slug, paginas: totalPaginas(totalDocs) };
    }),
  );
});

// --- Portada (fase D: secciones 2 y 3 de ux-9) --------------------------------
/** Marcas con foto de tarjeta, para el carrusel de la sección 2. */
export const getMarcasDePortada = cache(async (): Promise<MarcasMaquinaria[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "marcas-maquinaria",
    where: { and: [{ imagenTarjeta: { exists: true } }, { ordenPortada: { exists: true } }] },
    depth: 1,
    limit: 0,
    sort: "ordenPortada",
  });
  return docs;
});

/**
 * Equipos usados DISPONIBLES para las pestañas de la sección 3: los de
 * excavadoras y los del resto, por separado y con su tope, para que un
 * inventario con muchas unidades de una categoría no deje vacía la otra
 * pestaña. `depth: 1` puebla la categoría (para enlazarla) y las imágenes.
 */
export const getEquiposUsadosDePortada = cache(async (): Promise<EquiposUsado[]> => {
  const payload = await getPayload({ config });
  const consulta = (categoria: Where) =>
    payload.find({
      collection: "equipos-usados",
      where: { and: [{ disponible: { equals: true } }, categoria] },
      depth: 1,
      limit: TARJETAS_POR_PESTANA,
      sort: "-updatedAt",
    });
  const noAditamento: Where = { pestanaPortada: { not_equals: "aditamentos" } };
  const [excavadoras, otros, aditamentos] = await Promise.all([
    consulta({ and: [{ "categoria.slug": { equals: SLUG_EXCAVADORAS } }, noAditamento] }),
    consulta({ and: [{ "categoria.slug": { not_equals: SLUG_EXCAVADORAS } }, noAditamento] }),
    consulta({ pestanaPortada: { equals: "aditamentos" } }),
  ]);
  return [...excavadoras.docs, ...otros.docs, ...aditamentos.docs];
});
