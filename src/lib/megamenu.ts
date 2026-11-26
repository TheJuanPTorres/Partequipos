import type { CategoriasTecnica } from "@/payload-types";

import { type ApartadoMenu, type Desplegable } from "./cabecera/apartados";
import {
  APARTADO_ENLACE,
  APARTADO_GRUPO,
  apartadosQueSalen,
  arbolDe608,
  esDesplegable,
  type ApartadoArbol,
  type FilaBarra,
  type Fuente,
} from "./cabecera/arbol";
import { claveDeMarca, logoPropio } from "./marca/logoMarca";
import {
  enlaceExternoLubricante,
  tienePaginaPropiaLubricante,
  webDeLubricante,
} from "./lubricantes/destino";
import { paisDe, type CodigoPais } from "./lubricantes/pais";
import { enlaceExternoDe } from "./nueva/enlaceExterno";
import { colorConBlanco } from "./marca/franjaMarca";
import { unaEntradaPorTipo } from "./nueva/ordenTipos";
import { tiposConEquipos } from "./nueva/tiposConEquipos";
import { segmentoDeTipo } from "./repuestos/anidado";
import { categoriasDeMarca } from "./repuestos/marca";
import { accesosDe, esCategoriaPrincipal } from "./repuestos/subcategorias";
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
 * EL ORDEN, EL NOMBRE Y «MOSTRAR» de los apartados de nivel 1 de cada desplegable se editan en
 * el panel desde la tanda 24 (global `cabecera`, `src/lib/cabecera/apartados.ts`): lo que sigue
 * describe el menú de siempre, que es lo sembrado.
 *
 * Decisiones aprobadas por dirección (pendientes de validar con Andrés):
 * - El título de la cabecera abre el panel; dentro, el primer enlace es
 *   «Ver todo» a la página de la sección. En cada acordeón, igual.
 * - «Aditamentos» sale una vez, en el nivel 1 (en el sitio es una «marca» de
 *   maquinaria nueva): no se repite dentro de «Por marca».
 * - El segundo «Maquinaria pesada nueva» del diseño es «Por tipo de máquina».
 * - «Usada» va sin nivel de marcas: la usada solo se organiza por tipo.
 * - «Repuestos» lleva «Repuestos por marca», «Repuestos por categoría técnica»
 *   (desde el 2026-10-20, con las páginas de categoría ya publicadas) y, al final,
 *   el enlace editable a la política de garantías (global `cabecera`).
 */

export type EnlaceMenu = {
  etiqueta: string;
  href: string;
  /** Marca discreta tras la etiqueta (las categorías de usados sin unidades, 2026-10-18). */
  nota?: string;
  /** A OTRO sitio: pestaña nueva, icono y aviso («Ver todo» de Eni → su web, 2026-11-08). */
  externo?: true;
};

/**
 * Una TARJETA con foto del menú (las categorías técnicas, 2026-10-20): su
 * nombre, su página y la «Imagen de la tarjeta» de la categoría, si la tiene.
 */
export type TarjetaMenu = {
  etiqueta: string;
  href: string;
  imagen?: ImagenMenu;
  /**
   * Las páginas que cuelgan de la categoría (Filtros Donaldson bajo Filtración, 2026-10-26): un
   * botón con el icono y el nombre de la marca, DENTRO de la baldosa, bajo su nombre.
   */
  accesos?: AccesoMenu[];
};

/**
 * El botón de una página que cuelga de una categoría: el icono de la marca y el color de la marca
 * oscurecido hasta que el blanco se lea con AA (`colorConBlanco`): borde y texto sobre blanco y,
 * al pasar el ratón o con foco, relleno con el texto en blanco.
 */
export type AccesoMenu = {
  etiqueta: string;
  href: string;
  icono?: LogoMenu;
  color: string;
};

