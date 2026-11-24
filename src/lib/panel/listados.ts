import type { CollectionConfig, Field } from "payload";

/**
 * LISTADOS DEL PANEL (organización del panel, fase 2, PR 5, 2026-11-19; plan
 * `2026-11-18-panel-organizacion-fase1.md` §5): qué columnas salen por defecto en la lista de cada
 * colección y por qué campos busca su buscador. Una sola tabla para todas, aplicada en
 * `payload.config.ts` con `conListados`: así un cambio de columnas no toca la colección (ni choca
 * con quien trabaja en sus campos). Es el ÚNICO sitio de `defaultColumns` y `listSearchableFields`
 * de estas colecciones: las suyas propias se quitaron (2026-11-19). Sin esquema.
 *
 * - La primera columna es la imagen cuando la hay: las de subida sin celda propia se pintan como
 *   miniatura (`CeldaMiniatura`, la de la F3).
 * - «Mostrar en la web» ya trae su insignia (`mostrarEnWeb.ts`).
 * - El orden por arrastre (`orderable`, de B) añade su asa solo; no hace falta columna. El campo
 *   «Orden» antiguo ya no lo lee la web (#514), así que no sale como columna.
 * - El código («320D») va en el buscador: es como busca un comercial; el nombre solo no basta.
 * - Los artículos llevan «Estado» (`_status`: borrador o publicado), que Payload añade con los
 *   borradores (#521).
 * - Cada columna y cada campo de búsqueda tiene que existir (`listados.test.ts`).
 */
export type Listado = {
  columnas: string[];
  busqueda?: string[];
};

export const LISTADOS: Record<string, Listado> = {
  // Tarea 3 (prototipo): el nombre lleva la miniatura y los dos abren la ficha; «Estado» y los
  // dos interruptores directos.
  "equipos-usados": {
    columnas: [
      "nombre",
      "estadoWeb",
      "categoria",
      "marcaUsada",
      "anio",
      "mostrarEnWeb",
      "disponible",
      "fechaPublicacion",
    ],
    busqueda: ["nombre", "marca", "modelo"],
  },
  // Fase 2 de la tarea 3: miniatura con el nombre (abren la ficha), «Estado» e interruptor directo.
  "equipos-nuevos": {
    columnas: ["nombre", "estadoWeb", "marca", "tipo", "mostrarEnWeb"],
    busqueda: ["nombre", "codigo"],
  },
  "modelos-repuesto": {
    columnas: ["imagenes", "nombre", "codigo", "marca", "tipo", "mostrarEnWeb"],
    busqueda: ["nombre", "codigo"],
  },
  marcas: { columnas: ["logo", "nombre"], busqueda: ["nombre"] },
  "marcas-maquinaria": { columnas: ["logo", "nombre", "mostrarEnWeb"], busqueda: ["nombre"] },
  "marcas-usada": { columnas: ["logo", "nombre"], busqueda: ["nombre"] },
  "marcas-lubricante": { columnas: ["logo", "nombre"], busqueda: ["nombre"] },
  "tipos-equipo": { columnas: ["nombre", "marca", "tipoPadre"], busqueda: ["nombre"] },
  "tipos-maquinaria": { columnas: ["imagen", "nombre", "marca"], busqueda: ["nombre"] },
  "categorias-maquinaria": { columnas: ["imagen", "nombre"], busqueda: ["nombre"] },
  "categorias-usada": {
    columnas: ["imagen", "nombre", "enOtros", "mostrarEnWeb"],
    busqueda: ["nombre"],
  },
  "categorias-tecnicas": { columnas: ["imagen", "nombre", "padre"], busqueda: ["nombre"] },
  "categorias-lubricante": {
    columnas: ["imagen", "nombre", "marca"],
    busqueda: ["nombre"],
  },
  articulos: {
    columnas: ["imagenDestacada", "titulo", "_status", "categoria", "fechaPublicacion"],
    busqueda: ["titulo", "entradilla"],
  },
  solicitudes: {
    columnas: ["estado", "tipo", "nombre", "correo", "referenciaTexto", "createdAt"],
    busqueda: ["nombre", "correo", "empresa", "mensaje"],
  },
  media: { columnas: ["filename", "alt", "width", "updatedAt"], busqueda: ["filename", "alt"] },
  paginas: { columnas: ["titulo", "slug", "diseno"], busqueda: ["titulo"] },
};

const CELDA_MINIATURA = "/components/admin/celdas/CeldaMiniatura";

/** Los campos con datos en el primer nivel (los de pestañas, filas y plegables sin nombre, también). */
export function camposDeDatos(campos: Field[]): Field[] {
  return campos.flatMap((c) => {
    if (c.type === "tabs")
      return c.tabs.flatMap((t) => ("name" in t && t.name ? [] : camposDeDatos(t.fields)));
    if (!("name" in c) && "fields" in c && Array.isArray(c.fields)) return camposDeDatos(c.fields);
    return [c];
  });
}

/** Una columna de subida sin celda propia se pinta como miniatura. */
function conMiniatura(campos: Field[], columnas: Set<string>): Field[] {
  return campos.map((c) => {
    if (c.type === "tabs") {
      return {
        ...c,
        tabs: c.tabs.map((t) => ({
          ...t,
          fields: "name" in t && t.name ? t.fields : conMiniatura(t.fields, columnas),
        })),
      };
    }
    if (!("name" in c) && "fields" in c && Array.isArray(c.fields)) {
      return { ...c, fields: conMiniatura(c.fields, columnas) } as Field;
    }
    if (c.type !== "upload" || !columnas.has(c.name)) return c;
    const admin = c.admin ?? {};
    if (admin.components?.Cell) return c;
    return {
      ...c,
      admin: { ...admin, components: { ...admin.components, Cell: CELDA_MINIATURA } },
    } as Field;
  });
}

/** Componentes encima de la tabla: el filtro rápido de las imágenes pequeñas. */
const ENCIMA_DE_LA_TABLA: Record<string, string> = {
  media: "/components/admin/listados/FiltroFotosPequenas",
};

export function conListados(colecciones: CollectionConfig[]): CollectionConfig[] {
  return colecciones.map((c) => {
    const listado = LISTADOS[c.slug];
    if (!listado) return c;
    const encima = ENCIMA_DE_LA_TABLA[c.slug];
    return {
      ...c,
      admin: {
        ...c.admin,
        defaultColumns: listado.columnas,
        ...(listado.busqueda ? { listSearchableFields: listado.busqueda } : {}),
        ...(encima
          ? {
              components: {
                ...c.admin?.components,
                beforeListTable: [...(c.admin?.components?.beforeListTable ?? []), encima],
              },
            }
          : {}),
      },
      fields: conMiniatura(c.fields, new Set(listado.columnas)),
    };
  });
}
