/**
 * BUSCADOR GLOBAL DEL PANEL (Ctrl+K, tanda 23, fase 1): la lógica pura de la paleta de comandos y
 * del filtro del menú. Sin React ni Payload, para probarla y usarla en el navegador.
 *
 * Tres clases de resultado:
 * - **Secciones**: las entradas del menú que el usuario ve (las mismas, con su permiso).
 * - **Acciones**: «Crear …» de cada colección en la que puede crear.
 * - **Fichas**: documentos de las colecciones de `COLECCIONES_BUSCABLES`, por nombre o código,
 *   pedidos a la API REST con la sesión de quien busca (su acceso decide qué ve).
 */

export type TipoComando = "seccion" | "accion" | "ficha";

export type Comando = {
  /** Único en la paleta. */
  id: string;
  tipo: TipoComando;
  etiqueta: string;
  /** El grupo del menú o la colección: se muestra al lado y también se busca. */
  contexto?: string;
  href: string;
};

/** Minúsculas, sin tildes ni signos y con un solo espacio: «Máquinas  USADAS» → «maquinas usadas». */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim();
}

/**
 * ¿Coincide un texto con lo escrito? Cada palabra escrita tiene que aparecer (en cualquier orden).
 * Vacío, todo coincide.
 */
export function coincide(texto: string, busqueda: string): boolean {
  const palabras = normalizar(busqueda).split(" ").filter(Boolean);
  if (palabras.length === 0) return true;
  const t = normalizar(texto);
  return palabras.every((p) => t.includes(p));
}

/** Puntuación para ordenar: empieza por lo escrito > una palabra empieza por ello > contiene. */
function puntuacion(c: Comando, busqueda: string): number {
  const q = normalizar(busqueda);
  const e = normalizar(c.etiqueta);
  if (e === q) return 0;
  if (e.startsWith(q)) return 1;
  if (e.split(" ").some((p) => p.startsWith(q.split(" ")[0] ?? ""))) return 2;
  return 3;
}

const ORDEN_TIPO: Record<TipoComando, number> = { seccion: 0, accion: 1, ficha: 2 };

/**
 * Los comandos que coinciden, ordenados por tipo (secciones, acciones, fichas) y, dentro de cada
 * tipo, por lo bien que coinciden; a igualdad, el orden de entrada (el del menú). Como mucho
 * `max` de cada tipo.
 */
export function filtrarComandos(comandos: Comando[], busqueda: string, max = 8): Comando[] {
  const porTipo = new Map<TipoComando, Comando[]>();
  comandos.forEach((c) => {
    if (!coincide(`${c.etiqueta} ${c.contexto ?? ""}`, busqueda)) return;
    porTipo.set(c.tipo, [...(porTipo.get(c.tipo) ?? []), c]);
  });
  return [...porTipo.entries()]
    .sort(([a], [b]) => ORDEN_TIPO[a] - ORDEN_TIPO[b])
    .flatMap(([, lista]) =>
      lista
        .map((c, i) => ({ c, i, p: busqueda.trim() ? puntuacion(c, busqueda) : 0 }))
        .sort((x, y) => x.p - y.p || x.i - y.i)
        .slice(0, max)
        .map(({ c }) => c),
    );
}

/** Una colección en la que se buscan fichas: por qué campos y cuál es su título. */
export type ColeccionBuscable = {
  slug: string;
  /** Cómo se llama en la paleta («Máquina usada»). */
  etiqueta: string;
  titulo: string;
  campos: string[];
};

/**
 * Dónde se buscan fichas. El orden es el de la paleta. Solo colecciones de contenido: NUNCA
 * solicitudes (datos personales) ni usuarios.
 */
export const COLECCIONES_BUSCABLES: ColeccionBuscable[] = [
  { slug: "equipos-usados", etiqueta: "Máquina usada", titulo: "nombre", campos: ["nombre"] },
  {
    slug: "equipos-nuevos",
    etiqueta: "Máquina nueva",
    titulo: "nombre",
    campos: ["nombre", "codigo"],
  },
  {
    slug: "modelos-repuesto",
    etiqueta: "Modelo de repuestos",
    titulo: "nombre",
    campos: ["nombre", "codigo"],
  },
  { slug: "marcas", etiqueta: "Marca de repuestos", titulo: "nombre", campos: ["nombre"] },
  {
    slug: "marcas-maquinaria",
    etiqueta: "Marca de maquinaria nueva",
    titulo: "nombre",
    campos: ["nombre"],
  },
  { slug: "articulos", etiqueta: "Artículo del blog", titulo: "titulo", campos: ["titulo"] },
  { slug: "paginas", etiqueta: "Página", titulo: "titulo", campos: ["titulo"] },
];

/** Lo mínimo para buscar fichas: dos letras (una sola devolvería media base). */
export const MINIMO_FICHAS = 2;

/** Cuántas fichas de cada colección. */
export const FICHAS_POR_COLECCION = 4;

/**
 * La consulta REST de una colección: `like` de Payload (contiene cada palabra, sin distinguir
 * mayúsculas) en cualquiera de sus campos, solo el título, sin profundidad. `null` si lo escrito
 * es demasiado corto.
 */
export function urlBusqueda(api: string, c: ColeccionBuscable, busqueda: string): string | null {
  const q = busqueda.trim();
  if (q.length < MINIMO_FICHAS) return null;
  const p = new URLSearchParams();
  c.campos.forEach((campo, i) => p.set(`where[or][${i}][${campo}][like]`, q));
  p.set("limit", String(FICHAS_POR_COLECCION));
  p.set("depth", "0");
  p.set(`select[${c.titulo}]`, "true");
  p.set("sort", c.titulo);
  return `${api}/${c.slug}?${p.toString()}`;
}

/** Los documentos de una respuesta de la API, como comandos «ficha». */
export function fichasDeRespuesta(
  admin: string,
  c: ColeccionBuscable,
  respuesta: unknown,
): Comando[] {
  const docs = (respuesta as { docs?: unknown } | null)?.docs;
  if (!Array.isArray(docs)) return [];
  return docs.flatMap((d) => {
    const doc = d as Record<string, unknown>;
    const id = doc.id;
    if (typeof id !== "number" && typeof id !== "string") return [];
    const titulo = typeof doc[c.titulo] === "string" ? (doc[c.titulo] as string) : `#${id}`;
    return [
      {
        id: `ficha-${c.slug}-${id}`,
        tipo: "ficha" as const,
        etiqueta: titulo,
        contexto: c.etiqueta,
        href: `${admin}/collections/${c.slug}/${id}`,
      },
    ];
  });
}

/** ¿Es el atajo de la paleta? Ctrl+K (Windows, Linux) o Cmd+K (Mac). */
export function esAtajoPaleta(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): boolean {
  return (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k";
}
