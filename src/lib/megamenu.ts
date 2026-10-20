import { claveDeMarca, logoPropio } from "./marca/logoMarca";
import { tiposConEquipos } from "./nueva/tiposConEquipos";
import { segmentoDeTipo } from "./repuestos/anidado";
import { rutas } from "./routes";
import { ETIQUETA_OTROS, separarCategorias } from "./usados/otros";
import { SIN_UNIDADES } from "./usados/vacia";

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

export type EnlaceMenu = {
  etiqueta: string;
  href: string;
  /** Marca discreta tras la etiqueta (las categorías de usados sin unidades, 2026-10-18). */
  nota?: string;
};

/**
 * El logo de una marca, ya a la medida con la que se pinta (alto fijo).
 * `oscuro`: la casilla «Pintar el logo en oscuro en el menú» de la marca
 * (2026-10-17): solo entonces se pinta en una tinta oscura; si no, con sus
 * colores, porque el submenú es blanco sólido desde el #205.
 */
export type LogoMenu = { url: string; width: number; height: number; oscuro?: true };

/**
 * Un acordeón: su título, sus enlaces (el primero, «Ver todo») y sus acordeones
 * hijos. Los de MARCA llevan además su logo, si lo tiene (petición del cliente
 * del 2026-10-06, decisiones-home-ux9.md §26).
 */
export type GrupoMenu = {
  titulo: string;
  enlaces: EnlaceMenu[];
  grupos: GrupoMenu[];
  logo?: LogoMenu;
};

export type PanelMenu = { verTodo: EnlaceMenu; grupos: GrupoMenu[] };

/** El logo tal como llega de Payload (`depth: 1`, solo url y medidas). */
type LogoCatalogo = { url?: string | null; width?: number | null; height?: number | null };

/** Lo mínimo de cada registro del catálogo que el menú necesita. */
export type ItemCatalogo = {
  id: number;
  nombre: string;
  slug: string;
  logo?: number | LogoCatalogo | null;
  logoOscuroEnMenu?: boolean | null;
};

/** Alto con el que se pinta el logo de una marca en el menú (px). */
export const ALTO_LOGO_MENU = 24;

/**
 * El logo de una marca a la medida del menú: alto fijo y el ancho que le toca
 * por su proporción real. Sin logo, o sin url o medidas, nada: la marca va
 * solo con su nombre, sin hueco.
 */
export function logoDeMenu(
  logo: ItemCatalogo["logo"],
  oscuro?: ItemCatalogo["logoOscuroEnMenu"],
): LogoMenu | undefined {
  if (!logo || typeof logo !== "object") return undefined;
  const { url, width, height } = logo;
  if (!url || !width || !height) return undefined;
  return {
    url,
    width: Math.max(1, Math.round((ALTO_LOGO_MENU * width) / height)),
    height: ALTO_LOGO_MENU,
    ...(oscuro ? { oscuro: true as const } : {}),
  };
}
export type TipoCatalogo = ItemCatalogo & {
  marca: number | { id: number } | null | undefined;
  /** Solo los tipos de repuestos anidados (src/lib/repuestos/anidado.ts). */
  slugPadre?: string | null;
  /** Solo los tipos «paraguas» de maquinaria nueva («Tipos que agrupa»). */
  subtipos?: ReadonlyArray<number | { id: number } | null | undefined> | null;
};

