/**
 * PORTADA PROPIA DEL PANEL (F2 del rediseño, 2026-10-06; decisiones-panel.md
 * §23). Decisiones puras, sin acceso a datos: qué avisos salen, qué tarjetas,
 * con qué enlaces. Los datos los trae `src/lib/queries/getPortadaPanel.ts`.
 */
import { ANCHO_MINIMO } from "./fotoPequena";
import { ETIQUETAS_DEL_MENU, GRUPOS_DEL_MENU, ordenarMenu, type GrupoDelMenu } from "./menu";

const ADMIN = "/admin";

export const rutaLista = (slug: string, filtro = "") => `${ADMIN}/collections/${slug}${filtro}`;
export const rutaCrear = (slug: string) => `${ADMIN}/collections/${slug}/create`;
export const rutaGlobal = (slug: string) => `${ADMIN}/globals/${slug}`;

/** Colecciones con galería `imagenes` cuyo hueco se avisa (también en F4). */
export const CON_GALERIA = ["equipos-nuevos", "equipos-usados", "modelos-repuesto"] as const;
export type ConGaleria = (typeof CON_GALERIA)[number];

/** Filtro de lista «sin fotos»: el mismo `where` que cuenta el aviso. */
export const FILTRO_SIN_FOTOS = "?where[imagenes][exists]=false";
/** Filtro de lista «solicitudes nuevas»: el mismo `where` que cuenta el aviso. */
export const FILTRO_SOLICITUDES_NUEVAS = "?where[estado][equals]=nueva";
/** Filtro de lista «redirecciones a ninguna ruta». */
export const FILTRO_REDIRECCION_ROTA = "?where[estadoDestino][equals]=sin-ruta";
/** Filtro de «Imágenes» con las de menos de 1.200 px de ancho (el de «Ver solo las pequeñas»). */
export const FILTRO_FOTOS_PEQUENAS = `?where[width][less_than]=${ANCHO_MINIMO}`;
/**
 * «Sin descripción»: vacía o nunca rellenada; el filtro de la lista y el `where` que cuenta el
 * aviso dicen lo mismo. En la de nueva (texto enriquecido) un editor vaciado no cuenta: la base
 * guarda un párrafo vacío, no un nulo.
 */
export const FILTRO_SIN_DESCRIPCION =
  "?where[or][0][descripcion][exists]=false&where[or][1][descripcion][equals]=";
export const WHERE_SIN_DESCRIPCION = {
  or: [{ descripcion: { exists: false } }, { descripcion: { equals: "" } }],
};
/** «Sin descripción para buscadores»: la del bloque SEO de la ficha. */
export const FILTRO_SIN_SEO =
  "?where[or][0][seo.metaDescription][exists]=false&where[or][1][seo.metaDescription][equals]=";
export const WHERE_SIN_SEO = {
  or: [{ "seo.metaDescription": { exists: false } }, { "seo.metaDescription": { equals: "" } }],
};

export type AvisoPortada = {
  clave: string;
  tono: "info" | "aviso" | "error";
  texto: string;
  enlace?: { href: string; texto: string };
};

export type DatosAvisos = {
  /** Fichas sin fotos, por colección; `undefined` si el usuario no la ve. */
  sinFotos: Partial<Record<ConGaleria, number>>;
  etiquetas: Partial<Record<ConGaleria, string>>;
  altFlojos?: number;
  solicitudesNuevas?: number;
  redireccionesRotas?: number;
  /** Fichas sin descripción, por colección (fase 2, 2026-11-19). */
  sinDescripcion?: Partial<Record<ConGaleria, number>>;
  /** Fichas sin descripción propia para buscadores, por colección. */
  sinSeo?: Partial<Record<ConGaleria, number>>;
  /** Fotos de las galerías de las fichas con menos de 1.200 px de ancho. */
  fotosPequenas?: number;
  /** Textos que los visitantes buscaron sin encontrar nada (`busquedas-sin-resultado`). */
  busquedasSinResultado?: number;
  indexacionPermitida: boolean;
};

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);
const formatoMiles = new Intl.NumberFormat("es-CO");

