import type { FotoFicha } from "@/components/ficha/GaleriaFicha";
import type { DatoDestacado } from "@/lib/maquinaria/fichaTecnica";
import { rutas } from "@/lib/routes";
import { articuloDefinido } from "@/lib/seo/porDefecto";
import { camposDeAditamento } from "@/lib/usados/aditamentos";
import { datosDeUnidad, parrafos } from "@/lib/usados/ficha";
import { sinTelefonoDeEmpresa } from "@/lib/usados/telefonoEnDescripcion";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp, mensajeExperto } from "@/lib/whatsapp";
import type { CategoriasUsada, Documento, EquiposUsado } from "@/payload-types";

/*
 * VISTA PREVIA EN VIVO de una unidad usada (tanda 21, tarea 3, fase 2, punto 5): las piezas de
 * la ficha que dependen de lo que el editor está escribiendo, calculadas igual que en la página
 * publicada (`[categoria]/[unidad]/page.tsx`), pero desde los datos del formulario.
 *
 * Mientras se edita, una relación puede llegar como id (aún sin poblar) o vacía: entonces se usa
 * la categoría que la unidad tenía guardada y la foto o el PDF simplemente no salen hasta que
 * Payload la puebla. Es puro (sin Payload ni Next) para poder usarlo en el navegador y probarlo.
 */

export type Categoria = Pick<CategoriasUsada, "id" | "slug" | "nombre">;

export type PiezasFichaUsada = {
  nombre: string;
  ruta: string;
  migas: { nombre: string; path: string }[];
  fotos: FotoFicha[];
  datos: DatoDestacado[];
  pdf: string | null;
  marca: string | null;
  parrafos: string[];
  experto: ReturnType<typeof enlaceWhatsApp> | null;
};

export function piezasFichaUsada(
  unidad: Partial<EquiposUsado>,
  guardada: Categoria,
  empresa: { telefono?: string | null; whatsapp: string },
  urlDe: (ruta: string) => string,
): PiezasFichaUsada {
  const nombre = unidad.nombre?.trim() || "Sin nombre";
  const categoria = poblado<CategoriasUsada>(unidad.categoria) ?? guardada;
  // Sin dirección todavía (una unidad sin guardar), la ruta de su categoría.
  const ruta = unidad.slug
    ? rutas.unidadUsada(categoria.slug, unidad.slug)
    : rutas.categoriaUsada(categoria.slug);

  const fotos: FotoFicha[] = (Array.isArray(unidad.imagenes) ? unidad.imagenes : [])
    .map((img) => imagenDeMedia(img, nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null)
    .map(({ url, alt, width, height }) => ({ url, alt, width, height }));

  const datos = datosDeUnidad({
    ...(unidad as EquiposUsado),
    serial: camposDeAditamento(categoria.slug, unidad).serial,
  });
  const marca =
    poblado<{ id: number; nombre: string }>(unidad.marcaUsada)?.nombre ?? unidad.marca ?? null;

  const articulo = articuloDefinido(categoria.nombre);
  const experto = enlaceWhatsApp(empresa.whatsapp, mensajeExperto(articulo, nombre, urlDe(ruta)));

  return {
    nombre,
    ruta,
    migas: [
      { nombre: "Inicio", path: "/" },
      { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
      { nombre: "Usada", path: rutas.usada() },
      { nombre: categoria.nombre, path: rutas.categoriaUsada(categoria.slug) },
      { nombre, path: ruta },
    ],
    fotos,
    datos,
    pdf: poblado<Documento>(unidad.fichaTecnicaPdf)?.url ?? null,
    marca,
    parrafos: sinTelefonoDeEmpresa(parrafos(unidad.descripcion), empresa.telefono).parrafos,
    experto,
  };
}
