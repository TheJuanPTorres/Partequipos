import { cache } from "react";
import { unstable_cache } from "next/cache";
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
  MarcasUsada,
  Media,
  TiposMaquinaria,
} from "@/payload-types";

import { SLUG_EXCAVADORAS, TARJETAS_POR_PESTANA } from "../portada/secciones";
import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "../cacheDatos";
import type { EquipoFiltrable } from "../nueva/filtros";
import { rutas } from "../routes";
import type { UnidadFiltrable } from "../usados/filtros";
import { idsDePrimeraImagen } from "../usados/primeraImagen";

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
/*
 * Los listados de usada se pintan en cada petición (leen los filtros de la
 * URL), así que sus datos van en la caché de datos (`src/lib/cacheDatos.ts`),
 * etiquetada: la invalidan los ganchos de `equipos-usados` y
 * `categorias-usada`. Dentro de `unstable_cache` no se puede usar `cache()`
 * de React, y no hace falta: la entrada ya se comparte entre peticiones.
 */
const categoriasUsadaEnCache = unstable_cache(
  async (): Promise<CategoriasUsada[]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-usada",
      depth: 0,
      limit: 0,
      sort: "nombre",
    });
    return docs;
  },
  ["categorias-usada", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.usados] },
);

export const getCategoriasUsada = cache(() => categoriasUsadaEnCache());

export const getCategoriaUsadaPorSlug = cache(
  async (slug: string): Promise<CategoriasUsada | null> =>
    (await getCategoriasUsada()).find((c) => c.slug === slug) ?? null,
);

const marcasUsadaEnCache = unstable_cache(
  async (): Promise<MarcasUsada[]> => {
    const payload = await getPayload({ config });
    // `depth: 1` con `populate` acotado: de la marca de nueva y de la de
    // repuestos solo hace falta la dirección para enlazarlas, y del logo, lo
    // que pinta `next/image`.
    const { docs } = await payload.find({
      collection: "marcas-usada",
      depth: 1,
      limit: 0,
      sort: "nombre",
      populate: {
        "marcas-maquinaria": { slug: true, nombre: true },
        marcas: { slug: true, nombre: true },
        media: { url: true, alt: true, width: true, height: true },
      },
    });
    return docs;
  },
  ["marcas-usada", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.usados] },
);

/** Las marcas de usada (paso b del marketplace), por nombre. */
export const getMarcasUsada = cache(() => marcasUsadaEnCache());

export const getMarcaUsadaPorSlug = cache(
  async (slug: string): Promise<MarcasUsada | null> =>
    (await getMarcasUsada()).find((m) => m.slug === slug) ?? null,
);

/** La primera foto de una unidad, lo justo para la tarjeta. */
export type FotoDeTarjeta = Pick<
  Media,
  "id" | "url" | "alt" | "width" | "height" | "focalX" | "focalY"
>;

/** Una unidad usada DISPONIBLE, con lo que pintan la tarjeta y los filtros. */
export type UnidadUsada = UnidadFiltrable & {
  nombre: string;
  categoria: number;
  marcaUsada: number | null;
  modelo?: string | null;
  ubicacion?: string | null;
  descripcion?: string | null;
  foto: FotoDeTarjeta | null;
};

/**
 * TODAS las unidades usadas DISPONIBLES (las vendidas no se listan), con su
 * primera foto ya resuelta. Dos consultas por entrada de caché, no por
 * petición: el listado filtra, cuenta, ordena y pagina en memoria
 * (`src/lib/filtros/`). Con ~150 unidades (y ~500 previstas) la entrada
 * sigue muy por debajo del límite de la caché de datos.
 *
 * Solo la primera foto: `depth: 1` traía todas (1.247 registros de `Media`
 * para pintar 113 tarjetas, `src/lib/usados/primeraImagen.ts`).
 */
