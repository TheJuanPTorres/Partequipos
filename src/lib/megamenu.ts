import { rutas } from "./routes";

/**
 * MEGAMENÚ DE ESCRITORIO — lógica pura (decisiones-home-ux9.md §26; propuesta
 * aprobada el 2026-10-05, `partequipos-cierre\propuestas\2026-10-05-megamenu.md`).
 *
 * La FORMA es la del export 2162 del 2026-10-05 de Andrés: un panel con
 * acordeones anidados y listas de enlaces en las hojas. El CONTENIDO sale del
 * catálogo de Payload, nunca del código: una marca o un tipo nuevo aparece
 * solo (las marcas de repuestos llegarán con el CSV del cliente).
 *
 * Decisiones aprobadas por dirección (pendientes de validar con Andrés):
 * - El título de la cabecera abre el panel; dentro, el primer enlace es
 *   «Ver todo» a la página de la sección. En cada acordeón, igual.
 * - «Aditamentos» sale una vez, en el nivel 1 (en el sitio es una «marca» de
 *   maquinaria nueva): no se repite dentro de «Por marca».
 * - El segundo «Maquinaria pesada nueva» del diseño es «Por tipo de máquina».
 * - «Usada» va sin nivel de marcas: la usada solo se organiza por tipo.
 * - «Repuestos» solo lleva «Repuestos por marca»: «por categoría» queda fuera
 *   hasta que existan páginas de categoría técnica.
 */

export type EnlaceMenu = { etiqueta: string; href: string };

/** Un acordeón: su título, sus enlaces (el primero, «Ver todo») y sus acordeones hijos. */
export type GrupoMenu = { titulo: string; enlaces: EnlaceMenu[]; grupos: GrupoMenu[] };

export type PanelMenu = { verTodo: EnlaceMenu; grupos: GrupoMenu[] };

/** Lo mínimo de cada registro del catálogo que el menú necesita. */
export type ItemCatalogo = { id: number; nombre: string; slug: string };
export type TipoCatalogo = ItemCatalogo & { marca: number | { id: number } | null | undefined };

export type DatosMegamenu = {
  marcasMaquinaria: ItemCatalogo[];
  tiposMaquinaria: TipoCatalogo[];
  categoriasNueva: ItemCatalogo[];
  categoriasUsada: ItemCatalogo[];
  marcasRepuestos: ItemCatalogo[];
  tiposRepuestos: TipoCatalogo[];
};

/** La «marca» de maquinaria nueva que en el sitio actual agrupa los aditamentos. */
export const SLUG_ADITAMENTOS = "aditamentos";

const conBarra = (href: string) => (href.endsWith("/") ? href : `${href}/`);

/** Clave con la que se busca el panel de un enlace de la cabecera. */
export function claveDeEnlace(href: string): string {
  return conBarra(href.trim().split(/[?#]/)[0] ?? "");
}

const idDeMarca = (t: TipoCatalogo) => (typeof t.marca === "object" ? t.marca?.id : t.marca);

const porNombre = <T extends { nombre: string }>(a: T, b: T) =>
  a.nombre.localeCompare(b.nombre, "es");

function tiposDe(marca: ItemCatalogo, tipos: TipoCatalogo[]) {
  return tipos.filter((t) => idDeMarca(t) === marca.id).sort(porNombre);
}

/** Acordeón de una marca: «Ver todo» y sus tipos. */
function grupoDeMarca(
  marca: ItemCatalogo,
  tipos: TipoCatalogo[],
  hrefMarca: (m: string) => string,
  hrefTipo: (m: string, t: string) => string,
  titulo = marca.nombre,
): GrupoMenu {
  return {
    titulo,
    enlaces: [
      { etiqueta: `Ver todo ${marca.nombre}`, href: conBarra(hrefMarca(marca.slug)) },
      ...tiposDe(marca, tipos).map((t) => ({
        etiqueta: t.nombre,
        href: conBarra(hrefTipo(marca.slug, t.slug)),
      })),
    ],
    grupos: [],
  };
}

export function panelMaquinaria(d: DatosMegamenu): PanelMenu {
  const marcas = [...d.marcasMaquinaria].sort(porNombre);
  const aditamentos = marcas.find((m) => m.slug === SLUG_ADITAMENTOS);
  const deMarca = (m: ItemCatalogo, titulo?: string) =>
    grupoDeMarca(m, d.tiposMaquinaria, rutas.marcaMaquinaria, rutas.tipoMaquinaria, titulo);

  const porMarca: GrupoMenu = {
    titulo: "Por marca",
    enlaces: [{ etiqueta: "Ver todas las marcas", href: conBarra(rutas.marcasMaquinaria()) }],
    grupos: marcas.filter((m) => m.slug !== SLUG_ADITAMENTOS).map((m) => deMarca(m)),
  };
  const porTipo: GrupoMenu = {
    titulo: "Por tipo de máquina",
    enlaces: [...d.categoriasNueva].sort(porNombre).map((c) => ({
      etiqueta: c.nombre,
      href: conBarra(rutas.categoriaNueva(c.slug)),
    })),
    grupos: [],
  };
  const nueva: GrupoMenu = {
    titulo: "Maquinaria pesada nueva",
    enlaces: [{ etiqueta: "Ver toda la maquinaria nueva", href: conBarra(rutas.nueva()) }],
    // Sin marcas no hay «Por marca»; sin categorías, no hay «Por tipo».
    grupos: [
      ...(porMarca.grupos.length > 0 ? [porMarca] : []),
      ...(porTipo.enlaces.length > 0 ? [porTipo] : []),
    ],
  };
  const usada: GrupoMenu = {
    titulo: "Maquinaria pesada usada",
    enlaces: [
      { etiqueta: "Ver toda la maquinaria usada", href: conBarra(rutas.usada()) },
      ...[...d.categoriasUsada].sort(porNombre).map((c) => ({
        etiqueta: c.nombre,
        href: conBarra(rutas.categoriaUsada(c.slug)),
      })),
    ],
    grupos: [],
  };

  return {
    verTodo: { etiqueta: "Ver toda la maquinaria pesada", href: conBarra(rutas.maquinaria()) },
    grupos: [
      nueva,
      usada,
      ...(aditamentos ? [deMarca(aditamentos, "Aditamentos para maquinaria pesada")] : []),
    ],
  };
}

export function panelRepuestos(d: DatosMegamenu): PanelMenu {
  const marcas = [...d.marcasRepuestos].sort(porNombre);
  return {
    verTodo: { etiqueta: "Ver todos los repuestos", href: conBarra(rutas.repuestos()) },
    grupos: [
      {
        titulo: "Repuestos por marca",
        enlaces: [{ etiqueta: "Ver todas las marcas", href: conBarra(rutas.marcas()) }],
        grupos: marcas.map((m) => grupoDeMarca(m, d.tiposRepuestos, rutas.marca, rutas.tipo)),
      },
    ],
  };
}

/**
 * Paneles por clave de enlace de la cabecera: el enlace del global `cabecera`
 * que apunte a la portada de maquinaria o de repuestos abre su panel. Los
 * demás («Lubricantes», «Servicio Técnico») siguen siendo enlaces.
 */
export function construirMegamenu(d: DatosMegamenu): Record<string, PanelMenu> {
  return {
    [claveDeEnlace(rutas.maquinaria())]: panelMaquinaria(d),
    [claveDeEnlace(rutas.repuestos())]: panelRepuestos(d),
  };
}
