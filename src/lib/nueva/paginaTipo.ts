import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import type { VistaEncabezado } from "../repuestos/marca";
import type { GrupoDeModelos } from "../repuestos/series";
import type { ModeloEnlace } from "../repuestos/tipo";
import { rutas } from "../routes";
import { tituloPorDefecto } from "../seo/porDefecto";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

import type { GrupoDeSubtipo } from "./subtipos";

/**
 * Lógica pura de la PÁGINA DE TIPO de maquinaria nueva (2026-10-18, petición
 * del cliente): se pinta como la de tipo de repuestos (diseño de Andrés), con el
 * encabezado de foto y la franja amarilla de botones píldora, uno por equipo,
 * a su ficha. Reutiliza `HeroMarca` y `ModelosTipo`: aquí solo se convierten los
 * datos a lo que esos componentes esperan.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/** Un equipo como «modelo» de la franja: su nombre, su código y su ficha. */
export function enlaceDeEquipo(
  marca: MarcasMaquinaria,
  tipoSlug: string,
  equipo: EquiposNuevo,
): ModeloEnlace {
  const nombre = texto(equipo.nombre);
  const codigo = texto(equipo.codigo);
  return {
    id: equipo.id,
    nombre,
    // Un código que el nombre ya lleva no se repite.
    codigo: codigo && !nombre.toLowerCase().includes(codigo.toLowerCase()) ? codigo : null,
    href: `${rutas.equipoNuevo(marca.slug, tipoSlug, equipo.slug)}/`,
    serie: null,
  };
}

/** Los equipos sin nombre o sin slug no salen (no habría ficha a la que ir). */
const publicable = (e: EquiposNuevo) => Boolean(texto(e.nombre) && texto(e.slug));

export function enlacesDeEquipos(
  marca: MarcasMaquinaria,
  tipoSlug: string,
  equipos: EquiposNuevo[],
): ModeloEnlace[] {
  return equipos.filter(publicable).map((e) => enlaceDeEquipo(marca, tipoSlug, e));
}

/**
 * Las píldoras de un tipo «paraguas» (#238), agrupadas por subtipo: la ficha
 * cuelga del subtipo del equipo. El ancla permite enlazar a cada grupo.
 */
export function gruposDeEnlaces(
  marca: MarcasMaquinaria,
  grupos: GrupoDeSubtipo[],
): GrupoDeModelos<ModeloEnlace>[] {
  return grupos
    .map((g) => ({
      ancla: `subtipo-${g.tipo.slug}`,
      titulo: g.tipo.nombre,
      modelos: enlacesDeEquipos(marca, g.tipo.slug, g.equipos),
    }))
    .filter((g) => g.modelos.length > 0);
}

/**
 * Foto de la cabecera: la «Imagen de la tarjeta» del tipo (#229) o, si no la
 * tiene, la primera foto del primer equipo; sin ninguna, `null` y la cabecera
 * es la oscura y baja.
 */
export function fotoDeCabecera(tipo: TiposMaquinaria, equipos: EquiposNuevo[]): ImagenLista | null {
  const propia = imagenDeMedia(tipo.imagen, "");
  if (propia) return propia;
  for (const equipo of equipos) {
    for (const imagen of equipo.imagenes ?? []) {
      const foto = imagenDeMedia(imagen, "");
      if (foto) return foto;
    }
  }
  return null;
}

/** Encabezado: el `<h1>` de siempre («Excavadoras Hitachi»), la descripción y la foto. */
export function vistaEncabezadoTipoNueva(
  marca: MarcasMaquinaria,
  tipo: TiposMaquinaria,
  equipos: EquiposNuevo[],
): VistaEncabezado {
  return {
    linea1: tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre),
    linea2: "",
    descripcion: texto(tipo.descripcion),
    fondo: fotoDeCabecera(tipo, equipos),
    logo: null,
  };
}

/**
 * Título de la franja: «Modelos de Excavadoras Hitachi». Como el `<h1>`, no repite la marca
 * si el nombre del tipo ya la lleva; el tipo empieza por mayúscula (petición del cliente, 2026-10-20) y la marca conserva la suya.
 */
export function tituloFranja(marca: MarcasMaquinaria, tipo: TiposMaquinaria): string {
  const nombre = marca.nombre.trim();
  const minuscula = tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre).toLowerCase();
  // La marca recupera su grafía solo si cierra el título («excavadoras Hitachi»); si el tipo la lleva
  // al principio («aditamentos para minicargadores»), es una palabra más.
  const i = minuscula.length - nombre.length;
  const titulo = minuscula.endsWith(nombre.toLowerCase())
    ? minuscula.slice(0, i) + nombre
    : minuscula;
  return `Modelos de ${titulo.charAt(0).toUpperCase()}${titulo.slice(1)}`;
}
