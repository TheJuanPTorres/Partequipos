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

/**
 * «Cotizar» de una tarjeta de grupo (plantilla 4007 en las categorías, 2026-10-22): los productos
 * no tienen página propia, así que la tarjeta abre la ventana del formulario con el grupo ya
 * escrito en «¿Qué necesitas?». El nombre, que en WordPress va en mayúsculas, pasa a tipo frase
 * en el mensaje (solo ahí: la tarjeta lo pinta tal cual).
 */
export function mensajeCotizar(grupo: string, categoria: string): string {
  return `Quiero cotizar: ${enFrase(grupo)} (${categoria.trim().toLowerCase()}). Marca y modelo de la máquina: `;
}

/** «CADENA PARA MAQUINARIA PESADA» → «Cadena para maquinaria pesada»; lo que no va todo en mayúsculas, igual. */
export function enFrase(t: string): string {
  const limpio = t.trim().replace(/\s+/g, " ");
  if (limpio !== limpio.toUpperCase()) return limpio;
  const bajo = limpio.toLowerCase();
  return bajo.charAt(0).toUpperCase() + bajo.slice(1);
}
