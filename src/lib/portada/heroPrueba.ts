/**
 * La DIAPOSITIVA DE PRUEBA del hero, para el preview: con las fotos de ux-9, sirve
 * para medir el LCP tras cada fase (CLAUDE.md §10.3 p.14) y para enseñarle el
 * hero a Andrés. Lógica pura; el acceso a datos está en
 * `scripts/portada/hero-prueba-preview.ts`.
 *
 * LAS FOTOS SON DE ANDRÉS Y SU LICENCIA ESTÁ PENDIENTE (L3): solo van al
 * preview. El guardián de abajo exige a la vez la base Y el almacén de Blob del
 * preview, porque `payload run` carga `.env.local`, cuyo token de Blob es el de
 * PRODUCCIÓN (§10.4): con solo la base comprobada, las fotos acabarían en el
 * almacén público de producción.
 */
import { HOST_PREVIEW, hostDeConexion } from "../db/vaciadoSolicitudes";

/** Almacén de Blob del preview (§10.21). Es un identificador, no un secreto. */
export const ALMACEN_PREVIEW = "lsndnc29nh4ws7eh";

/** Marca de los registros de prueba: el texto alternativo empieza así. */
export const MARCA_PRUEBA = "PRUEBA HERO — ";

export const IMAGENES_PRUEBA = [
  { fichero: "Fondo.jpg", alt: `${MARCA_PRUEBA}Excavadora Hitachi en una cantera`, papel: "fondo" },
  { fichero: "Hero-1.png", alt: `${MARCA_PRUEBA}Excavadora Hitachi recortada`, papel: "frontal" },
] as const;

/** Texto de ux-9 (1717.json, sección 1). */
export const DIAPOSITIVA_PRUEBA = {
  titulo: "Potencia Hitachi",
  parrafo:
    "En Partequipos encuentras maquinaria Hitachi, diseñada para ofrecer rendimiento, precisión y confiabilidad en cada operación.",
  enlace: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/",
  enlaceNombre: "Ver marcas de maquinaria nueva",
} as const;

/*
 * SECCIONES 2 Y 3 (fase D). Mismas fotos de Andrés, misma licencia pendiente:
 * solo preview. `papel` dice dónde va cada una:
 * - `tarjeta:<slug>` / `logo:<slug>`: la marca de maquinaria nueva con ese slug
 *   (emparejadas como en ux-9, medido en su página pintada).
 * - `maquina`: la máquina recortada de la sección 3 (grupo `seccionUsada`).
 * - `equipo`: foto de un equipo usado de prueba (ver EQUIPOS_PRUEBA).
 */
export const IMAGENES_SECCIONES = [
  {
    fichero: "hitachi.jpg",
    alt: `${MARCA_PRUEBA}Excavadora Hitachi en obra`,
    papel: "tarjeta:hitachi",
  },
  {
    fichero: "double-drum-rollers-homepage.jpg",
    alt: `${MARCA_PRUEBA}Compactador CASE en una vía`,
    papel: "tarjeta:case-construction",
  },
  {
    fichero: "345345.jpg",
    alt: `${MARCA_PRUEBA}Equipo Yanmar en el campo`,
    papel: "tarjeta:yanmar",
  },
  {
    fichero: "Captura-de-pantalla-2026-09-22-a-las-2.54.44-p.m.png",
    alt: `${MARCA_PRUEBA}Logo de Hitachi`,
    papel: "logo:hitachi",
  },
  {
    fichero: "Captura-de-pantalla-2026-09-22-a-las-2.54.34-p.m.png",
    alt: `${MARCA_PRUEBA}Logo de CASE`,
    papel: "logo:case-construction",
  },
  { fichero: "2344.jpeg", alt: `${MARCA_PRUEBA}Logo de Yanmar`, papel: "logo:yanmar" },
  {
    fichero:
      "potentes-excavadoras-accion-maquinas-pesadas-excavar-mover-tierras-proyectos-construccion-1.png",
    alt: `${MARCA_PRUEBA}Brazo de excavadora con cucharón`,
    papel: "maquina",
  },
  {
    fichero: "excavadora-amarilla-aislada-archivo-png-fondo-transparente-e1788914890653.png",
    alt: `${MARCA_PRUEBA}Excavadora amarilla`,
    papel: "equipo",
    /*
     * 1.570 kB de origen. Solo tiene 255 colores visibles, así que en PNG con
     * paleta queda EXACTA en todo píxel visible y pesa 558 kB (medido; ver
     * docs/diseno/decisiones-home-ux9.md §11).
     */
    paleta: true,
  },
  {
    fichero: "014_Cut01_2560x1710v0-2.png",
    alt: `${MARCA_PRUEBA}Excavadora Yanmar roja`,
    papel: "equipo",
  },
] as const;

/** Los dos equipos usados de las tarjetas de ux-9 (sección 3, «Excavadoras»). */
/*
 * Dos equipos usados de las tarjetas de ux-9 (sección 3, «Excavadoras»).
 * Nombres, fichas y textos VEROSÍMILES: desde el 2026-09-24 también se siembran
 * en producción para la demo al cliente, y la página de la categoría muestra
 * nombre, año, horómetro, ubicación y descripción. Por eso NO llevan marca de
 * prueba visible: se reconocen por sus IMÁGENES (texto alternativo marcado).
 */
