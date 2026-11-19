/**
 * ORGANIZACIÓN DEL MENÚ DEL PANEL (fase 2 de la organización del panel, PR 1, 2026-11-18; plan en
 * `partequipos-cierre\informes6-11-18-panel-organizacion-fase1.md` §2). Sustituye a los 8
 * grupos de la F1 (2026-10-06).
 *
 * Diez grupos en el orden en que piensa el cliente: primero lo que llega (mensajes), luego lo que
 * ve el visitante (portada, maquinaria, repuestos, lubricantes, servicio técnico, blog), la empresa
 *  las fotos y archivos (grupo propio, decisión de dirección del 2026-11-19) y, al final, la
 * configuración. Cada colección y global lleva su grupo en `admin.group`; las
 * entradas DIRECTAS (`ENTRADAS_DIRECTAS`) ponen una misma colección en otro grupo (la página de
 * inicio en «Portada», la de Servicio técnico en su grupo y los datos de la empresa en «Empresa y
 * sedes»), con enlace a su ficha.
 *
 * El orden lo fija ESTA lista, no el array de `payload.config.ts`: Payload agrupa por orden de
 * aparición y pone los globales detrás de todas las colecciones. No afecta al esquema: las tablas
 * van por slug.
 */
export const GRUPOS_DEL_MENU = [
  "Mensajes recibidos",
  "Portada",
  "Maquinaria",
  "Repuestos",
  "Lubricantes",
  "Servicio técnico",
  "Blog",
  "Empresa y sedes",
  "Fotos y archivos",
  "Configuración",
] as const;

export type GrupoDelMenu = (typeof GRUPOS_DEL_MENU)[number];

/**
 * Orden de las entradas dentro de cada grupo. Un slug que no esté aquí va al final de su grupo, en
 * el orden de Payload. Las directas van primero en su grupo.
 */
export const ORDEN_DE_ENTRADAS = [
  // Mensajes recibidos
  "solicitudes",
  // Portada (+ la página de inicio, directa)
  "testimonios",
  "preguntas-frecuentes",
  // Maquinaria
  "equipos-nuevos",
  "equipos-usados",
  "marcas-maquinaria",
  "tipos-maquinaria",
  "categorias-maquinaria",
  "categorias-usada",
  "marcas-usada",
  "ficha-producto",
  // Repuestos
  "modelos-repuesto",
  "marcas",
  "tipos-equipo",
  "categorias-tecnicas",
  "repuestos-marca",
  // Lubricantes
  "marcas-lubricante",
  "categorias-lubricante",
  // Blog
  "articulos",
  "categorias-blog",
  // Empresa y sedes (+ los datos de la empresa, directa)
  "sedes",
  "paginas",
  "vacantes-buk",
  // Fotos y archivos
  "media",
  "documentos",
  "videos",
  // Configuración
  "cabecera",
  "pie",
  "paginas-indice",
  "seo",
  "buscador",
  "busquedas-sin-resultado",
  "correo-formularios",
  "redirects",
  "users",
  "animaciones",
  "fuentes",
] as const;

/**
 * El nombre de cada entrada en el menú, en las palabras del cliente (§2 del plan). Solo cambia el
 * menú: la ficha y su lista conservan su nombre de colección.
 */
export const ETIQUETAS_DEL_MENU: Record<string, string> = {
  solicitudes: "Solicitudes y contacto",
  testimonios: "Testimonios",
  "preguntas-frecuentes": "Preguntas frecuentes",
  "equipos-nuevos": "Máquinas nuevas",
  "equipos-usados": "Máquinas usadas",
  "marcas-maquinaria": "Marcas (nuevas)",
  "tipos-maquinaria": "Tipos de máquina",
  "categorias-maquinaria": "Categorías (nuevas)",
  "categorias-usada": "Categorías (usadas)",
  "marcas-usada": "Marcas (usadas)",
  "ficha-producto": "Textos de las fichas",
  "modelos-repuesto": "Modelos",
  marcas: "Marcas",
  "tipos-equipo": "Tipos de equipo",
  "categorias-tecnicas": "Categorías técnicas",
  "repuestos-marca": "Textos de las páginas de repuestos",
  "marcas-lubricante": "Marcas",
  "categorias-lubricante": "Líneas y productos",
  articulos: "Artículos",
  "categorias-blog": "Categorías del blog",
  sedes: "Sedes",
  paginas: "Páginas (Nosotros, Contáctanos, legales…)",
  "vacantes-buk": "Trabaja con nosotros",
  cabecera: "Cabecera y menú",
  pie: "Pie de página",
  "paginas-indice": "Textos de las páginas índice",
  media: "Imágenes",
  documentos: "Documentos",
  videos: "Vídeos",
  seo: "Buscadores e imágenes del sitio",
  buscador: "Buscador del sitio (sinónimos)",
  "busquedas-sin-resultado": "Búsquedas sin resultado",
  "correo-formularios": "Correo de los formularios",
  redirects: "Redirecciones",
  users: "Usuarios",
  animaciones: "Animaciones",
  fuentes: "Fuentes",
};