/** Una foto del menú: url y medidas reales (el tamaño lo pide `next/image`). */
export type ImagenMenu = { url: string; width: number; height: number };

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
  /**
   * Marca SIN página propia (2026-11-03, LiuGong): la entrada no despliega nada, es un enlace a
   * otro sitio (su distribuidor), en pestaña nueva y con el icono de enlace externo.
   */
  externo?: string;
  /**
   * Como `externo`, pero a una página de ESTE sitio, en la misma pestaña y sin icono: una marca
   * de lubricante de «Otra web» todavía sin enlace lleva a la página de la categoría con el
   * selector de marcas, donde su panel lleva a la portada (Dispel, 2026-11-05).
   */
  interno?: string;
  /**
   * El país de origen de la marca (las de lubricantes, 2026-11-04): su bandera junto al nombre,
   * decorativa, y el nombre del país solo para lectores de pantalla.
   */
  pais?: { codigo: CodigoPais; nombre: string };
  /** Tarjetas con foto bajo los enlaces (las categorías técnicas de Repuestos). */
  tarjetas?: TarjetaMenu[];
};

/**
 * Una pieza de nivel 1 de un panel, en el orden del panel de administración (tanda 24, tarea 1):
 * - `verTodo`: el enlace a la página de la sección («Ver todos los repuestos»);
 * - `grupo`: un acordeón (una lista automática del catálogo);
 * - `enlace`: un enlace suelto con el recuadro de los acordeones (la política de garantías,
 *   Aditamentos o cualquier enlace fijo del panel).
 */
export type ElementoMenu =
  | { tipo: "verTodo"; enlace: EnlaceMenu }
  | { tipo: "grupo"; grupo: GrupoMenu }
  | { tipo: "enlace"; enlace: EnlaceMenu };

/** Un desplegable: sus piezas, en el orden en que se pintan (escritorio y móvil). */
export type PanelMenu = { elementos: ElementoMenu[] };

/**
 * Las piezas de un panel por clase, para leerlo en las pruebas: el primer «Ver todo», los
 * acordeones y los enlaces sueltos (`undefined` si no hay ninguno).
 */
export function partesDe(panel: PanelMenu): {
  verTodo: EnlaceMenu | undefined;
  grupos: GrupoMenu[];
  finales: EnlaceMenu[] | undefined;
} {
  const finales = panel.elementos.flatMap((e) => (e.tipo === "enlace" ? [e.enlace] : []));
  return {
    verTodo: panel.elementos.find((e) => e.tipo === "verTodo")?.enlace,
    grupos: panel.elementos.flatMap((e) => (e.tipo === "grupo" ? [e.grupo] : [])),
    finales: finales.length > 0 ? finales : undefined,
  };
}

/** ¿Lleva el panel tarjetas? Entonces el de escritorio es más ancho (5 por fila). */
export function panelConTarjetas(panel: PanelMenu): boolean {
  const tiene = (g: GrupoMenu): boolean => (g.tarjetas?.length ?? 0) > 0 || g.grupos.some(tiene);
  return panel.elementos.some((e) => e.tipo === "grupo" && tiene(e.grupo));
}

/** Lo que el menú necesita de una categoría técnica (la foto, `depth: 1`: url y medidas). */
export type CategoriaTecnicaMenu = Pick<
  CategoriasTecnica,
  "id" | "nombre" | "slug" | "colorMarca"
> & {
  imagen?: number | LogoCatalogo | null;
  /** La categoría de la que cuelga (solo su dirección). */
  padre?: number | { id: number; slug?: string | null } | null;
  iconoMarca?: number | LogoCatalogo | null;
  /** Solo lo que decide adónde lleva una marca de lubricante de «Otra web» sin enlace. */
  selectorMarcas?: {
    activo?: boolean | null;
    marcas?: ReadonlyArray<number | { id: number } | null> | null;
  } | null;
};

/** El logo tal como llega de Payload (`depth: 1`, solo url y medidas). */
type LogoCatalogo = { url?: string | null; width?: number | null; height?: number | null };

