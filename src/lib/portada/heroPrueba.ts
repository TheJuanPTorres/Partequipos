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