/**
 * Solo lo que NECESITA atención, en este orden: solicitudes sin atender,
 * redirecciones rotas, fichas sin fotos, fotos pequeñas, fichas sin
 * descripción, textos alternativos flojos, fichas sin descripción para
 * buscadores, búsquedas sin resultado y, al final, el sitio cerrado a
 * buscadores (informativo). Con 0, el aviso no sale. Cada uno enlaza a la
 * lista con el MISMO criterio que cuenta.
 */
export function avisosDePortada(d: DatosAvisos): AvisoPortada[] {
  const avisos: AvisoPortada[] = [];
  if (d.solicitudesNuevas) {
    avisos.push({
      clave: "solicitudes",
      tono: "aviso",
      texto: `${d.solicitudesNuevas} ${plural(d.solicitudesNuevas, "solicitud nueva sin atender", "solicitudes nuevas sin atender")}.`,
      enlace: {
        href: rutaLista("solicitudes", FILTRO_SOLICITUDES_NUEVAS),
        texto: "Ver las nuevas",
      },
    });
  }
  if (d.redireccionesRotas) {
    avisos.push({
      clave: "redirecciones",
      tono: "error",
      texto: `${d.redireccionesRotas} ${plural(d.redireccionesRotas, "redirección lleva", "redirecciones llevan")} a una dirección que no existe.`,
      enlace: { href: rutaLista("redirects", FILTRO_REDIRECCION_ROTA), texto: "Revisarlas" },
    });
  }
  for (const slug of CON_GALERIA) {
    const n = d.sinFotos[slug];
    if (!n) continue;
    const nombre = (d.etiquetas[slug] ?? slug).toLowerCase();
    avisos.push({
      clave: `sin-fotos-${slug}`,
      tono: "aviso",
      texto: `${n} ${plural(n, "ficha", "fichas")} de ${nombre} sin fotos: en el sitio salen sin imagen.`,
      enlace: { href: rutaLista(slug, FILTRO_SIN_FOTOS), texto: "Ver cuáles" },
    });
  }
  if (d.fotosPequenas) {
    avisos.push({
      clave: "fotos-pequenas",
      tono: "aviso",
      texto: `${d.fotosPequenas} ${plural(d.fotosPequenas, "foto de las galerías de las fichas mide", "fotos de las galerías de las fichas miden")} menos de ${formatoMiles.format(ANCHO_MINIMO)} px de ancho: en pantallas grandes se ven borrosas.`,
      enlace: { href: rutaLista("media", FILTRO_FOTOS_PEQUENAS), texto: "Ver las pequeñas" },
    });
  }
  for (const slug of CON_GALERIA) {
    const n = d.sinDescripcion?.[slug];
    if (!n) continue;
    const nombre = (d.etiquetas[slug] ?? slug).toLowerCase();
    avisos.push({
      clave: `sin-descripcion-${slug}`,
      tono: "aviso",
      texto: `${n} ${plural(n, "ficha", "fichas")} de ${nombre} sin descripción.`,
      enlace: { href: rutaLista(slug, FILTRO_SIN_DESCRIPCION), texto: "Ver cuáles" },
    });
  }
  if (d.altFlojos) {
    avisos.push({
      clave: "alt",
      tono: "aviso",
      texto: `${d.altFlojos} ${plural(d.altFlojos, "imagen tiene", "imágenes tienen")} el texto alternativo flojo.`,
      enlace: { href: rutaLista("media"), texto: "Ver cuáles" },
    });
  }
  for (const slug of CON_GALERIA) {
    const n = d.sinSeo?.[slug];
    if (!n) continue;
    const nombre = (d.etiquetas[slug] ?? slug).toLowerCase();
    avisos.push({
      clave: `sin-seo-${slug}`,
      tono: "info",
      texto: `${n} ${plural(n, "ficha", "fichas")} de ${nombre} sin descripción propia para buscadores: Google ve la de por defecto.`,
      enlace: { href: rutaLista(slug, FILTRO_SIN_SEO), texto: "Ver cuáles" },
    });
  }
  if (d.busquedasSinResultado) {
    avisos.push({
      clave: "busquedas",
      tono: "info",
      texto: `${d.busquedasSinResultado} ${plural(d.busquedasSinResultado, "búsqueda", "búsquedas")} de los visitantes sin resultado: puede faltar un sinónimo o una página.`,
      enlace: { href: rutaLista("busquedas-sin-resultado"), texto: "Ver cuáles" },
    });
  }
  if (!d.indexacionPermitida) {
    avisos.push({
      clave: "buscadores",
      tono: "info",
      texto:
        "El sitio todavía está cerrado a buscadores: Google no lo muestra hasta el lanzamiento.",
    });
  }
  return avisos;
}