/** Lo mínimo de cada registro del catálogo que el menú necesita. */
export type ItemCatalogo = {
  id: number;
  nombre: string;
  slug: string;
  logo?: number | LogoCatalogo | null;
  logoOscuroEnMenu?: boolean | null;
  /**
   * «Enlace externo»: las marcas de maquinaria nueva (`src/lib/nueva/enlaceExterno.ts`) y las de
   * lubricantes de «Otra web» (`src/lib/lubricantes/destino.ts`).
   */
  enlaceExterno?: string | null;
  /** Solo las marcas de lubricantes: «Destino» y «País de origen» (2026-11-04). */
  destino?: string | null;
  paisOrigen?: string | null;
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
  /** Solo maquinaria nueva: su «Orden» en la marca (vacío, al final). */
  orden?: number | null;
  /** Solo los tipos «paraguas» de maquinaria nueva («Tipos que agrupa»). */
  subtipos?: ReadonlyArray<number | { id: number } | null | undefined> | null;
  /** Solo maquinaria nueva: «Tarjeta en el índice de tipos» (va en «Por tipo de máquina»). */
  pestanaIndiceNueva?: boolean | null;
};

export type DatosMegamenu = {
  marcasMaquinaria: ItemCatalogo[];
  tiposMaquinaria: TipoCatalogo[];
  /** Con los tipos que incluye: solo salen en el menú si alguno tiene equipos (2026-10-22). */
  categoriasNueva: (ItemCatalogo & {
    tiposIncluidos?: ReadonlyArray<number | { id: number } | null | undefined> | null;
  })[];
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
  /** Las categorías técnicas de repuestos («Repuestos por categoría técnica», 2026-10-20). */
  categoriasTecnicas?: ReadonlyArray<CategoriaTecnicaMenu>;
  /**
   * Los apartados de cada desplegable, del global `cabecera` (orden, nombre y «Mostrar»). Sin el
   * dato o con la lista vacía, el menú de siempre (`APARTADOS_POR_DEFECTO`).
   */
  apartados?: Partial<Record<Desplegable, ReadonlyArray<ApartadoMenu> | null>> | null;
  /**
   * EL ÁRBOL (tanda 25, tarea 2): las filas de «Enlaces del menú» del global `cabecera`, cada
   * desplegable con sus apartados (`src/lib/cabecera/arbol.ts`). Con el dato, manda el árbol y
   * `apartados` no se mira; sin él, los tres desplegables de siempre.
   */
  barra?: ReadonlyArray<FilaBarra> | null;
  /** Las marcas de lubricante y sus categorías (desplegable «Lubricantes», 2026-10-20). */
  marcasLubricante?: ReadonlyArray<ItemCatalogo>;
  categoriasLubricante?: ReadonlyArray<CategoriaLubricanteMenu>;
};

