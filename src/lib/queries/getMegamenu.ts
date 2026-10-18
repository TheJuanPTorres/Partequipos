import { cache } from "react";
import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";

import { construirMegamenu, type PanelMenu } from "@/lib/megamenu";

/**
 * Datos del megamenú (`src/lib/megamenu.ts`): siete consultas LIGERAS —solo
 * nombre, slug y marca, `depth: 0`— porque la cabecera va en todas las
 * páginas y esto se ejecuta en cada una al construir el sitio (CLAUDE.md
 * §10.10). Las dos de MARCAS llevan además el logo con `depth: 1`, pero de
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
    ] = await Promise.all([
      payload.find({ collection: "marcas-maquinaria", ...marcas }),
      payload.find({ collection: "tipos-maquinaria", ...base, select: conMarca }),
      payload.find({ collection: "categorias-maquinaria", ...base, select: sinMarca }),
      payload.find({ collection: "categorias-usada", ...base, select: sinMarca }),
      payload.find({ collection: "marcas", ...marcas }),
      payload.find({ collection: "tipos-equipo", ...base, select: conMarca }),
      // Solo el tipo de cada equipo: el menú no enlaza a los tipos de maquinaria nueva sin equipos.
      payload.find({ collection: "equipos-nuevos", ...base, select: { tipo: true } }),
    ]);

    return construirMegamenu({
      marcasMaquinaria: marcasMaquinaria.docs,
      tiposMaquinaria: tiposMaquinaria.docs,
      categoriasNueva: categoriasNueva.docs,
      categoriasUsada: categoriasUsada.docs,
      marcasRepuestos: marcasRepuestos.docs,
      tiposRepuestos: tiposRepuestos.docs,
      equiposNuevos: equiposNuevos.docs,
    });
  },
  ["megamenu", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.marco] },
);

export const getMegamenu = cache(() => megamenuEnCache());
