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
export const EQUIPOS_PRUEBA = [
  { imagen: "excavadora-amarilla-aislada-archivo-png-fondo-transparente-e1788914890653.png" },
  { imagen: "014_Cut01_2560x1710v0-2.png" },
].map((e) => ({
  ...e,
  nombre: "Excavadora Hitachi ZX75US-7",
  marca: "Hitachi",
  modelo: "ZX75US-7",
  pesoOperativo: 8.4,
  potencia: 64,
  motor: "YANMAR 4TNV98CT",
  /** Marca de registro de prueba: así los encuentra `retirar`. */
  descripcion: `${MARCA_PRUEBA}equipo de demostración de la portada (fase D).`,
}));

export function esEquipoDePrueba(e: { descripcion?: string | null }): boolean {
  return Boolean(e.descripcion?.startsWith(MARCA_PRUEBA));
}

/** Punto focal en el centro, como en el diseño de Andrés. */
export const FOCAL_PRUEBA = { focalX: 50, focalY: 50 } as const;

export type Veredicto = { permitido: true } | { permitido: false; motivo: string };

/** Id del almacén de un token de Blob (`vercel_blob_rw_<id>_<secreto>`), sin el secreto. */
export function almacenDeToken(token: string | undefined): string | null {
  return token?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase() ?? null;
}

/**
 * Solo si la base es la del preview Y el Blob es el del preview. Lista de
 * permitidos de un elemento en cada caso: producción, development o cualquier
 * desconocido se rechazan, también si falta la variable.
 */
export function puedeTocarHeroDePrueba(
  databaseUri: string | undefined,
  blobToken: string | undefined,
): Veredicto {
  const host = databaseUri?.trim() ? hostDeConexion(databaseUri.trim()) : null;
  if (host !== HOST_PREVIEW) {
    return {
      permitido: false,
      motivo: `la base «${host ?? "sin DATABASE_URI"}» no es la del preview (${HOST_PREVIEW})`,
    };
  }
  const almacen = almacenDeToken(blobToken);
  if (almacen !== ALMACEN_PREVIEW) {
    return {
      permitido: false,
      motivo: `el Blob «${almacen ?? "sin BLOB_READ_WRITE_TOKEN"}» no es el del preview (${ALMACEN_PREVIEW}); con .env.local sería el de PRODUCCIÓN`,
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