/** Lo que el menú necesita de una categoría de lubricante. */
export type CategoriaLubricanteMenu = {
  id: number;
  nombre: string;
  slug: string;
  marca: number | { id: number } | null | undefined;
  /** «Enlace en el menú»: vacío, su página (desde el 2026-10-22; antes, su ancla). */
  enlaceMenu?: string | null;
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

/**
 * Los tipos de una marca en el orden de su página: el del panel (arrastrando en la ficha de la
 * marca), que ya trae la consulta (`getMegamenu.ts`).
 */
function tiposDe(marca: ItemCatalogo, tipos: TipoCatalogo[]) {
  return tipos.filter((t) => idDeMarca(t) === marca.id);
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

/** Las piezas de maquinaria que una fuente puede pedir (nueva, usada y aditamentos). */
function partesMaquinaria(d: DatosMegamenu) {
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
  // En el orden del panel (arrastrando), que ya trae la consulta.
  const marcas = d.marcasMaquinaria.map(conLogoUnico);
  const aditamentos = marcas.find((m) => m.slug === SLUG_ADITAMENTOS);
  const deMarca = (m: ItemCatalogo): GrupoMenu => {
    // Sin página propia (LiuGong → su distribuidor, 2026-11-03): un enlace fuera, sin tipos.
    const externo = enlaceExternoDe(m);
    if (externo) {
      const logo = logoDeMenu(m.logo, m.logoOscuroEnMenu);
      return { titulo: m.nombre, ...(logo ? { logo } : {}), externo, enlaces: [], grupos: [] };
    }
    return grupoDeMarca(m, tiposConEquiposNuevos, rutas.marcaMaquinaria, rutas.tipoMaquinaria);
  };

  const porMarca: GrupoMenu = {
    titulo: "Por marca",
    enlaces: [{ etiqueta: "Ver todas las marcas", href: conBarra(rutas.marcasMaquinaria()) }],
    grupos: marcas.filter((m) => m.slug !== SLUG_ADITAMENTOS).map((m) => deMarca(m)),
  };
  // «Por tipo de máquina» (2026-10-22, dirección): TODOS los tipos, en el orden de la web antigua
  // (`ordenTipos.ts`), como el índice de tipos. Cada uno va a su página GENERAL, la categoría de
  // nueva, aunque solo tenga una marca (2026-10-23, tarea 9); solo un tipo SIN categoría va a la
  // página de su tipo en su marca (casilla «Tarjeta en el índice de tipos»). Sin equipos, no
  // salen. «Aditamentos» sigue con su entrada propia.
  const idRel = (v: number | { id: number } | null | undefined) =>
    typeof v === "number" ? v : (v?.id ?? null);
  const slugDeMarca = new Map(d.marcasMaquinaria.map((m) => [m.id, m.slug]));
  const marcaDeTipo = new Map(tiposConEquiposNuevos.map((t) => [t.id, idRel(t.marca)]));
  // Una categoría sale si alguno de sus tipos tiene equipos; cuenta de cuántas marcas son.
  const deCategorias = d.categoriasNueva.flatMap((c) => {
    const marcas = new Set(
      (c.tiposIncluidos ?? [])
        .map((t) => idRel(t))
        .filter((t): t is number => t !== null && marcaDeTipo.has(t))
        .map((t) => marcaDeTipo.get(t)),
    );
    return marcas.size > 0
      ? [
          {
            nombre: c.nombre,
            marcas: marcas.size,
            dato: { etiqueta: c.nombre, href: conBarra(rutas.categoriaNueva(c.slug)) },
          },
        ]
      : [];
  });
  // Los tipos sueltos (sin categoría; hoy ninguno), en el orden en que llegan: el del panel.
  const deTipos = tiposConEquiposNuevos
    .filter((t) => t.pestanaIndiceNueva)
    .flatMap((t) => {
      const marca = slugDeMarca.get(idRel(t.marca) ?? -1);
      return marca
        ? [
            {
              nombre: t.nombre,
              dato: { etiqueta: t.nombre, href: conBarra(rutas.tipoMaquinaria(marca, t.slug)) },
            },
          ]
        : [];
    });
  const tiposDelMenu = unaEntradaPorTipo(deCategorias, deTipos);
  const verTodosLosTipos = {
    etiqueta: "Ver todos los tipos de máquina",
    href: conBarra(rutas.nuevaTipos()),
  };
  const porTipo: GrupoMenu = {
    titulo: "Por tipo de máquina",
    // «Ver todos los tipos de máquina» al índice de tipos (dirección, 2026-10-23), como «Ver todas
    // las categorías» de repuestos; después, una entrada por tipo, en el orden de la web antigua
    // (`ordenTipos.ts`). Sin tipos con equipos, el grupo no sale (ni este enlace).
    enlaces: tiposDelMenu.length > 0 ? [verTodosLosTipos, ...tiposDelMenu] : [],
    grupos: [],
  };
  const nueva: GrupoMenu = {
    titulo: "Maquinaria pesada nueva",
    // El índice de tipos es la página principal de nueva (dirección, 2026-10-23): la de «Por
    // marca» / «Por tipo» da 301 allí.
    enlaces: [{ etiqueta: "Ver toda la maquinaria nueva", href: conBarra(rutas.nuevaTipos()) }],
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

  return { nueva, porMarca, porTipo, usada, aditamentos };
}

/** La foto de una tarjeta del menú: sin url o sin medidas, ninguna (la tarjeta va sin foto). */
export function imagenDeMenu(imagen: CategoriaTecnicaMenu["imagen"]): ImagenMenu | undefined {
  if (!imagen || typeof imagen !== "object") return undefined;
  const { url, width, height } = imagen;
  return url && width && height ? { url, width, height } : undefined;
}

/**
 * «Repuestos por categoría técnica» (dirección, 2026-10-20): «Ver todas las
 * categorías» al índice y una TARJETA CON FOTO por categoría (su «Imagen de la
 * tarjeta», la de las tarjetas de categorías del sitio), en el orden de las
 * páginas de repuestos (`categoriasDeMarca`: «Orden en las páginas de marca» y
 * después por nombre). Sin página (sin dirección), no sale: el menú no lleva
 * enlaces rotos. Sin ninguna, el apartado no se pinta.
 */
export function grupoCategoriasTecnicas(
  categorias: ReadonlyArray<CategoriaTecnicaMenu>,
): GrupoMenu | null {
  const porId = new Map(categorias.map((c) => [c.id, c]));
  // Las que cuelgan de otra (Filtros Donaldson) no son baldosas: van como botón bajo la suya.
  const principales = categorias.filter(esCategoriaPrincipal);
  const tarjetas = categoriasDeMarca([...principales] as CategoriasTecnica[]).flatMap((c) => {
    if (!c.href) return [];
    const imagen = imagenDeMenu(porId.get(c.id)?.imagen);
    const accesos = accesosDe(c.id, categorias).map((a) => {
      const icono = imagenDeMenu(porId.get(a.id)?.iconoMarca);
      return {
        etiqueta: a.nombre,
        href: conBarra(a.href),
        color: colorConBlanco(porId.get(a.id)?.colorMarca),
        ...(icono ? { icono } : {}),
      };
    });
    return [
      {
        etiqueta: c.nombre,
        href: conBarra(c.href),
        ...(imagen ? { imagen } : {}),
        ...(accesos.length > 0 ? { accesos } : {}),
      },
    ];
  });
  if (tarjetas.length === 0) return null;
  return {
    titulo: "Repuestos por categoría técnica",
    enlaces: [
      { etiqueta: "Ver todas las categorías", href: conBarra(rutas.categoriasRepuestos()) },
    ],
    grupos: [],
    tarjetas,
  };
}

/**
 * «LUBRICANTES» (2026-10-20, dirección): «Ver todos los lubricantes» a la página
 * general y, por marca, un acordeón «Lubricantes <marca>» con «Ver todo» a su
 * página y sus categorías por nombre (el orden de las secciones de esa página).
 * Cada categoría va a su «Enlace en el menú» o, vacío, a su ancla en la página
 * de la marca (sus páginas propias llegarán con la plantilla de Andrés). Sin
 * ninguna marca, no hay panel: «Lubricantes» sigue siendo un enlace.
 */
function gruposLubricantes(d: DatosMegamenu): GrupoMenu[] {
  // Una marca de «Otra web» va a su web; sin enlace válido, a la página del selector de marcas
  // que la muestra (Dispel, 2026-11-05). Sin ninguna de las dos, no sale: sin
  // enlaces rotos.
  const selector = paginaDelSelector(d.categoriasTecnicas ?? []);
  const marcas = [...(d.marcasLubricante ?? [])]
    .filter((m) => m.nombre && m.slug)
    .filter((m) => tienePaginaPropiaLubricante(m) || enlaceExternoLubricante(m) || selector(m.id))
    // Primero las de página propia (Eni) y después las de otra web (Dispel); cada grupo, en el
    // orden del panel (arrastrando), que ya trae la consulta (`sort` es estable).
    .sort(
      (a, b) => Number(tienePaginaPropiaLubricante(b)) - Number(tienePaginaPropiaLubricante(a)),
    );
  // Las líneas de cada marca, en el orden del panel (arrastrando en la ficha de la marca), que ya
  // trae la consulta: el mismo de la página de la marca (2026-11-19, dirección).
  const categorias = d.categoriasLubricante ?? [];
  return marcas.map((m): GrupoMenu => {
    const titulo = `Lubricantes ${m.nombre}`;
    const pais = paisDe(m.paisOrigen);
    const conPais = pais ? { pais } : {};
    // «Otra web» (Dispel): un enlace fuera, en otra pestaña, sin líneas.
    const externo = enlaceExternoLubricante(m);
    if (externo) return { titulo, ...conPais, externo, enlaces: [], grupos: [] };
    // «Otra web» sin enlace: a la página del selector, en la misma pestaña.
    if (!tienePaginaPropiaLubricante(m)) {
      const interno = selector(m.id)!;
      return { titulo, ...conPais, interno, enlaces: [], grupos: [] };
    }
    // Con «Enlace externo», «Ver todo» lleva a su web (Eni, 2026-11-08); sus líneas, aquí.
    const web = webDeLubricante(m);
    return {
      titulo,
      ...conPais,
      enlaces: [
        web
          ? { etiqueta: `Ver todo Lubricantes ${m.nombre}`, href: web, externo: true as const }
          : {
              etiqueta: `Ver todo Lubricantes ${m.nombre}`,
              href: conBarra(rutas.marcaLubricante(m.slug)),
            },
        ...categorias
          .filter((c) => c.nombre && c.slug && idDeMarcaLubricante(c) === m.id)
          .map((c) => ({
            etiqueta: c.nombre,
            href: c.enlaceMenu?.trim() || conBarra(rutas.categoriaLubricante(m.slug, c.slug)),
          })),
      ],
      grupos: [],
    };
  });
}

/**
 * La página de la categoría técnica que muestra una marca de lubricante en su selector (la
 * categoría «Lubricantes»): la primera, por nombre, con el selector encendido y la marca entre las
 * elegidas (o sin ninguna elegida: entonces salen todas). `null` si ninguna la muestra.
 */
/**
 * «Ver todos los lubricantes» va a la página de la categoría técnica «Lubricantes» (la del
 * selector de marcas, 2026-11-09); sin ella, a la página general `/lubricantes/`.
 */
function paginaDeLubricantes(categorias: ReadonlyArray<CategoriaTecnicaMenu>): string | null {
  const c = [...categorias]
    .filter((c) => c.slug && c.selectorMarcas?.activo && esCategoriaPrincipal(c))
    .sort(porNombre)[0];
  return c ? conBarra(rutas.categoriaRepuestos(c.slug)) : null;
}

function paginaDelSelector(
  categorias: ReadonlyArray<CategoriaTecnicaMenu>,
): (marca: number) => string | null {
  const conSelector = [...categorias]
    .filter((c) => c.slug && c.selectorMarcas?.activo && esCategoriaPrincipal(c))
    .sort(porNombre);
  return (marca) => {
    const c = conSelector.find((c) => {
      const ids = (c.selectorMarcas?.marcas ?? [])
        .map((r) => (typeof r === "object" ? r?.id : r))
        .filter((id): id is number => typeof id === "number");
      return ids.length === 0 || ids.includes(marca);
    });
    return c ? conBarra(rutas.categoriaRepuestos(c.slug)) : null;
  };
}

const idDeMarcaLubricante = (c: CategoriaLubricanteMenu) =>
  typeof c.marca === "object" ? c.marca?.id : c.marca;

/** Un enlace escrito en el panel: a otro sitio (https://), en pestaña nueva y con su aviso. */
function enlaceFijo(etiqueta: string, href: string): EnlaceMenu {
  return { etiqueta, href, ...(/^https?:\/\//i.test(href) ? { externo: true as const } : {}) };
}

/**
 * EL CONSTRUCTOR DE PANELES (tanda 25, tarea 2): convierte los apartados de un desplegable del
 * árbol (`src/lib/cabecera/arbol.ts`) en las piezas del panel, en su orden. Cada FUENTE de una
 * lista automática da sus piezas con el nombre del apartado; sin contenido (sin categorías, sin
 * la marca de aditamentos…), no deja nada. Lo de cada sección se calcula una vez, y solo si
 * alguna fuente lo pide.
 */
function constructorDePaneles(d: DatosMegamenu) {
  const unaVez = <T>(calcular: () => T) => {
    let hecho: { valor: T } | undefined;
    return () => (hecho ??= { valor: calcular() }).valor;
  };
  const maquinaria = unaVez(() => partesMaquinaria(d));
  const categorias = unaVez(() => grupoCategoriasTecnicas(d.categoriasTecnicas ?? []));
  const lubricantes = unaVez(() => gruposLubricantes(d));
  const grupo = (g: GrupoMenu, titulo: string): ElementoMenu => ({
    tipo: "grupo",
    grupo: { ...g, titulo },
  });
  const verTodo = (etiqueta: string, href: string): ElementoMenu => ({
    tipo: "verTodo",
    enlace: { etiqueta, href },
  });

  const deFuente = (fuente: Fuente, etiqueta: string): ElementoMenu[] => {
    switch (fuente) {
      case "pagina-maquinaria":
        return [verTodo(etiqueta, conBarra(rutas.maquinaria()))];
      case "nueva":
        return [grupo(maquinaria().nueva, etiqueta)];
      case "nueva-marcas": {
        // Sin marcas, no sale (como dentro de «Maquinaria pesada nueva»).
        const { porMarca } = maquinaria();
        return porMarca.grupos.length > 0 ? [grupo(porMarca, etiqueta)] : [];
      }
      case "nueva-tipos": {
        const { porTipo } = maquinaria();
        return porTipo.enlaces.length > 0 ? [grupo(porTipo, etiqueta)] : [];
      }
      case "usada":
        return [grupo(maquinaria().usada, etiqueta)];
      case "aditamentos": {
        // «Aditamentos» es un ENLACE directo a su página, sin submenú (dirección, 2026-10-20):
        // la fila de nivel 1 con el recuadro de los acordeones, como la política de Repuestos.
        // Sin la marca de aditamentos, no sale.
        const { aditamentos } = maquinaria();
        return aditamentos
          ? [
              {
                tipo: "enlace",
                enlace: { etiqueta, href: conBarra(rutas.marcaMaquinaria(aditamentos.slug)) },
              },
            ]
          : [];
      }
      case "pagina-repuestos":
        return [verTodo(etiqueta, conBarra(rutas.repuestos()))];
      case "repuestos-marcas":
        return [
          {
            tipo: "grupo",
            grupo: {
              titulo: etiqueta,
              enlaces: [{ etiqueta: "Ver todas las marcas", href: conBarra(rutas.marcas()) }],
              // En el orden del panel (arrastrando, 2026-11-19): la consulta ya las trae así.
              grupos: d.marcasRepuestos.map((m) =>
                grupoDeMarca(m, d.tiposRepuestos, rutas.marca, rutas.tipo),
              ),
            },
          },
        ];
      case "categorias-tecnicas": {
        // Sin ninguna categoría con página, el apartado no sale.
        const g = categorias();
        return g ? [grupo(g, etiqueta)] : [];
      }
      case "pagina-lubricantes":
        // Sin ninguna marca de lubricantes que salga, tampoco su «Ver todos…»: «Lubricantes»
        // sigue siendo un enlace (2026-10-20).
        return lubricantes().length > 0
          ? [
              verTodo(
                etiqueta,
                paginaDeLubricantes(d.categoriasTecnicas ?? []) ?? conBarra(rutas.lubricantes()),
              ),
            ]
          : [];
      case "lubricantes-marcas":
        // Un acordeón por marca, cada uno con su nombre («Lubricantes Eni»): el nombre del
        // apartado solo se ve en el panel.
        return lubricantes().map((g) => ({ tipo: "grupo" as const, grupo: g }));
    }
  };

  return (apartados: ReadonlyArray<ApartadoArbol> | null | undefined): PanelMenu => ({
    elementos: apartadosQueSalen(apartados).flatMap((a): ElementoMenu[] => {
      // Un enlace fijo: tal cual se escribió en el panel, con el recuadro de los acordeones.
      if (a.tipo === APARTADO_ENLACE) {
        return [{ tipo: "enlace", enlace: enlaceFijo(a.nombre, a.enlace) }];
      }
      // Un grupo: un acordeón con su título y sus enlaces fijos.
      if (a.tipo === APARTADO_GRUPO) {
        return [
          {
            tipo: "grupo",
            grupo: {
              titulo: a.nombre,
              enlaces: a.enlaces.map((e) => enlaceFijo(e.etiqueta, e.enlace)),
              grupos: [],
            },
          },
        ];
      }
      return deFuente(a.fuente, a.nombre);
    }),
  });
}

/** El desplegable «Maquinaria pesada» de siempre, con las filas de la tanda 24 (`apartados`). */
export function panelMaquinaria(d: DatosMegamenu): PanelMenu {
  return constructorDePaneles(d)(arbolDe608(d.apartados?.maquinaria, "maquinaria"));
}

/** El desplegable «Repuestos» de siempre (la política de garantías es un enlace fijo más). */
export function panelRepuestos(d: DatosMegamenu): PanelMenu {
  return constructorDePaneles(d)(arbolDe608(d.apartados?.repuestos, "repuestos"));
}

/** El desplegable «Lubricantes» de siempre. Sin ninguna marca que salga, no hay panel. */
export function panelLubricantes(d: DatosMegamenu): PanelMenu | null {
  if (gruposLubricantes(d).length === 0) return null;
  return constructorDePaneles(d)(arbolDe608(d.apartados?.lubricantes, "lubricantes"));
}

/** Las direcciones que abren el desplegable de Lubricantes: la general y la de cada marca con página. */
function direccionesDeLubricantes(d: DatosMegamenu): string[] {
  return [
    rutas.lubricantes(),
    ...(d.marcasLubricante ?? [])
      .filter(tienePaginaPropiaLubricante)
      .map((m) => rutas.marcaLubricante(m.slug)),
  ].map(claveDeEnlace);
}

/**
 * El desplegable de siempre que corresponde a una dirección (la portada de maquinaria, la de
 * repuestos, o la de lubricantes o de una de sus marcas), o `null`.
 */
export function desplegableDeDireccion(clave: string, d: DatosMegamenu): Desplegable | null {
  if (clave === claveDeEnlace(rutas.maquinaria())) return "maquinaria";
  if (clave === claveDeEnlace(rutas.repuestos())) return "repuestos";
  return direccionesDeLubricantes(d).includes(clave) ? "lubricantes" : null;
}

/**
 * Paneles por clave de enlace de la cabecera (`claveDeEnlace` del destino de la fila).
 *
 * CON EL ÁRBOL (`d.barra`): cada fila «Desplegable» que se muestra abre el panel de SUS apartados,
 * lleve adonde lleve. Si no tiene ningún apartado y su dirección es una de las tres de siempre,
 * vuelve el menú de siempre (`APARTADOS_POR_DEFECTO`). Sin nada que salga, no hay panel: la fila
 * queda como enlace.
 *
 * SIN EL ÁRBOL (una base sin el dato): los tres desplegables de siempre, por su dirección.
 */
export function construirMegamenu(d: DatosMegamenu): Record<string, PanelMenu> {
  const paneles: Record<string, PanelMenu> = {};
  const conContenido = (p: PanelMenu | null): p is PanelMenu => !!p && p.elementos.length > 0;

  if (d.barra) {
    const construir = constructorDePaneles(d);
    for (const fila of d.barra) {
      if (!esDesplegable(fila)) continue;
      const clave = claveDeEnlace(fila.enlace ?? "");
      if (paneles[clave]) continue;
      const deSiempre = desplegableDeDireccion(clave, d);
      const apartados =
        (fila.apartados?.length ?? 0) > 0
          ? fila.apartados
          : deSiempre
            ? arbolDe608(null, deSiempre)
            : [];
      const panel = construir(apartados);
      if (conContenido(panel)) paneles[clave] = panel;
    }
    return paneles;
  }

  // Un desplegable con todos sus apartados ocultos no abre un panel vacío: su entrada de la
  // cabecera se queda como enlace.
  const maquinaria = panelMaquinaria(d);
  if (conContenido(maquinaria)) paneles[claveDeEnlace(rutas.maquinaria())] = maquinaria;
  const repuestos = panelRepuestos(d);
  if (conContenido(repuestos)) paneles[claveDeEnlace(rutas.repuestos())] = repuestos;
  // «Lubricantes» abre su panel apunte a la página general o a la de una marca
  // (desde el 2026-10-20 la cabecera enlaza a la general).
  const lubricantes = panelLubricantes(d);
  if (conContenido(lubricantes)) {
    for (const clave of direccionesDeLubricantes(d)) paneles[clave] = lubricantes;
  }
  return paneles;
}