const inventarioUsadosEnCache = unstable_cache(
  async (): Promise<UnidadUsada[]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "equipos-usados",
      where: { disponible: { equals: true } },
      depth: 0,
      limit: 0,
      pagination: false,
      select: {
        nombre: true,
        categoria: true,
        marcaUsada: true,
        marca: true,
        modelo: true,
        anio: true,
        horometro: true,
        pesoOperativo: true,
        ubicacion: true,
        descripcion: true,
        imagenes: true,
      },
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
            select: { url: true, alt: true, width: true, height: true, focalX: true, focalY: true },
          })
        ).docs
      : [];
    const porId = new Map(fotos.map((f) => [f.id, f]));
    const [categorias, marcas] = await Promise.all([
      categoriasUsadaEnCache(),
      marcasUsadaEnCache(),
    ]);
    const ref = (d: { slug: string; nombre: string } | undefined) =>
      d ? { slug: d.slug, nombre: d.nombre } : null;
    const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));
    const marcaPorId = new Map(marcas.map((m) => [m.id, m]));
    const idRel = (v: unknown): number | null =>
      typeof v === "number"
        ? v
        : v && typeof v === "object" && "id" in v
          ? (v as { id: number }).id
          : null;
    return docs.map((u) => {
      const categoriaId = idRel(u.categoria)!;
      const marcaId = idRel(u.marcaUsada);
      const primera = Array.isArray(u.imagenes) ? u.imagenes[0] : null;
      const idFoto = primera == null ? null : typeof primera === "object" ? primera.id : primera;
      const foto = idFoto == null ? undefined : porId.get(idFoto);
      return {
        id: u.id,
        nombre: u.nombre,
        categoria: categoriaId,
        categoriaRef: ref(categoriaPorId.get(categoriaId)),
        marcaUsada: marcaId,
        marcaRef: marcaId === null ? null : ref(marcaPorId.get(marcaId)),
        marca: u.marca,
        modelo: u.modelo,
        anio: u.anio,
        horometro: u.horometro,
        pesoOperativo: u.pesoOperativo,
        ubicacion: u.ubicacion,
        descripcion: u.descripcion,
        foto: foto
          ? {
              id: foto.id,
              url: foto.url,
              alt: foto.alt,
              width: foto.width,
              height: foto.height,
              focalX: foto.focalX,
              focalY: foto.focalY,
            }
          : null,
      };
    });
  },
  ["inventario-usados", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.usados] },
);

export const getInventarioUsados = cache(() => inventarioUsadosEnCache());

/** Las unidades disponibles de una marca. */
export const getUnidadesDeMarcaUsada = cache(async (marcaId: number): Promise<UnidadUsada[]> =>
  (await getInventarioUsados()).filter((u) => u.marcaUsada === marcaId),
);

/** Las unidades disponibles de una categoría. */
export const getUnidadesDeCategoriaUsada = cache(
  async (categoriaId: number): Promise<UnidadUsada[]> =>
    (await getInventarioUsados()).filter((u) => u.categoria === categoriaId),
);

// --- Listado de nueva («Categoría secundaria» de ux-9) -----------------------
/*
 * El índice de nueva y sus categorías se pintan en cada petición (leen los
 * filtros de la URL, como usados), así que sus datos van en la caché de datos
 * con la etiqueta `datos:nueva`, que invalidan los ganchos de
 * `equipos-nuevos`, `marcas-maquinaria`, `tipos-maquinaria` y
 * `categorias-maquinaria` (`src/lib/cacheDatos.ts`).
 */

/** Lo que pinta la tarjeta de un equipo nuevo y lo que usan sus filtros. */
export type EquipoNuevoListado = EquipoFiltrable & {
  slug: string;
  /** La ficha, con su barra final. */
  href: string;
  tipoId: number;
  foto: FotoDeTarjeta | null;
  /** El logo de la marca, que va sobre la foto. */
  logo: FotoDeTarjeta | null;
  /** Los tres datos de la tarjeta, tal como los escribe la ficha técnica. */
  datos: { peso: string | null; potencia: string | null; motor: string | null };
  /** El PDF de la ficha técnica, si lo hay. */
  pdf: string | null;
};

/** La fila de la ficha técnica que corresponde a un dato de la tarjeta. */
export function datoDeFicha(
  filas: { etiqueta?: string | null; valor?: string | null }[] | null | undefined,
  patron: RegExp,
): string | null {
  const fila = (filas ?? []).find((f) => f.etiqueta && patron.test(f.etiqueta));
  return fila?.valor?.trim() || null;
}

const PATRONES_TARJETA = {
  peso: /^peso\s+(operativo|operacional|de\s+operaci[oó]n|en\s+funcionamiento)/i,
  potencia: /potencia/i,
  motor: /^motor\b/i,
};

type CategoriaNueva = Pick<
  CategoriasMaquinaria,
  "id" | "slug" | "nombre" | "descripcion" | "seo"
> & {
  tipos: number[];
};