export const EQUIPOS_PRUEBA = [
  {
    imagen: "excavadora-amarilla-aislada-archivo-png-fondo-transparente-e1788914890653.png",
    nombre: "Excavadora Hitachi ZX75US-7",
    marca: "Hitachi",
    modelo: "ZX75US-7",
    anio: 2019,
    horometro: 4200,
    ubicacion: "Bogotá",
    pesoOperativo: 8.4,
    potencia: 64,
    motor: "YANMAR 4TNV98CT",
    descripcion:
      "Excavadora compacta de radio de giro corto, ideal para obra urbana. Mantenimientos al día.",
  },
  {
    imagen: "014_Cut01_2560x1710v0-2.png",
    nombre: "Miniexcavadora Yanmar ViO55-6",
    marca: "Yanmar",
    modelo: "ViO55-6",
    anio: 2020,
    horometro: 3100,
    ubicacion: "Medellín",
    pesoOperativo: 5.5,
    potencia: 47,
    motor: "YANMAR 4TNV88C",
    descripcion:
      "Miniexcavadora de voladizo cero con hoja niveladora. Cabina cerrada y aire acondicionado.",
  },
];

/** Un equipo es de prueba si alguna de sus imágenes es de prueba. */
export function esEquipoDePrueba(
  e: { imagenes?: (number | { id: number })[] | null },
  idsPrueba: number[],
): boolean {
  return (e.imagenes ?? []).some((i) => idsPrueba.includes(typeof i === "object" ? i.id : i));
}

/** Punto focal en el centro, como en el diseño de Andrés. */
export const FOCAL_PRUEBA = { focalX: 50, focalY: 50 } as const;

export type Veredicto = { permitido: true } | { permitido: false; motivo: string };

/** Id del almacén de un token de Blob (`vercel_blob_rw_<id>_<secreto>`), sin el secreto. */
export function almacenDeToken(token: string | undefined): string | null {
  return token?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase() ?? null;
}

/** Base y almacén de PRODUCCIÓN (§10.21, §10.4). Identificadores, no secretos. */
export const HOST_PRODUCCION = "ep-tiny-fog-awnwc8ie-pooler.c-12.us-east-1.aws.neon.tech";
export const ALMACEN_PRODUCCION = "sr2s4ngkjzfzpxhi";

/**
 * Por defecto, SOLO preview: base Y Blob del preview. Con `produccion: true`
 * (argumento `produccion` del script), SOLO producción: base Y Blob de
 * producción. Nunca otra combinación: development comparte el Blob de
 * producción, así que la base se exige siempre además del Blob.
 *
 * El modo producción existe para la DEMO AL CLIENTE del 2026-09-24 (CLAUDE.md
 * §10.33). Las fotos siguen con la licencia pendiente (L3).
 */
export function puedeTocarHeroDePrueba(
  databaseUri: string | undefined,
  blobToken: string | undefined,
  produccion = false,
): Veredicto {
  const [hostEsperado, almacenEsperado, entorno] = produccion
    ? [HOST_PRODUCCION, ALMACEN_PRODUCCION, "producción"]
    : [HOST_PREVIEW, ALMACEN_PREVIEW, "preview"];
  const host = databaseUri?.trim() ? hostDeConexion(databaseUri.trim()) : null;
  if (host !== hostEsperado) {
    return {
      permitido: false,
      motivo: `la base «${host ?? "sin DATABASE_URI"}» no es la de ${entorno} (${hostEsperado})`,
    };
  }
  const almacen = almacenDeToken(blobToken);
  if (almacen !== almacenEsperado) {
    return {
      permitido: false,
      motivo: `el Blob «${almacen ?? "sin BLOB_READ_WRITE_TOKEN"}» no es el de ${entorno} (${almacenEsperado})${produccion ? "" : "; con .env.local sería el de PRODUCCIÓN"}`,
    };
  }
  return { permitido: true };
}

type IdRel = number | { id: number } | null | undefined;
const idDe = (r: IdRel) => (r && typeof r === "object" ? r.id : (r ?? null));

/** ¿Es la diapositiva de prueba? Por el título y por usar una imagen de prueba. */
export function esDiapositivaDePrueba(
  d: { titulo?: string | null; imagenFondo?: IdRel; imagenFrontal?: IdRel },
  idsPrueba: number[],
): boolean {
  const usaPrueba = [idDe(d.imagenFondo), idDe(d.imagenFrontal)].some(
    (id) => id !== null && idsPrueba.includes(id),
  );
  return d.titulo === DIAPOSITIVA_PRUEBA.titulo && usaPrueba;
}

/** Quita las diapositivas de prueba y conserva las demás, en su orden. */
export function sinDiapositivasDePrueba<T extends Parameters<typeof esDiapositivaDePrueba>[0]>(
  diapositivas: T[],
  idsPrueba: number[],
): T[] {
  return diapositivas.filter((d) => !esDiapositivaDePrueba(d, idsPrueba));
}
