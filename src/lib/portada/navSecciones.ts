import type { ImagenLista } from "../utils/relations";

/**
 * Los tres botones de la BARRA DE SECCIONES de la portada (diseño del cliente, 2026-11-03;
 * `NavSecciones`), con sus textos y las anclas de las tres secciones de la portada. Es el
 * RESPALDO mientras no estén los campos del panel («Barra de secciones»): cada botón lleva la
 * máquina de su sección (la de «Maquinaria pesada nueva», la de «usada» y la de «Venta de
 * repuestos»), que ya es una máquina recortada.
 */
export const BOTONES_NAV_RESPALDO = [
  { texto: "Maquinaria pesada nueva", ancla: "nueva" },
  { texto: "Maquinaria pesada usada", ancla: "maquinaria-usada" },
  { texto: "Repuestos para maquinaria pesada", ancla: "repuestos" },
] as const;

export type BotonNav = { texto: string; ancla: string; imagen: ImagenLista | null };

/** Los botones de respaldo con la máquina de cada sección (en el mismo orden). */
export function botonesNavDeRespaldo(maquinas: (ImagenLista | null)[]): BotonNav[] {
  return BOTONES_NAV_RESPALDO.map((b, i) => ({ ...b, imagen: maquinas[i] ?? null }));
}
