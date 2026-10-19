import type { CategoriasTecnica, ModelosRepuesto, TiposEquipo } from "@/payload-types";

/**
 * Lógica pura de la PÁGINA DE MODELO de repuestos (diseño propio aprobado el
 * 2026-10-19, docs/diseno/decisiones-modelo-repuestos.md): los textos de
 * WordPress del modelo (tal cual, decisión del cliente) con su respaldo, y las
 * categorías elegidas en su tipo de máquina, en ese orden.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

export type VistaModelo = {
  /** Sobre el título; vacío, no se pinta. */
  antetitulo: string;
  /** El `<h1>`: el título de WordPress o, sin él, «Repuestos <nombre>». */
  titulo: string;
  /** El título de las categorías: el de WordPress o «Repuestos disponibles para <nombre>». */
  disponibles: string;
  /** La lista de piezas, SOLO si se muestra (en WordPress, oculta en la mayoría). */
  piezas: string[];
};

export function vistaModelo(modelo: ModelosRepuesto): VistaModelo {
  const nombre = texto(modelo.nombre);
  const piezas = modelo.mostrarPiezas
    ? (modelo.piezas ?? []).map((p) => texto(p.texto)).filter(Boolean)
    : [];
  return {
    antetitulo: texto(modelo.antetitulo),
    titulo: texto(modelo.tituloPagina) || `Repuestos ${nombre}`,
    disponibles: texto(modelo.tituloDisponibles) || `Repuestos disponibles para ${nombre}`,
    piezas,
  };
}

/**
 * Las categorías de la página de un modelo: las que su tipo eligió en
 * «Categorías en las páginas de sus modelos», en ESE orden. Una que ya no
 * existe (o sin nombre) no sale. `todas` son las categorías técnicas.
 */
export function categoriasDelTipo(
  tipo: Pick<TiposEquipo, "categoriasModelo">,
  todas: CategoriasTecnica[],
): CategoriasTecnica[] {
  const ids = (tipo.categoriasModelo ?? []).map((c) => (typeof c === "number" ? c : c.id));
  return ids.flatMap((id) => todas.filter((c) => c.id === id && texto(c.nombre)));
}
