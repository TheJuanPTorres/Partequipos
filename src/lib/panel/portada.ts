/**
 * PORTADA PROPIA DEL PANEL (F2 del rediseño, 2026-10-06; decisiones-panel.md
 * §23). Decisiones puras, sin acceso a datos: qué avisos salen, qué tarjetas,
 * con qué enlaces. Los datos los trae `src/lib/queries/getPortadaPanel.ts`.
 */
import { GRUPOS_DEL_MENU, ordenarMenu, type GrupoDelMenu } from "./menu";

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
  indexacionPermitida: boolean;
};

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/**
 * Solo lo que NECESITA atención, en este orden: solicitudes sin atender,
 * redirecciones rotas, fichas sin fotos, textos alternativos flojos y, al
 * final, el sitio cerrado a buscadores (informativo). Con 0, el aviso no sale.
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
  if (d.altFlojos) {
    avisos.push({
      clave: "alt",
      tono: "aviso",
      texto: `${d.altFlojos} ${plural(d.altFlojos, "imagen tiene", "imágenes tienen")} el texto alternativo flojo.`,
      enlace: { href: rutaLista("media"), texto: "Ver cuáles" },
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
 * así «Partes del sitio» sale antes que «Configuración», que la portada de
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
      href: e.tipo === "global" ? rutaGlobal(e.slug) : rutaLista(e.slug),
      hrefCrear: e.tipo === "collection" && e.puedeCrear ? rutaCrear(e.slug) : null,
      contador: e.tipo === "collection" ? (contadores[e.slug] ?? null) : null,
      detalle: detalles[e.slug],
    };
    porGrupo.set(e.grupo, [...(porGrupo.get(e.grupo) ?? []), entrada]);
  }
  return ordenarMenu([...porGrupo].map(([nombre, entradas]) => ({ nombre, entradas })));
}

/** ¿Es uno de los 8 grupos del menú? (para el icono). */
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
