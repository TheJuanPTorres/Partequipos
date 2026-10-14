import type { CategoriasLubricante, Documento } from "@/payload-types";

import { imagenDeMedia, poblado, type ImagenLista } from "../utils/relations";

/**
 * PÁGINA DE LA MARCA DE LUBRICANTES — de los documentos de Payload a lo que se
 * pinta. Lógica pura, sin consultas.
 *
 * Desde el 2026-10-14 (decisión de dirección) las categorías son SECCIONES de
 * esta página, con su `slug` como ancla, y cada una lista sus productos como
 * en el sitio actual: foto, nombre, grado y ficha técnica en PDF. Los
 * productos seguidos con el mismo «grupo» van bajo ese subtítulo.
 */

export type ProductoLubricante = {
  clave: string;
  nombre: string;
  grado: string | null;
  /** Lleva `alt` con el nombre y el grado si la foto no tiene uno propio. */
  imagen: ImagenLista | null;
  /** URL del PDF del fabricante. */
  ficha: string | null;
};

export type GrupoProductos = {
  clave: string;
  /** Subtítulo del grupo; `null` para los productos sin grupo. */
  titulo: string | null;
  productos: ProductoLubricante[];
};

export type SeccionLubricante = {
  /** El ancla de la sección: el `slug` de la categoría. */
  ancla: string;
  nombre: string;
  entradilla: string | null;
  grupos: GrupoProductos[];
  /** Foto de la tarjeta que lleva a la sección. Decorativa. */
  imagen: ImagenLista | null;
};

type Producto = NonNullable<CategoriasLubricante["productos"]>[number];

function producto(p: Producto, i: number): ProductoLubricante | null {
  const nombre = p.nombre?.trim();
  if (!nombre) return null;
  const grado = p.grado?.trim() || null;
  const nombreCompleto = grado ? `${nombre} ${grado}` : nombre;
  return {
    clave: p.id ?? `p${i}`,
    nombre,
    grado,
    imagen: imagenDeMedia(p.imagen, `Envase de lubricante ${nombreCompleto}`),
    ficha: poblado<Documento>(p.ficha)?.url ?? null,
  };
}

/**
 * Agrupa los productos SEGUIDOS con el mismo grupo, conservando el orden del
 * panel. Un grupo que se repite más abajo, separado, forma otro bloque: así
 * manda el orden que puso el editor.
 */
export function agruparProductos(productos: Producto[]): GrupoProductos[] {
  const grupos: GrupoProductos[] = [];
  productos.forEach((p, i) => {
    const vista = producto(p, i);
    if (!vista) return;
    const titulo = p.grupo?.trim() || null;
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.titulo === titulo) ultimo.productos.push(vista);
    else grupos.push({ clave: `g${grupos.length}`, titulo, productos: [vista] });
  });
  return grupos;
}

export function seccionesDeCategorias(categorias: CategoriasLubricante[]): SeccionLubricante[] {
  return categorias.map((c) => ({
    ancla: c.slug,
    nombre: c.nombre,
    entradilla: c.entradilla?.trim() || null,
    grupos: agruparProductos(c.productos ?? []),
    imagen: imagenDeMedia(c.imagen, ""),
  }));
}