export type DatosMegamenu = {
  marcasMaquinaria: ItemCatalogo[];
  tiposMaquinaria: TipoCatalogo[];
  categoriasNueva: ItemCatalogo[];
  /** Con su casilla «Agrupar en «Otros»» y su orden (2026-10-19). */
  categoriasUsada: (ItemCatalogo & { enOtros?: boolean | null; orden?: number | null })[];
  marcasRepuestos: ItemCatalogo[];
  tiposRepuestos: TipoCatalogo[];
  /** Los equipos nuevos (solo su tipo): el menú no enlaza a un tipo de maquinaria sin equipos. */
  equiposNuevos: ReadonlyArray<{ tipo: number | { id: number } | null | undefined }>;
  /**
   * Las unidades usadas DISPONIBLES (solo su categoría): las categorías de
   * usados se enlazan todas, y las que no tienen ninguna llevan «Sin unidades
   * por ahora» (petición del cliente, 2026-10-18). Sin el dato, ninguna nota.
   */
  equiposUsados?: ReadonlyArray<{ categoria: number | { id: number } | null | undefined }>;
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
  conLogo = true,
): GrupoMenu {
  const logo = conLogo ? logoDeMenu(marca.logo, marca.logoOscuroEnMenu) : undefined;
  return {
    titulo,
    ...(logo ? { logo } : {}),
    enlaces: [
      { etiqueta: `Ver todo ${marca.nombre}`, href: conBarra(hrefMarca(marca.slug)) },
      ...tiposDe(marca, tipos).map((t) => ({
        etiqueta: t.nombre,
        href: conBarra(hrefTipo(marca.slug, segmentoDeTipo(t))),
      })),
    ],
    grupos: [],
  };
}

export function panelMaquinaria(d: DatosMegamenu): PanelMenu {
  // Un tipo de maquinaria nueva SIN equipos no se enlaza (dirección, 2026-10-18; la misma regla
  // que las páginas de marca, #232): vuelve solo con el primer equipo (`tiposConEquipos`).
  const conEquipos = tiposConEquipos(d.equiposNuevos, d.tiposMaquinaria);
  const tiposConEquiposNuevos = d.tiposMaquinaria.filter((t) => conEquipos.has(t.id));
  // El logo de una marca de nueva que también es de repuestos (Hitachi, CASE, Yanmar…) es el de
  // repuestos, con su casilla de tinta oscura: un solo logo por marca (`src/lib/marca/logoMarca.ts`).
  const deRepuestos = new Map(d.marcasRepuestos.map((r) => [claveDeMarca(r.nombre), r]));
  const conLogoUnico = (m: ItemCatalogo): ItemCatalogo => {
    const r = deRepuestos.get(claveDeMarca(m.nombre));
    return r && logoPropio(r) ? { ...m, logo: r.logo, logoOscuroEnMenu: r.logoOscuroEnMenu } : m;
  };
  const marcas = d.marcasMaquinaria.map(conLogoUnico).sort(porNombre);
  const aditamentos = marcas.find((m) => m.slug === SLUG_ADITAMENTOS);
  const deMarca = (m: ItemCatalogo, titulo?: string) =>
    grupoDeMarca(
      m,
      tiposConEquiposNuevos,
      rutas.marcaMaquinaria,
      rutas.tipoMaquinaria,
      titulo,
      // «Aditamentos» no es una marca de verdad: va sin logo.
      m.slug !== SLUG_ADITAMENTOS,
    );

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
  const conUnidades = d.equiposUsados
    ? new Set(
        d.equiposUsados.map((u) =>
          typeof u.categoria === "object" ? u.categoria?.id : u.categoria,
        ),
      )
    : null;
  // Como en WordPress (cliente, 2026-10-19): las de primer nivel (Excavadoras y
  // Aditamentos) y «Otros», que lleva a la página de las agrupadas.
  const { primerNivel, agrupadas } = separarCategorias(d.categoriasUsada);
  const sinUnidades = (ids: number[]) =>
    conUnidades && !ids.some((id) => conUnidades.has(id)) ? { nota: SIN_UNIDADES } : {};
  const usada: GrupoMenu = {
    titulo: "Maquinaria pesada usada",
    enlaces: [
      { etiqueta: "Ver toda la maquinaria usada", href: conBarra(rutas.usada()) },
      ...primerNivel.map((c) => ({
        etiqueta: c.nombre,
        href: conBarra(rutas.categoriaUsada(c.slug)),
        ...sinUnidades([c.id]),
      })),
      ...(agrupadas.length > 0
        ? [
            {
              etiqueta: ETIQUETA_OTROS,
              href: conBarra(rutas.usadaOtros()),
              ...sinUnidades(agrupadas.map((c) => c.id)),
            },
          ]
        : []),
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
