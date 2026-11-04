import type { ImagenLista } from "../utils/relations";

/**
 * Los botones de la BARRA DE SECCIONES de la portada (diseño del cliente, 2026-11-03;
 * `NavSecciones`). Se eligen en el panel, grupo «Barra de secciones» de la página «inicio»
 * (texto, sección de destino y foto). Vacía, el RESPALDO: los tres de siempre.
 *
 * El destino se elige entre las tres anclas que existen en la portada (`ANCLAS_NAV`), así un
 * botón nunca lleva a un ancla rota. Un botón sin foto lleva la máquina de su sección (la de
 * «Maquinaria pesada nueva», la de «usada» o la de «Venta de repuestos»).
 */
export const BOTONES_NAV_RESPALDO = [
  { texto: "Maquinaria pesada nueva", ancla: "nueva" },
  { texto: "Maquinaria pesada usada", ancla: "maquinaria-usada" },
  { texto: "Repuestos para maquinaria pesada", ancla: "repuestos" },
] as const;

export type AnclaNav = (typeof BOTONES_NAV_RESPALDO)[number]["ancla"];

/** Las anclas de la portada a las que puede llevar un botón (las opciones del panel). */
export const ANCLAS_NAV: readonly AnclaNav[] = BOTONES_NAV_RESPALDO.map((b) => b.ancla);

export type BotonNav = { texto: string; ancla: string; imagen: ImagenLista | null };

/** Un botón tal como llega del panel, con la foto ya convertida. */
export type BotonNavPanel = {
  texto?: string | null;
  ancla?: string | null;
  imagen?: ImagenLista | null;
};

/** Los botones de respaldo con la máquina de cada sección (en el mismo orden). */
export function botonesNavDeRespaldo(maquinas: (ImagenLista | null)[]): BotonNav[] {
  return BOTONES_NAV_RESPALDO.map((b, i) => ({ ...b, imagen: maquinas[i] ?? null }));
}

/**
 * Los botones que se pintan: los del panel que tengan texto y un destino válido (como mucho
 * uno por destino) o, si no queda ninguno, los de respaldo. `maquinas`, la máquina de cada
 * sección en el orden de `BOTONES_NAV_RESPALDO`.
 */
export function botonesNav(
  panel: readonly BotonNavPanel[] | null | undefined,
  maquinas: (ImagenLista | null)[],
): BotonNav[] {
  const maquinaDe = (ancla: string) => maquinas[ANCLAS_NAV.indexOf(ancla as AnclaNav)] ?? null;
  const vistos = new Set<string>();
  const botones: BotonNav[] = [];
  for (const b of panel ?? []) {
    const texto = b.texto?.trim();
    const ancla = b.ancla?.trim() ?? "";
    if (!texto || !ANCLAS_NAV.includes(ancla as AnclaNav) || vistos.has(ancla)) continue;
    vistos.add(ancla);
    botones.push({ texto, ancla, imagen: b.imagen ?? maquinaDe(ancla) });
  }
  return botones.length > 0 ? botones : botonesNavDeRespaldo(maquinas);
}
