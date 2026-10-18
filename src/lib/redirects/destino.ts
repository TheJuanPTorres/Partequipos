import {
  SEGMENTO_BLOG_CATEGORIA,
  SEGMENTO_CATEGORIAS_REPUESTOS,
  SEGMENTO_BLOG_INDICE,
  SEGMENTO_LUBRICANTES,
  SEGMENTO_MAQUINARIA,
  SEGMENTO_MARCAS,
  SEGMENTO_MARCAS_MAQUINARIA,
  SEGMENTO_NUEVA,
  SEGMENTO_REPUESTOS,
  SEGMENTO_USADA,
} from "../routes";

/**
 * ¿A qué ruta del sitio nuevo corresponde un destino de redirect?
 *
 * POR QUÉ EXISTE. Nada comprobaba que el destino de un redirect llevara a algún
 * sitio. Un 301 hacia un 404 es **peor** que el 404 original: el rastreador
 * gasta presupuesto siguiéndolo, no recibe contenido y no se transfiere ninguna
 * autoridad. Se detectó al cargar los duplicados `-copy`, cuyo destino existía
 * en el rastreo pero no en los datos.
 *
 * Este módulo es PURO: no toca la base ni la red. Traduce una ruta al par
 * (colección, criterio de búsqueda) que hay que comprobar, y quien lo llame
 * decide cómo resolverlo. Así se puede probar sin levantar nada.
 */

/** Colecciones que pueden respaldar una ruta pública. */
export type ColeccionDestino =
  | "marcas"
  | "categorias-tecnicas"
  | "tipos-equipo"
  | "modelos-repuesto"
  | "marcas-maquinaria"
  | "tipos-maquinaria"
  | "equipos-nuevos"
  | "categorias-maquinaria"
  | "categorias-usada"
  | "marcas-usada"
  | "equipos-usados"
  | "marcas-lubricante"
  | "categorias-lubricante"
  | "categorias-blog"
  | "paginas"
  | "articulos";

export type Destino =
  /** Ruta estática: existe siempre, no depende de ningún documento. */
  | { clase: "estatica"; ruta: string }
  /** Ruta dinámica: existe si existe el documento. `padres` da el contexto. */
  | {
      clase: "dinamica";
      /** Colecciones candidatas, en orden de precedencia. */
      colecciones: ColeccionDestino[];
      slug: string;
      /** Slugs de los segmentos padre, para validar la cadena completa. */
      padres: string[];
    }
  /** URL absoluta a otro dominio: fuera de nuestro control. */
  | { clase: "externa"; url: string }
  /** No encaja en ninguna ruta construida: es el caso peligroso. */
  | { clase: "sin-ruta" };

/** Rutas estáticas del sitio, sin barra inicial ni final. */
const ESTATICAS = new Set([
  "",
  SEGMENTO_REPUESTOS,
  `${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}`,
  `${SEGMENTO_REPUESTOS}/${SEGMENTO_CATEGORIAS_REPUESTOS}`,
  SEGMENTO_MAQUINARIA,
  `${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}`,
  `${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}`,
  `${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}`,
  SEGMENTO_BLOG_INDICE,
]);

export function clasificarDestino(destino: string): Destino {
  const crudo = (destino ?? "").trim();
  if (!crudo) return { clase: "sin-ruta" };

  if (/^https?:\/\//i.test(crudo)) return { clase: "externa", url: crudo };

  const sinQuery = (crudo.split("?")[0] ?? "").split("#")[0] ?? "";
  const partes = sinQuery.split("/").filter(Boolean);
  const clave = partes.join("/");

  if (ESTATICAS.has(clave)) return { clase: "estatica", ruta: `/${clave}` };

  /** Acceso seguro a un segmento; `noUncheckedIndexedAccess` está activo. */
  const seg = (i: number): string => partes[i] ?? "";

  const din = (colecciones: ColeccionDestino[], slug: string, padres: string[] = []): Destino => ({
    clase: "dinamica",
    colecciones,
    slug,
    padres,
  });

  // --- Categorías técnicas de repuestos ---------------------------------------
  if (seg(0) === SEGMENTO_REPUESTOS && seg(1) === SEGMENTO_CATEGORIAS_REPUESTOS) {
    if (partes.length === 3) return din(["categorias-tecnicas"], seg(2));
    return { clase: "sin-ruta" };
  }

  // --- Repuestos ------------------------------------------------------------
  if (seg(0) === SEGMENTO_REPUESTOS && seg(1) === SEGMENTO_MARCAS) {
    if (partes.length === 3) return din(["marcas"], seg(2));
    if (partes.length === 4) return din(["tipos-equipo"], seg(3), [seg(2)]);
    // Un modelo o, bajo su tipo padre, un tipo ANIDADO (src/lib/repuestos/anidado.ts).
    if (partes.length === 5) {
      return din(["modelos-repuesto", "tipos-equipo"], seg(4), [seg(2), seg(3)]);
    }
    // Un modelo de un tipo anidado (las excavadoras de CASE): marca, padre y tipo.
    if (partes.length === 6) return din(["modelos-repuesto"], seg(5), [seg(2), seg(3), seg(4)]);
    return { clase: "sin-ruta" };
  }

  // --- Maquinaria -----------------------------------------------------------
  if (seg(0) === SEGMENTO_MAQUINARIA) {
    if (seg(1) === SEGMENTO_USADA && partes.length === 3) {
      return din(["categorias-usada"], seg(2));
    }
    // Una unidad: /<categoria>/<unidad>. «marcas» es el segmento fijo de las marcas
    // (partes.length 4 con seg(2) = marcas se resuelve más abajo, como marca).
    if (seg(1) === SEGMENTO_USADA && seg(2) !== SEGMENTO_MARCAS_MAQUINARIA && partes.length === 4) {
      return din(["equipos-usados"], seg(3), [seg(2)]);
    }
    if (seg(1) === SEGMENTO_USADA && seg(2) === SEGMENTO_MARCAS_MAQUINARIA && partes.length === 4) {
      return din(["marcas-usada"], seg(3));
    }
    if (seg(1) === SEGMENTO_NUEVA) {
      if (seg(2) === SEGMENTO_MARCAS_MAQUINARIA) {
        if (partes.length === 4) return din(["marcas-maquinaria"], seg(3));
        if (partes.length === 5) return din(["tipos-maquinaria"], seg(4), [seg(3)]);
        if (partes.length === 6) return din(["equipos-nuevos"], seg(5), [seg(3), seg(4)]);
        return { clase: "sin-ruta" };
      }
      // Categoría transversal suelta.
      if (partes.length === 3) return din(["categorias-maquinaria"], seg(2));
    }
    return { clase: "sin-ruta" };
  }

  // --- Lubricantes ----------------------------------------------------------
  if (seg(0) === SEGMENTO_LUBRICANTES) {
    if (partes.length === 2) return din(["marcas-lubricante"], seg(1));
    if (partes.length === 3) return din(["categorias-lubricante"], seg(2), [seg(1)]);
    return { clase: "sin-ruta" };
  }

  // --- Blog -----------------------------------------------------------------
  if (seg(0) === SEGMENTO_BLOG_CATEGORIA) {
    if (partes.length === 2) return din(["categorias-blog"], seg(1));
    return { clase: "sin-ruta" };
  }

  /*
   * Raíz. Un segmento puede ser página institucional o artículo, en ese orden
   * de precedencia (el mismo que aplica `[...slug]`). Varios segmentos solo
   * pueden ser una página institucional anidada, cuyo slug lleva la barra.
   */
  if (partes.length === 1) return din(["paginas", "articulos"], clave);
  return din(["paginas"], clave);
}
