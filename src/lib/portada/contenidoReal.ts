import { rutas } from "../routes";

/**
 * CONTENIDO REAL DE LA HOME Y DE NOSOTROS (`scripts/contenido-real/importar.ts`):
 * tipos de la fuente y del manifiesto, y las reglas puras del importador.
 * Detalle en `docs/contenido-real-portada.md`.
 */

/** Prefijo de las imágenes que sube el importador: así se reconocen sin repetirlas. */
export const PREFIJO_REAL = "wp-real-";
/** Prefijo que pone `copia-demo.ts` a los ficheros de la copia de demostración. */
export const PREFIJO_COPIA_DEMO = "demo-copia-";

/** Nombre del fichero en el Blob: el prefijo, la clave y la extensión del de WordPress. */
export function ficheroReal(clave: string, urlWp: string): string {
  const ext = (urlWp.match(/\.(jpe?g|png|webp)(?:\?|$)/i)?.[1] ?? "jpg").toLowerCase();
  return `${PREFIJO_REAL}${clave.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${ext}`;
}

/**
 * ¿Lo eligió alguien en el PANEL? Entonces la importación NO lo pisa (dirección,
 * 2026-10-16: logos transparentes de las marcas, máquina recortada de usados).
 *
 * Es del panel un fichero que no está vacío, que no es de esta importación (sin
 * `PREFIJO_REAL`) y que no es el que había antes de la primera pasada
 * (`idAntes`, del manifiesto). Lo vacío, lo propio y lo de antes, sí se
 * sustituye. Un id que ya no existe (`fichero` null) cuenta como vacío.
 */
export function elegidoEnElPanel(
  actual: { id: number; fichero: string | null } | null,
  idAntes: number | null,
): boolean {
  if (!actual || actual.fichero === null) return false;
  if (actual.id === idAntes) return false;
  return !actual.fichero.startsWith(PREFIJO_REAL);
}

/**
 * Los ficheros de la copia de demostración que aún quedan (imágenes, vídeos o
 * animaciones con su prefijo). En el sitio publicado, el contenido real solo
 * entra cuando no queda ninguno: la retirada de la copia va ANTES.
 */
export function quedaCopiaDemo(nombres: (string | null | undefined)[]): string[] {
  return nombres.filter((n): n is string => !!n && n.startsWith(PREFIJO_COPIA_DEMO));
}

type PayloadLectura = {
  find: (a: {
    collection: "media" | "videos" | "animaciones";
    where: unknown;
    depth: number;
    limit: number;
    pagination: boolean;
    overrideAccess: boolean;
  }) => Promise<{ docs: { filename?: string | null }[] }>;
};

/** `quedaCopiaDemo` contra las tres colecciones de ficheros del destino. */
export async function restoDeLaCopia(payload: unknown): Promise<string[]> {
  const p = payload as PayloadLectura;
  const nombres: string[] = [];
  for (const collection of ["media", "videos", "animaciones"] as const) {
    const r = await p.find({
      collection,
      where: { filename: { like: PREFIJO_COPIA_DEMO } },
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
    });
    nombres.push(...quedaCopiaDemo(r.docs.map((d) => d.filename)));
  }
  return nombres;
}

/** Enlace de cada tarjeta de Nosotros: el índice de su sección del sitio. */
export const ENLACES_TARJETAS = {
  nueva: `${rutas.nuevaTipos()}/`,
  usada: `${rutas.usada()}/`,
  repuestos: `${rutas.repuestos()}/`,
} as const;

export type ClaveTarjeta = keyof typeof ENLACES_TARJETAS;

/** Lo que saca `scripts/contenido-real/extraer-xml.py` del XML de WordPress. */
export type FuenteContenidoReal = {
  imagenes: Record<string, { url: string; idWp: number; alt: string; foco?: [number, number] }>;
  portada: {
    marcas: { slug: string; logo: string; tarjeta: string; orden: number; descripcion: string }[];
    logos: { nombre: string; logo: string }[];
    categorias: {
      slug: string;
      enlace: string;
      imagen: string;
      titulo: string;
      orden: number;
      icono: string | null;
    }[];
    compania: { imagen: string; youtube: string };
    /** La foto de la tarjeta de las preguntas frecuentes. */
    faqImagen: string;
    metaDescripcion: string;
  };
  sedes: {
    nombre: string;
    ciudad: string;
    departamento: string;
    coordenadas: [number, number];
    lineas: {
      linea: string;
      localidad: string | null;
      direccion: string;
      telefono: string | null;
    }[];
  }[];
  nosotros: {
    cabecera: { antetitulo: string; titulo: string };
    antetitulo: string;
    titulo: string;
    parrafoHtml: string;
    boton: { texto: string; enlace: string };
    cifras: { prefijo: string | null; numero: number; sufijo: string | null; etiqueta: string }[];
    franja: string;
    tarjetasTitulo: string;
    tarjetas: { clave: ClaveTarjeta; titulo: string; texto: string; imagen: string }[];
    metaDescripcion: string;
  };
  avisos: string[];
};

type Datos = Record<string, unknown>;

/** Lo creado y el valor de ANTES de lo cambiado: con esto, la retirada es exacta. */
export type ManifiestoContenidoReal = {
  destino: string;
  inicio: string;
  completo?: string;
  creado: { media: { clave: string; id: number; url: string }[]; sedes: number[] };
  antes: {
    portada: { id: number; datos: Datos };
    nosotros: { id: number; datos: { bloques: unknown[]; seo: Datos } } | null;
    marcas: Record<string, Datos>;
    categorias: Record<string, Datos>;
    pie: Datos;
    sedesActualizadas: Record<string, Datos>;
    sedesQuitadas: Datos[];
  } | null;
};
