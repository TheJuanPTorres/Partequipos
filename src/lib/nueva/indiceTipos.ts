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
 * - `/maquinaria-pesada/maquinaria-pesada-nueva/`: dos tarjetas, «Por marca» (al índice de
 *   marcas) y «Por tipo de máquina» (al índice de tipos).
 * - `/maquinaria-pesada/maquinaria-pesada-nueva/tipos/` (URL NUEVA, fijada por dirección): una
 *   tarjeta por tipo, los mismos que las pestañas del antiguo listado y que el índice de nueva de
 *   WordPress. Un tipo de VARIAS marcas va a su categoría transversal (`…/nueva/excavadoras/`);
 *   uno de UNA sola marca, a la página de su tipo en esa marca (casilla «Pestaña en el índice de
 *   maquinaria nueva» del tipo); y «Aditamentos» al final, a su página de marca.
 */

/** Título y descripción del índice de nueva: los del antiguo listado (el SEO no cambia). */
export const TITULO_NUEVA = "Maquinaria pesada nueva";
export const DESCRIPCION_NUEVA =
  "Equipos nuevos organizados por marca y tipo, con ficha técnica y solicitud de cotización.";

/** La marca de nueva que hace de «Aditamentos». */
export const SLUG_ADITAMENTOS = "aditamentos";

type CategoriaDelListado = { slug: string; nombre: string; tipos: number[] };

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
 * Las tarjetas del índice de tipos, en el orden de la web antigua y «Aditamentos» al final. Una
 * categoría o un tipo sin equipos no sale (no hay nada a lo que llevar). Foto: la «Imagen de la
 * tarjeta» del tipo o, vacía, la del primer equipo con foto (por nombre).
 */
export function tarjetasDeTiposNueva(datos: {
  equipos: EquipoNuevoListado[];
  categorias: CategoriaDelListado[];
  pestanasTipos: PestanaDeTipoNueva[];
}): TarjetaMarca[] {
  const { equipos } = datos;
  const deCategorias = datos.categorias.flatMap((c) => {
    const tipos = new Set(c.tipos);
    const suyos = equipos.filter((e) => tipos.has(e.tipoId));
    if (suyos.length === 0) return [];
    return [
      {
        nombre: c.nombre,
        // De cuántas marcas son sus equipos: una que las mezcla gana al tipo del mismo nombre.
        marcas: new Set(suyos.map((e) => e.marcaRef?.slug)).size,
        dato: {
          clave: `categoria-${c.slug}`,
          titulo: c.nombre,
          href: `${rutas.categoriaNueva(c.slug)}/`,
          imagen: primeraFoto(equipos, (e) => tipos.has(e.tipoId)),
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
  const tarjetas = unaEntradaPorTipo(deCategorias, deTipos);
  const deAditamentos = (e: EquipoNuevoListado) => e.marcaRef?.slug === SLUG_ADITAMENTOS;
  if (equipos.some(deAditamentos)) {
    tarjetas.push({
      clave: "aditamentos",
      titulo: "Aditamentos",
      href: `${rutas.marcaMaquinaria(SLUG_ADITAMENTOS)}/`,
      imagen: primeraFoto(equipos, deAditamentos),
      soloEscritorio: false,
    });
  }
  return tarjetas;
}

/**
 * Las dos tarjetas del índice de nueva. Fotos, de lo que ya hay (sin campo nuevo):
 * - «Por marca»: la «Imagen de la tarjeta» de la primera marca que la tenga (en el orden en que
 *   llegan las marcas);
 * - «Por tipo de máquina»: la de la primera tarjeta del índice de tipos que tenga foto.
 */
export function tarjetasIndiceNueva(
  fotoMarcas: ImagenLista | null,
  tiposConFoto: TarjetaMarca[],
): TarjetaMarca[] {
  return [
    {
      clave: "por-marca",
      titulo: "Por marca",
      href: `${rutas.marcasMaquinaria()}/`,
      imagen: fotoMarcas,
      soloEscritorio: false,
    },
    {
      clave: "por-tipo",
      titulo: "Por tipo de máquina",
      href: `${rutas.nuevaTipos()}/`,
      imagen: tiposConFoto.find((t) => t.imagen)?.imagen ?? null,
      soloEscritorio: false,
    },
  ];
}