export type EntidadPortada = {
  slug: string;
  tipo: "collection" | "global";
  etiqueta: string;
  grupo: string;
  puedeCrear: boolean;
};

export type EntradaTarjeta = EntidadPortada & {
  href: string;
  hrefCrear: string | null;
  contador: number | null;
  detalle?: string;
};

export type Tarjeta = { nombre: string; entradas: EntradaTarjeta[] };

/**
 * Una tarjeta por grupo del menú, en el ORDEN DEL MENÚ (`ordenarMenu`, F1):
 * así los globales salen en su grupo y no detrás de todo, que la portada de
 * Payload no respetaba. Solo con lo que el usuario puede ver.
 */
export function tarjetasDePortada(
  entidades: EntidadPortada[],
  contadores: Record<string, number | undefined>,
  detalles: Record<string, string | undefined> = {},
): Tarjeta[] {
  const porGrupo = new Map<string, EntradaTarjeta[]>();
  for (const e of entidades) {
    const entrada: EntradaTarjeta = {
      ...e,
      // El mismo nombre que en el menú (en las palabras del cliente).
      etiqueta: ETIQUETAS_DEL_MENU[e.slug] ?? e.etiqueta,
      href: e.tipo === "global" ? rutaGlobal(e.slug) : rutaLista(e.slug),
      hrefCrear: e.tipo === "collection" && e.puedeCrear ? rutaCrear(e.slug) : null,
      contador: e.tipo === "collection" ? (contadores[e.slug] ?? null) : null,
      detalle: detalles[e.slug],
    };
    porGrupo.set(e.grupo, [...(porGrupo.get(e.grupo) ?? []), entrada]);
  }
  return ordenarMenu([...porGrupo].map(([nombre, entradas]) => ({ nombre, entradas })));
}

/** ¿Es uno de los grupos del menú? (para el icono). */
export const esGrupoDelMenu = (nombre: string): nombre is GrupoDelMenu =>
  (GRUPOS_DEL_MENU as readonly string[]).includes(nombre);

/** Colecciones que NO entran en «Lo último modificado». */
export const FUERA_DE_RECIENTES = new Set(["solicitudes", "users"]);

export type Reciente = {
  slug: string;
  coleccion: string;
  titulo: string;
  href: string;
  actualizado: string;
  /** Quién lo guardó por última vez, ya en texto («—» si no consta). */
  editor: string;
};

/**
 * Texto del último editor para la portada (§25), respetando el acceso a
 * Usuarios: el campo llega poblado (con su correo) solo si quien mira puede
 * leer a ese usuario; si no, llega el id. Nunca se piden datos de un usuario
 * que el rol no puede ver.
 * - Uno mismo: «ti».
 * - Otro usuario legible: su correo.
 * - Otro usuario no legible (un editor mirando lo de otro): «otra persona del equipo».
 * - Sin dato (ediciones anteriores al campo, scripts, globales): «—».
 */
export function etiquetaEditor(valor: unknown, yo: number | string): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const id =
    typeof valor === "object" && "id" in (valor as object) ? (valor as { id: unknown }).id : valor;
  if (id === yo) return "ti";
  if (typeof valor === "object") {
    const correo = (valor as { email?: unknown }).email;
    if (typeof correo === "string" && correo) return correo;
  }
  return typeof id === "number" || typeof id === "string" ? "otra persona del equipo" : "—";
}

