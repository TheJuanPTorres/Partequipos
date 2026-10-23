import type { Media } from "@/payload-types";

import type { EquipoNuevoListado, PestanaDeTipoNueva } from "../queries/getMaquinaria";
import type { TarjetaMarca } from "../repuestos/marca";
import { rutas } from "../routes";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

import { unaEntradaPorTipo } from "./ordenTipos";

/**
 * ÍNDICES DE MAQUINARIA NUEVA SIN MARKETPLACE (2026-10-22, dirección: el marketplace es solo
 * para usados). Lógica pura de las dos páginas, con la plantilla de índices de Andrés
 * (`IndiceTarjetas`):
 *
 * - `/maquinaria-pesada/maquinaria-pesada-nueva/`: tenía dos tarjetas, «Por marca» y «Por tipo
 *   de máquina»; desde el 2026-10-23 (cliente) da 301 al índice de tipos.
 * - `/maquinaria-pesada/maquinaria-pesada-nueva/tipos/` (URL NUEVA, fijada por dirección): una
 *   tarjeta por tipo, los mismos que las pestañas del antiguo listado y que el índice de nueva de
 *   WordPress. Cada tipo va a su página GENERAL, la categoría de nueva (`…/nueva/excavadoras/`),
 *   aunque solo tenga equipos de una marca (2026-10-23, tarea 9). Solo un tipo SIN categoría va a
 *   la página de su tipo en su marca (casilla «Pestaña en el índice de maquinaria nueva»).
 *   Solo maquinaria: «Aditamentos» ya no lleva tarjeta (2026-10-23, dirección); tiene su entrada
 *   propia en el menú.
 */

/** Título y descripción de la página principal de nueva (el índice de tipos desde el 2026-10-23): los
 * del antiguo listado, así el SEO no cambia. */
export const TITULO_NUEVA = "Maquinaria pesada nueva";
export const DESCRIPCION_NUEVA =
  "Equipos nuevos organizados por marca y tipo, con ficha técnica y solicitud de cotización.";

/** La marca de nueva que hace de «Aditamentos» (fuera de las páginas de tipo, `paginaCategoria.ts`). */
export const SLUG_ADITAMENTOS = "aditamentos";

type CategoriaDelListado = {
  slug: string;
  nombre: string;
  tipos: number[];
  foto?: EquipoNuevoListado["foto"];
};

const imagen = (f: EquipoNuevoListado["foto"]): ImagenLista | null =>
  imagenDeMedia(f as Media | null, "");

/** La foto del primer equipo (por nombre) que cumple `filtro` y tiene foto. */
function primeraFoto(
  equipos: EquipoNuevoListado[],
  filtro: (e: EquipoNuevoListado) => boolean,
): ImagenLista | null {
  const ordenados = equipos.filter(filtro).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  for (const e of ordenados) {
    const foto = imagen(e.foto);
    if (foto) return foto;
  }
  return null;
}

/**
 * Las tarjetas del índice de tipos, en el orden de la web antigua; solo maquinaria. Una
 * categoría o un tipo sin equipos no sale (no hay nada a lo que llevar). Foto: la «Imagen de la
 * tarjeta» de la categoría o del tipo o, vacía, la del primer equipo con foto (por nombre).
 */
export function tarjetasDeTiposNueva(datos: {
  equipos: EquipoNuevoListado[];
  categorias: CategoriaDelListado[];
  pestanasTipos: PestanaDeTipoNueva[];
}): TarjetaMarca[] {
  // Solo maquinaria: los equipos de «Aditamentos» no cuentan ni para que salga una tarjeta ni
  // para su foto de respaldo (p. ej. un ahoyador en «Cargadores»), como en las páginas de tipo.
  const equipos = datos.equipos.filter((e) => e.marcaRef?.slug !== SLUG_ADITAMENTOS);
  const deCategorias = datos.categorias.flatMap((c) => {
    const tipos = new Set(c.tipos);
    const suyos = equipos.filter((e) => tipos.has(e.tipoId));
    if (suyos.length === 0) return [];
    return [
      {
        nombre: c.nombre,
        // De cuántas marcas son sus equipos: entre dos categorías del mismo tipo, gana la de más.
        // Al tipo de una marca le gana siempre (página general, 2026-10-23).
        marcas: new Set(suyos.map((e) => e.marcaRef?.slug)).size,
        dato: {
          clave: `categoria-${c.slug}`,
          titulo: c.nombre,
          href: `${rutas.categoriaNueva(c.slug)}/`,
          imagen: imagen(c.foto ?? null) ?? primeraFoto(equipos, (e) => tipos.has(e.tipoId)),
          soloEscritorio: false,
        } satisfies TarjetaMarca,
      },
    ];
  });
  const deTipos = datos.pestanasTipos.map((t) => ({
    nombre: t.nombre,
    dato: {
      clave: `tipo-${t.id}`,
      titulo: t.nombre,
      href: t.href,
      imagen: imagen(t.foto) ?? primeraFoto(equipos, (e) => t.tipos.includes(e.tipoId)),
      soloEscritorio: false,
    } satisfies TarjetaMarca,
  }));
  // Una por tipo y en el orden de la web antigua (el mismo del megamenú, `ordenTipos.ts`).
  return unaEntradaPorTipo(deCategorias, deTipos);
}
