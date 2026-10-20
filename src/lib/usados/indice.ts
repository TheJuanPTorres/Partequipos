import type { CategoriasUsada, MarcasUsada, Media } from "@/payload-types";

import { logoDeMarca, type IndiceLogos } from "../marca/logoMarca";
import type { TarjetaMarca } from "../repuestos/marca";
import { imagenDeMedia, posicionFocal, type ImagenLista } from "../utils/relations";
import { SIN_UNIDADES } from "./vacia";

/**
 * Lógica pura del ÍNDICE DE USADOS con la «Plantilla 1» (petición del cliente,
 * 2026-10-18): una tarjeta por categoría con unidades y, debajo, una por marca
 * con unidades y su número. El acceso a datos está en `lib/queries`.
 *
 * Foto de cada tarjeta: la elegida en el panel (la «Imagen de la tarjeta» de la
 * categoría o el logo de la marca) y, si no hay, la primera foto de su unidad
 * más reciente (por fecha de publicación) que tenga foto. Sin ninguna, la
 * tarjeta se pinta solo con el recuadro.
 */

/** Lo que hace falta de cada unidad disponible. */
export type UnidadDelIndice = {
  categoria: number;
  marcaUsada: number | null;
  fechaPublicacion?: string | null;
  foto: Pick<Media, "url" | "alt" | "width" | "height" | "focalX" | "focalY"> | null;
};

const fecha = (u: UnidadDelIndice) =>
  u.fechaPublicacion ? Date.parse(u.fechaPublicacion) || 0 : 0;

/** La primera foto de la unidad más reciente que tenga foto. */
export function fotoMasReciente(unidades: UnidadDelIndice[]): ImagenLista | null {
  const conFoto = unidades
    .filter((u) => u.foto?.url && u.foto.width && u.foto.height)
    .sort((a, b) => fecha(b) - fecha(a));
  const foto = conFoto[0]?.foto;
  if (!foto?.url || !foto.width || !foto.height) return null;
  return {
    url: foto.url,
    alt: foto.alt ?? "",
    width: foto.width,
    height: foto.height,
    posicion: posicionFocal(foto.focalX, foto.focalY),
  };
}

const agrupar = (unidades: UnidadDelIndice[], clave: (u: UnidadDelIndice) => number | null) => {
  const grupos = new Map<number, UnidadDelIndice[]>();
  for (const u of unidades) {
    const k = clave(u);
    if (k === null) continue;
    grupos.set(k, [...(grupos.get(k) ?? []), u]);
  }
  return grupos;
};

/** «1 unidad disponible», «3 unidades disponibles». */
export const textoUnidades = (n: number) =>
  `${n} ${n === 1 ? "unidad disponible" : "unidades disponibles"}`;

/**
 * Una tarjeta por categoría, en el orden recibido (por nombre), enlazando a su
 * listado. Por defecto solo las que tienen unidades; con `incluirVacias`
 * (el índice de usados, petición del cliente del 2026-10-18), también las
 * vacías, DESPUÉS de las que tienen unidades y con «Sin unidades por ahora».
 */
export function tarjetasDeCategoriasUsada(
  categorias: Pick<CategoriasUsada, "id" | "nombre" | "slug" | "imagen">[],
  unidades: UnidadDelIndice[],
  ruta: (slug: string) => string,
  { incluirVacias = false }: { incluirVacias?: boolean } = {},
): TarjetaMarca[] {
  const porCategoria = agrupar(unidades, (u) => u.categoria);
  const filas = categorias
    .filter((c) => c.nombre && c.slug)
    .map((c) => {
      const suyas = porCategoria.get(c.id) ?? [];
      const tarjeta: TarjetaMarca = {
        clave: `categoria-${c.id}`,
        titulo: c.nombre,
        href: `${ruta(c.slug)}/`,
        imagen: imagenDeMedia(c.imagen, "") ?? fotoMasReciente(suyas),
        soloEscritorio: false,
        detalle: suyas.length ? textoUnidades(suyas.length) : SIN_UNIDADES,
      };
      return { tarjeta, n: suyas.length };
    });
  const con = filas.filter((f) => f.n > 0);
  const vacias = incluirVacias ? filas.filter((f) => f.n === 0) : [];
  return [...con, ...vacias].map((f) => f.tarjeta);
}

/**
 * Una tarjeta por marca CON unidades, en el orden recibido (por nombre), con
 * su número de unidades. Con logo —el de todo el sitio (`logoDeMarca`): el de la
 * marca de repuestos con su nombre o, si no, el suyo—, el logo entero; sin él,
 * la foto de su unidad más reciente.
 */
export function tarjetasDeMarcasUsada(
  marcas: Pick<MarcasUsada, "id" | "nombre" | "slug" | "logo">[],
  unidades: UnidadDelIndice[],
  ruta: (slug: string) => string,
  logos: IndiceLogos = new Map(),
): TarjetaMarca[] {
  const porMarca = agrupar(unidades, (u) => u.marcaUsada);
  return marcas
    .filter((m) => m.nombre && m.slug && porMarca.get(m.id)?.length)
    .map((m) => {
      const suyas = porMarca.get(m.id) ?? [];
      const logo = logoDeMarca(m, logos);
      return {
        clave: `marca-${m.id}`,
        titulo: m.nombre,
        href: `${ruta(m.slug)}/`,
        imagen: logo ? null : fotoMasReciente(suyas),
        ...(logo ? { logo } : {}),
        soloEscritorio: false,
        detalle: textoUnidades(suyas.length),
      };
    });
}