const listadoNuevaEnCache = unstable_cache(
  async (): Promise<{ equipos: EquipoNuevoListado[]; categorias: CategoriaNueva[] }> => {
    const payload = await getPayload({ config });
    const [equipos, marcas, tipos, categorias] = await Promise.all([
      payload.find({
        collection: "equipos-nuevos",
        depth: 0,
        limit: 0,
        pagination: false,
        select: {
          nombre: true,
          slug: true,
          marca: true,
          tipo: true,
          codigo: true,
          pesoOperativoKg: true,
          imagenes: true,
          fichaTecnica: true,
          fichaTecnicaPdf: true,
        },
      }),
      payload.find({
        collection: "marcas-maquinaria",
        depth: 0,
        limit: 0,
        pagination: false,
        select: { slug: true, nombre: true, logo: true },
      }),
      payload.find({
        collection: "tipos-maquinaria",
        depth: 0,
        limit: 0,
        pagination: false,
        select: { slug: true, nombre: true, marca: true },
      }),
      payload.find({
        collection: "categorias-maquinaria",
        depth: 0,
        limit: 0,
        pagination: false,
        sort: "nombre",
        select: { slug: true, nombre: true, descripcion: true, seo: true, tiposIncluidos: true },
      }),
    ]);
    const idRel = (v: unknown): number | null =>
      typeof v === "number"
        ? v
        : v && typeof v === "object" && "id" in v
          ? (v as { id: number }).id
          : null;

    // Solo las fotos que se pintan: la primera de cada equipo y los logos.
    const idsFotos = new Set<number>(idsDePrimeraImagen(equipos.docs));
    for (const m of marcas.docs) {
      const id = idRel(m.logo);
      if (id !== null) idsFotos.add(id);
    }
    const idsPdf = [
      ...new Set(equipos.docs.map((e) => idRel(e.fichaTecnicaPdf)).filter((x) => x !== null)),
    ];
    const [fotos, pdfs] = await Promise.all([
      idsFotos.size
        ? payload.find({
            collection: "media",
            where: { id: { in: [...idsFotos] } },
            depth: 0,
            limit: 0,
            pagination: false,
            // Con `select`, la URL de un fichero sale null si no se pide `filename`
            // (Payload la calcula con él).
            select: {
              url: true,
              filename: true,
              alt: true,
              width: true,
              height: true,
              focalX: true,
              focalY: true,
            },
          })
        : Promise.resolve({ docs: [] as Media[] }),
      idsPdf.length
        ? payload.find({
            collection: "documentos",
            where: { id: { in: idsPdf } },
            depth: 0,
            limit: 0,
            pagination: false,
            select: { url: true, filename: true },
          })
        : Promise.resolve({ docs: [] as { id: number; url?: string | null }[] }),
    ]);
    const foto = (id: number | null): FotoDeTarjeta | null => {
      const f = id === null ? undefined : fotos.docs.find((x) => x.id === id);
      return f
        ? {
            id: f.id,
            url: f.url,
            alt: f.alt,
            width: f.width,
            height: f.height,
            focalX: f.focalX,
            focalY: f.focalY,
          }
        : null;
    };
    const pdfPorId = new Map(pdfs.docs.map((d) => [d.id, d.url ?? null]));
    const marcaPorId = new Map(marcas.docs.map((m) => [m.id, m]));
    const tipoPorId = new Map(tipos.docs.map((t) => [t.id, t]));

    const lista: EquipoNuevoListado[] = [];
    for (const e of equipos.docs) {
      const marca = marcaPorId.get(idRel(e.marca) ?? -1);
      const tipo = tipoPorId.get(idRel(e.tipo) ?? -1);
      if (!marca || !tipo) continue; // sin marca o tipo no hay URL de la ficha
      const primera = Array.isArray(e.imagenes) ? e.imagenes[0] : null;
      lista.push({
        id: e.id,
        nombre: e.nombre,
        slug: e.slug,
        href: `${rutas.equipoNuevo(marca.slug, tipo.slug, e.slug)}/`,
        codigo: e.codigo,
        marcaRef: { slug: marca.slug, nombre: marca.nombre },
        tipoRef: { slug: tipo.slug, nombre: tipo.nombre },
        tipoId: tipo.id,
        pesoKg: e.pesoOperativoKg ?? null,
        foto: foto(primera == null ? null : idRel(primera)),
        logo: foto(idRel(marca.logo)),
        datos: {
          peso: datoDeFicha(e.fichaTecnica, PATRONES_TARJETA.peso),
          potencia: datoDeFicha(e.fichaTecnica, PATRONES_TARJETA.potencia),
          motor: datoDeFicha(e.fichaTecnica, PATRONES_TARJETA.motor),
        },
        pdf: pdfPorId.get(idRel(e.fichaTecnicaPdf) ?? -1) ?? null,
      });
    }
    return {
      equipos: lista,
      categorias: categorias.docs.map((c) => ({
        id: c.id,
        slug: c.slug,
        nombre: c.nombre,
        descripcion: c.descripcion,
        seo: c.seo,
        tipos: (c.tiposIncluidos ?? []).map(idRel).filter((x): x is number => x !== null),
      })),
    };
  },
  ["listado-nueva", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.nueva] },
);

export const getListadoNueva = cache(() => listadoNuevaEnCache());

/** Los equipos de una categoría de nueva: los de los tipos que incluye. */
export const getCategoriaNuevaConEquipos = cache(async (slug: string) => {
  const { equipos, categorias } = await getListadoNueva();
  const categoria = categorias.find((c) => c.slug === slug);
  if (!categoria) return null;
  const tipos = new Set(categoria.tipos);
  return { categoria, equipos: equipos.filter((e) => tipos.has(e.tipoId)) };
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