/** Junta lo de cada colección y se queda con los `n` más recientes. */
export function ultimosModificados(listas: Reciente[][], n = 8): Reciente[] {
  return listas
    .flat()
    .filter((r) => !FUERA_DE_RECIENTES.has(r.slug) && r.actualizado)
    .sort((a, b) => b.actualizado.localeCompare(a.actualizado))
    .slice(0, n);
}

/* «Lo más habitual» y «Mensajes» (organización del panel, fase 2, PR 6, 2026-11-19; plan §3). */

export type Permiso = "create" | "read" | "update";

export type IconoHabitual =
  "usada" | "vendida" | "nueva" | "diapositiva" | "articulo" | "mensajes" | "imagenes";

export type Habitual = { clave: IconoHabitual; texto: string; href: string };

type DefHabitual = {
  clave: IconoHabitual;
  texto: string;
  slug: string;
  permiso: Permiso;
  href: (idPortada?: number | string) => string | null;
};

/** Lo que el cliente hace a diario, en el orden del plan. Sustituye a «Accesos rápidos». */
const HABITUALES: DefHabitual[] = [
  {
    clave: "usada",
    texto: "Publicar una máquina usada",
    slug: "equipos-usados",
    permiso: "create",
    href: () => rutaCrear("equipos-usados"),
  },
  {
    clave: "vendida",
    texto: "Marcar una usada como vendida",
    slug: "equipos-usados",
    permiso: "update",
    href: () => rutaLista("equipos-usados", "?where[disponible][equals]=true"),
  },
  {
    clave: "nueva",
    texto: "Añadir una máquina nueva",
    slug: "equipos-nuevos",
    permiso: "create",
    href: () => rutaCrear("equipos-nuevos"),
  },
  {
    clave: "diapositiva",
    texto: "Cambiar una diapositiva de la portada",
    slug: "paginas",
    permiso: "update",
    href: (id) => (id === undefined ? null : `${ADMIN}/collections/paginas/${id}`),
  },
  {
    clave: "articulo",
    texto: "Escribir un artículo",
    slug: "articulos",
    permiso: "create",
    href: () => rutaCrear("articulos"),
  },
  {
    clave: "mensajes",
    texto: "Responder mensajes",
    slug: "solicitudes",
    permiso: "read",
    href: () => rutaLista("solicitudes", FILTRO_SOLICITUDES_NUEVAS),
  },
  {
    clave: "imagenes",
    texto: "Subir imágenes",
    slug: "media",
    permiso: "create",
    href: () => rutaCrear("media"),
  },
];

/**
 * Solo las acciones que el rol puede hacer (`puede(slug, permiso)`) y que tienen destino: sin la
 * página de la portada, «Cambiar una diapositiva» no sale.
 */
export function accionesHabituales(
  puede: (slug: string, permiso: Permiso) => boolean,
  idPortada?: number | string,
): Habitual[] {
  return HABITUALES.flatMap(({ clave, texto, slug, permiso, href }) => {
    const destino = puede(slug, permiso) ? href(idPortada) : null;
    return destino ? [{ clave, texto, href: destino }] : [];
  });
}

export type Mensaje = {
  id: number | string;
  nombre: string;
  tipo: string;
  creado: string;
  href: string;
};

/** Las solicitudes nuevas más recientes, con la etiqueta de su tipo («Cotización de equipo»). */
export function mensajesRecientes(
  docs: { id: number | string; nombre?: unknown; tipo?: unknown; createdAt?: unknown }[],
  etiquetasTipo: Record<string, string>,
): Mensaje[] {
  return docs.map((d) => {
    const tipo = typeof d.tipo === "string" ? d.tipo : "";
    return {
      id: d.id,
      nombre: typeof d.nombre === "string" && d.nombre.trim() ? d.nombre : "Sin nombre",
      tipo: etiquetasTipo[tipo] ?? tipo,
      creado: typeof d.createdAt === "string" ? d.createdAt : "",
      href: `${ADMIN}/collections/solicitudes/${d.id}`,
    };
  });
}
