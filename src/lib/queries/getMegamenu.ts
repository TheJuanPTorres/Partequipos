import { cache } from "react";
import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";

import { construirMegamenu, type PanelMenu } from "@/lib/megamenu";
import { DE_MARCA_VISIBLE, MARCA_VISIBLE } from "@/lib/nueva/visibilidad";

/**
 * Datos del megamenú (`src/lib/megamenu.ts`): doce consultas LIGERAS (con las
 * categorías técnicas, la política de garantías del global `cabecera` y las
 * marcas y categorías de lubricante) —solo
 * nombre, slug y marca, `depth: 0`— porque la cabecera va en todas las
 * páginas y esto se ejecuta en cada una al construir el sitio (CLAUDE.md
 * §10.10). Las dos de MARCAS llevan además el logo con `depth: 1` (y las categorías
 * técnicas, su foto), pero de
 * la imagen solo url, ancho y alto (`populate`).
 *
 * En la caché de datos del MARCO (`datos:marco`, `src/lib/cacheDatos.ts`): sin
 * ella, cada visita a una página dinámica repetía las 7 consultas. La
 * invalidan los ganchos de las 6 colecciones (`megamenuHooks.ts`) a través de
 * `revalidarTodoElSitio`.
 */
const megamenuEnCache = unstable_cache(
  async (): Promise<Record<string, PanelMenu>> => {
    const payload = await getPayload({ config });
    const base = { depth: 0, limit: 0, pagination: false, sort: "nombre" } as const;
    const sinMarca = { nombre: true, slug: true } as const;
    const conMarca = { nombre: true, slug: true, marca: true } as const;
    const marcas = {
      ...base,
      depth: 1,
      select: { nombre: true, slug: true, logo: true, logoOscuroEnMenu: true },
      // `filename` hace falta aunque no se pinte: la `url` la calcula un gancho
      // de lectura a partir de él, y sin él sale `null` (medido en el preview).
      populate: { media: { url: true, filename: true, width: true, height: true } },
    } as const;

    const [
      marcasMaquinaria,
      tiposMaquinaria,
      categoriasNueva,
      categoriasUsada,
      marcasRepuestos,
      tiposRepuestos,
      equiposNuevos,
      equiposUsados,
      categoriasTecnicas,
      cabecera,
      marcasLubricante,
      categoriasLubricante,
    ] = await Promise.all([
      // Sin las marcas de nueva ocultas, ni sus tipos ni sus equipos (`visibilidad.ts`).
      payload.find({ collection: "marcas-maquinaria", ...marcas, where: MARCA_VISIBLE }),
      payload.find({
        collection: "tipos-maquinaria",
        ...base,
        where: DE_MARCA_VISIBLE,
        select: { ...conMarca, subtipos: true },
      }),
      payload.find({ collection: "categorias-maquinaria", ...base, select: sinMarca }),
      payload.find({
        collection: "categorias-usada",
        ...base,
        // Sin las ocultas (`mostrarEnWeb`, 2026-10-20).
        where: { mostrarEnWeb: { not_equals: false } },
        select: { ...sinMarca, enOtros: true, orden: true },
      }),
      payload.find({ collection: "marcas", ...marcas }),
      payload.find({
        collection: "tipos-equipo",
        ...base,
        select: { ...conMarca, slugPadre: true },
      }),
      // Solo el tipo de cada equipo: el menú no enlaza a los tipos de maquinaria nueva sin equipos.
      payload.find({
        collection: "equipos-nuevos",
        ...base,
        where: DE_MARCA_VISIBLE,
        select: { tipo: true },
      }),
      // Solo la categoría de las unidades disponibles: «Sin unidades por ahora» en las vacías.
      payload.find({
        collection: "equipos-usados",
        ...base,
        where: { disponible: { equals: true } },
        select: { categoria: true },
      }),
      // «Repuestos por categoría técnica» (2026-10-20): nombre, dirección, orden y la
      // foto de la tarjeta (de la imagen, solo url y medidas, como los logos).
      payload.find({
        collection: "categorias-tecnicas",
        ...marcas,
        select: { nombre: true, slug: true, ordenMarca: true, imagen: true },
      }),
      // «Política de garantías y repuestos», editable en el global de la cabecera.
      payload.findGlobal({ slug: "cabecera", depth: 0, select: { politicaRepuestos: true } }),
      // «Lubricantes» (2026-10-20): las marcas y sus categorías con su enlace del menú.
      payload.find({ collection: "marcas-lubricante", ...base, select: sinMarca }),
      payload.find({
        collection: "categorias-lubricante",
        ...base,
        select: { ...conMarca, enlaceMenu: true },
      }),
    ]);

    return construirMegamenu({
      marcasMaquinaria: marcasMaquinaria.docs,
      tiposMaquinaria: tiposMaquinaria.docs,
      categoriasNueva: categoriasNueva.docs,
      categoriasUsada: categoriasUsada.docs,
      marcasRepuestos: marcasRepuestos.docs,
      tiposRepuestos: tiposRepuestos.docs,
      equiposNuevos: equiposNuevos.docs,
      equiposUsados: equiposUsados.docs,
      categoriasTecnicas: categoriasTecnicas.docs,
      politicaRepuestos: cabecera.politicaRepuestos ?? null,
      marcasLubricante: marcasLubricante.docs,
      categoriasLubricante: categoriasLubricante.docs,
    });
  },
  ["megamenu", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.marco] },
);

export const getMegamenu = cache(() => megamenuEnCache());
