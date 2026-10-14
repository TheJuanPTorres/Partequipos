import type { CategoriasTecnica, Marca, RepuestosMarca, TiposEquipo } from "@/payload-types";

import { rutas } from "../routes";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * Lógica pura de la página de marca de repuestos (ux-9,
 * docs/diseno/decisiones-repuestos-marca.md): convierte lo que devuelve
 * Payload en lo que se pinta. El acceso a datos está en
 * `lib/queries/getRepuestosMarca.ts`.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

// --- Encabezado --------------------------------------------------------------

export type VistaEncabezado = {
  /** Primera línea del `<h1>`: «Repuestos para maquinaria pesada». */
  linea1: string;
  /** Segunda: «CATERPILLAR En Colombia». */
  linea2: string;
  /** Texto de presentación: la descripción de la marca. */
  descripcion: string;
  fondo: ImagenLista | null;
  /** El logo de la marca va sobre el título, en una placa blanca. */
  logo: ImagenLista | null;
};

/**
 * El título nunca queda vacío: sin el texto del global, el `<h1>` usa el
 * de respaldo. Una página sin `<h1>` sería peor que una con él (§3.4).
 */
export function vistaEncabezado(marca: Marca, global: RepuestosMarca): VistaEncabezado {
  const nombre = marca.nombre.trim();
  const linea1 = texto(global.tituloHero) || "Repuestos para maquinaria pesada";
  const sufijo = texto(global.subtituloHero);
  return {
    linea1,
    linea2: [nombre.toUpperCase(), sufijo].filter(Boolean).join(" "),
    descripcion: texto(marca.descripcion),
    fondo: imagenDeMedia(marca.fondoHero, ""),
    logo: imagenDeMedia(marca.logo, `Logo de ${nombre}`),
  };
}

// --- Categorías --------------------------------------------------------------

export type CategoriaMarca = {
  id: number;
  nombre: string;
  icono: CategoriasTecnica["icono"];
  /** Su página de categoría. Sin slug no hay página y se pinta SIN enlace (nada de enlaces rotos). */
  href: string | null;
};

/**
 * Orden: primero las que tienen `ordenMarca` (de menor a mayor), luego el
 * resto por nombre. Una categoría sin nombre no sale.
 */
export function categoriasDeMarca(categorias: CategoriasTecnica[]): CategoriaMarca[] {
  return categorias
    .filter((c) => c.nombre?.trim())
    .sort((a, b) => {
      const oa = typeof a.ordenMarca === "number" ? a.ordenMarca : Infinity;
      const ob = typeof b.ordenMarca === "number" ? b.ordenMarca : Infinity;
      if (oa !== ob) return oa < ob ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, "es");
    })
    .map((c) => ({
      id: c.id,
      nombre: c.nombre.trim(),
      icono: c.icono ?? null,
      href: texto(c.slug) ? rutas.categoriaRepuestos(texto(c.slug)) : null,
    }));
}

// --- Tarjetas ------------------------------------------------------------------

export type TarjetaMarca = {
  clave: string;
  titulo: string;
  href: string;
  /** Decorativa: el título ya nombra la tarjeta. */
  imagen: ImagenLista | null;
  /** Las del marketplace se ocultan en móvil, como en ux-9. */
  soloEscritorio: boolean;
};

/**
 * Una tarjeta por tipo de la marca, con su enlace «Ver todo» a la página del
 * tipo. El título es el de ux-9: «Repuestos para maquinaria pesada <tipo>
 * <MARCA>». Un tipo sin nombre o sin slug no sale.
 */
export function tarjetasDeTipos(marca: Marca, tipos: TiposEquipo[]): TarjetaMarca[] {
  const nombreMarca = marca.nombre.trim().toUpperCase();
  return tipos
    .filter((t) => t.nombre?.trim() && t.slug?.trim())
    .map((t) => ({
      clave: `tipo-${t.id}`,
      titulo: `Repuestos para maquinaria pesada ${t.nombre.trim().toLowerCase()} ${nombreMarca}`,
      href: rutas.tipo(marca.slug, t.slug),
      imagen: imagenDeMedia(t.imagen, ""),
      soloEscritorio: false,
    }));
}

type TarjetaGlobal = NonNullable<RepuestosMarca["tarjetaUsadas"]>;

/**
 * Las dos tarjetas del marketplace (usada y aditamentos). Sin título o sin
 * enlace no se pintan: nada de tarjetas que lleven a ninguna parte.
 */
export function tarjetaDeMarketplace(
  clave: string,
  t: TarjetaGlobal | null | undefined,
): TarjetaMarca | null {
  const titulo = texto(t?.titulo);
  const href = texto(t?.enlace);
  if (!titulo || !href) return null;
  return { clave, titulo, href, imagen: imagenDeMedia(t?.imagen, ""), soloEscritorio: true };
}

/** Los tipos primero y, al final, usadas y aditamentos (los que existan). */
export function tarjetasDeLaPagina(
  marca: Marca,
  tipos: TiposEquipo[],
  global: RepuestosMarca,
): TarjetaMarca[] {
  return [
    ...tarjetasDeTipos(marca, tipos),
    ...[
      tarjetaDeMarketplace("usadas", global.tarjetaUsadas),
      tarjetaDeMarketplace("aditamentos", global.tarjetaAditamentos),
    ].filter((t): t is TarjetaMarca => t !== null),
  ];
}
