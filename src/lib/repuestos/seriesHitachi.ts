/**
 * Las series de Hitachi en WordPress (2026-10-17, dirección): las 4 tarjetas
 * de la página de la marca («excavadora HITACHI EX», «… ZAXIS» y las dos de
 * miniexcavadora), sin URL propia. Las usa `scripts/repuestos/series.ts`.
 * Detalle en docs/repuestos-importacion.md §8.
 */

export const MARCA_HITACHI = "repuestos-para-maquinaria-pesada-hitachi";

export type PlanFotoSerie = { url: string; fichero: string; alt: string };

export type PlanSeriesTipo = {
  tipoSlug: string;
  /** En este orden. Sin `foto`, la serie usa la imagen que ya tiene el tipo (la misma de WordPress). */
  series: { nombre: string; foto: PlanFotoSerie | null }[];
};

const SUBIDAS = "https://partequipos.com/wp-content/uploads/2024/01";

export const PLAN_HITACHI: PlanSeriesTipo[] = [
  {
    tipoSlug: "repuestos-para-maquinaria-pesada-excavadora-hitachi",
    series: [
      { nombre: "EX", foto: null },
      {
        nombre: "ZAXIS",
        foto: {
          url: `${SUBIDAS}/1.jpg`,
          fichero: "wp-serie-excavadora-hitachi-zaxis",
          // En WordPress decía «Hitachi CX 200»: errata.
          alt: "Excavadora Hitachi Zaxis",
        },
      },
    ],
  },
  {
    tipoSlug: "repuestos-para-maquinaria-pesada-miniexcavadora-hitachi",
    series: [
      { nombre: "EX", foto: null },
      {
        nombre: "ZAXIS",
        foto: {
          url: `${SUBIDAS}/mini-hitachi-zx.webp`,
          fichero: "wp-serie-miniexcavadora-hitachi-zaxis",
          alt: "Miniexcavadora Hitachi Zaxis",
        },
      },
    ],
  },
];

/**
 * La serie de un modelo de Hitachi, por el prefijo de su código: EX… → «EX»,
 * ZX… → «ZAXIS». Así se corrige la errata de WordPress, que listaba la
 * ZX450LC-5 como «EX450LC-5» entre las miniexcavadoras EX: la página real es
 * una excavadora ZX. `null` si el código no es de ninguna de las dos.
 */
export function serieHitachi(codigo: string | null | undefined): "EX" | "ZAXIS" | null {
  const c = (codigo ?? "").trim().toUpperCase();
  if (c.startsWith("EX")) return "EX";
  if (c.startsWith("ZX")) return "ZAXIS";
  return null;
}