/** Lo técnico: solo lo ve en el menú el Administrador (el acceso de cada colección no cambia). */
export const SOLO_ADMINISTRADOR = new Set(["redirects", "users", "animaciones", "fuentes"]);

/**
 * Entradas que llevan a UNA ficha concreta desde otro grupo. `pagina`: la página con esa dirección
 * (su ficha, buscada por `slug`); `global`: el global entero.
 */
export type EntradaDirecta = {
  grupo: GrupoDelMenu;
  etiqueta: string;
  clave: string;
} & ({ pagina: string } | { global: string });

export const ENTRADAS_DIRECTAS: EntradaDirecta[] = [
  { grupo: "Portada", etiqueta: "Portada", clave: "pagina-inicio", pagina: "inicio" },
  {
    grupo: "Servicio técnico",
    etiqueta: "Página de Servicio técnico",
    clave: "pagina-servicio-tecnico",
    pagina: "servicio-tecnico",
  },
  {
    grupo: "Empresa y sedes",
    etiqueta: "Datos de la empresa y redes",
    clave: "global-seo-empresa",
    global: "seo",
  },
];

/**
 * La entrada activa: la de href más largo que contiene la ruta (`/collections/paginas/12` activa
 * «Portada» si es la ficha de inicio, y no también «Páginas»). Misma regla que Payload para el
 * límite: después del href, «/» o nada. Con dos iguales (la de la empresa y «Buscadores» llevan
 * a `seo`), la primera del menú.
 */
export function entradaActiva(
  pathname: string,
  entradas: { clave: string; href: string }[],
): string | null {
  let mejor: { clave: string; largo: number } | null = null;
  for (const { clave, href } of entradas) {
    const siguiente = pathname[href.length];
    if (pathname.startsWith(href) && (siguiente === undefined || siguiente === "/")) {
      if (!mejor || href.length > mejor.largo) mejor = { clave, largo: href.length };
    }
  }
  return mejor?.clave ?? null;
}

const posicion = (lista: readonly string[], valor: string) => {
  const i = lista.indexOf(valor);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

/**
 * Ordena los grupos según `GRUPOS_DEL_MENU` y las entradas de cada uno según
 * `ORDEN_DE_ENTRADAS`. Un grupo o una entrada desconocidos van al final, en el
 * orden en que llegaron (orden estable): nunca se pierde nada.
 */
export function ordenarMenu<G extends { nombre: string; entradas: { slug: string }[] }>(
  grupos: G[],
): G[] {
  const estable = <T>(lista: T[], clave: (t: T) => number) =>
    lista
      .map((elemento, i) => ({ elemento, i }))
      .sort((a, b) => clave(a.elemento) - clave(b.elemento) || a.i - b.i)
      .map(({ elemento }) => elemento);

  return estable(grupos, (g) => posicion(GRUPOS_DEL_MENU, g.nombre)).map((g) => ({
    ...g,
    entradas: estable(g.entradas, (e) => posicion(ORDEN_DE_ENTRADAS, e.slug)),
  }));
}

/**
 * Clave de un grupo para `id` y clases: «Páginas y blog» → «paginas-y-blog».
 * Sin espacios, porque `aria-controls` es una lista de ids separados por ellos.
 */
export function idDeGrupo(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
