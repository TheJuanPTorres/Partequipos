import type { CategoriasLubricante, Documento, MarcasLubricante } from "@/payload-types";

import { vistaDeDocumento, type VistaDocumentoVisor } from "../documentos/visor";
import type { VistaEncabezado } from "../repuestos/marca";
import { imagenDeMedia, poblado, type ImagenLista } from "../utils/relations";

/**
 * PÁGINAS DE LA MARCA DE LUBRICANTES Y DE SUS LÍNEAS — de los documentos de
 * Payload a lo que se pinta. Lógica pura, sin consultas.
 *
 * Cada línea (categoría) lista sus productos como en el sitio actual: foto,
 * nombre, grado y ficha técnica en PDF; los seguidos con el mismo «grupo» van
 * bajo ese subtítulo. Del 2026-10-14 al 21 las líneas fueron secciones de la
 * página de la marca, con su `slug` como ancla; desde el 2026-10-22 cada una
 * tiene su página (plantilla de Andrés 4039), y el diseño propio de la marca
 * (#260, opt-in) las sigue pintando como secciones.
 */

export type ProductoLubricante = {
  clave: string;
  nombre: string;
  grado: string | null;
  /** Lleva `alt` con el nombre y el grado si la foto no tiene uno propio. */
  imagen: ImagenLista | null;
  /** URL del PDF del fabricante. */
  ficha: string | null;
  /** El PDF con sus «Páginas como imágenes», para el visor; sin páginas, solo el enlace. */
  pdf: VistaDocumentoVisor | null;
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

/** «I-RIDE RACING 5W-40»: el nombre con su grado, como lo escribe la tarjeta. */
export function nombreCompleto(p: { nombre: string; grado: string | null }): string {
  return p.grado ? `${p.nombre} ${p.grado}` : p.nombre;
}

function producto(p: Producto, i: number): ProductoLubricante | null {
  // «Mostrar en la web» desmarcada: el producto no sale (sigue en el panel).
  if (p.mostrarEnWeb === false) return null;
  const nombre = p.nombre?.trim();
  if (!nombre) return null;
  const grado = p.grado?.trim() || null;
  const completo = nombreCompleto({ nombre, grado });
  const documento = poblado<Documento>(p.ficha);
  return {
    clave: p.id ?? `p${i}`,
    nombre,
    grado,
    imagen: imagenDeMedia(p.imagen, `Envase de lubricante ${completo}`),
    ficha: documento?.url ?? null,
    pdf: vistaDeDocumento(documento, `Ficha técnica: ${completo}`),
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

/**
 * Cabecera de la página de una línea (plantilla 4039): «Lubricantes <línea>», el logo de la
 * marca y, como texto, la entradilla de la línea o, vacía, la de la marca. El fondo es la
 * «Imagen de cabecera» de la línea, si no la foto de su tarjeta; sin ninguna, el fondo oscuro.
 */
export function encabezadoDeLinea(
  linea: Pick<CategoriasLubricante, "nombre" | "entradilla" | "imagen" | "imagenCabecera">,
  marca: Pick<MarcasLubricante, "entradilla">,
  logo: VistaEncabezado["logo"],
): VistaEncabezado {
  return {
    linea1: `Lubricantes ${linea.nombre.trim()}`,
    linea2: "",
    descripcion: linea.entradilla?.trim() || marca.entradilla?.trim() || "",
    fondo: imagenDeMedia(linea.imagenCabecera, "") ?? imagenDeMedia(linea.imagen, ""),
    logo,
  };
}

/**
 * LAS ANCLAS VIEJAS DE LA PÁGINA DE LA MARCA (`#auto-liviano`…), que del 2026-10-14 al 21
 * fueron las líneas y que pueden estar enlazadas desde fuera: cada una a la página de su
 * línea. El ancla no llega al servidor, así que lo hace un script en línea de la página de
 * la marca (`location.replace`, sin dejar la página de la marca en el historial).
 */
export function scriptAnclasALineas(destinos: Record<string, string>): string {
  // Los slugs no llevan «<», pero el JSON va dentro de un <script>: nunca puede cerrarlo.
  const mapa = JSON.stringify(destinos).replace(/</g, "\\u003c");
  return `(function(m){try{var h=decodeURIComponent(location.hash.slice(1));if(h&&Object.prototype.hasOwnProperty.call(m,h))location.replace(m[h]);}catch(e){}})(${mapa});`;
}
