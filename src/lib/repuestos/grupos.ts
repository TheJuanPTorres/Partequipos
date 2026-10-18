import type { CategoriasTecnica } from "@/payload-types";

import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * «QUÉ INCLUYE» de una categoría técnica (2026-10-18, dirección): los grupos de
 * productos que el editor carga en la categoría, como en WordPress. Lógica pura
 * de la página de categoría.
 *
 * Un grupo con «Mostrar en la web» desmarcado, sin nombre o sin ningún producto no se pinta (no deja una tarjeta
 * vacía), y una foto sin dimensiones tampoco: la tarjeta sale sin foto, sin hueco.
 */
export type GrupoVista = {
  id: string;
  nombre: string;
  imagen: ImagenLista | null;
  productos: string[];
};

export function gruposDeCategoria(categoria: CategoriasTecnica): GrupoVista[] {
  const grupos: GrupoVista[] = [];
  (categoria.grupos ?? []).forEach((g, i) => {
    const nombre = g.nombre?.trim() ?? "";
    const productos = (g.productos ?? []).map((p) => p.texto?.trim() ?? "").filter(Boolean);
    if (g.mostrar === false || !nombre || productos.length === 0) return;
    grupos.push({
      id: g.id ?? `grupo-${i}`,
      nombre,
      imagen: imagenDeMedia(g.imagen, `${nombre} para maquinaria pesada`),
      productos,
    });
  });
  return grupos;
}
