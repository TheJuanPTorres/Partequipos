import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import type { VistaEncabezado } from "../repuestos/marca";
import type { GrupoDeModelos } from "../repuestos/series";
import type { ModeloEnlace } from "../repuestos/tipo";
import { rutas } from "../routes";
import { tituloPorDefecto } from "../seo/porDefecto";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

import { franjaDesde, type SeccionKit } from "./paginaKit";
import { datosDeTarjeta, type TarjetaEquipo } from "./paginaMarcaAndres";
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
 * Los equipos del tipo como TARJETAS, las mismas de la página de marca (foto, nombre, datos
 * «Destacar», «Ver ficha» y «Cotizar»). Los sin nombre o sin slug no salen.
 */
export function tarjetasDeEquipos(
  marca: Pick<MarcasMaquinaria, "slug">,
  tipoSlug: string,
  equipos: EquiposNuevo[],
): TarjetaEquipo[] {
  return equipos.filter(publicable).map((e) => ({
    id: e.id,
    nombre: texto(e.nombre),
    href: `${rutas.equipoNuevo(marca.slug, tipoSlug, e.slug)}/`,
    foto: (e.imagenes ?? []).map((i) => imagenDeMedia(i, "")).find(Boolean) ?? null,
    datos: datosDeTarjeta(e.fichaTecnica),
  }));
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
 * Título de la franja: «Modelos de Cargadores Frontales Case Construction». Como el `<h1>`,
 * no repite la marca si el nombre del tipo ya la lleva; el tipo y la marca van tal como están
 * guardados (regla de toda la web, 2026-10-22: antes el tipo pasaba a minúscula).
 */
export function tituloFranja(marca: MarcasMaquinaria, tipo: TiposMaquinaria): string {
  return `Modelos de ${tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre)}`;
}

/**
 * La página de MARCA + TIPO con el «Kit de marca» del padre (ronda 8, 2026-10-26): las secciones
 * del kit, como en la página de la marca pero con TODOS los modelos (sin el tope de 6) en el orden
 * del campo «Orden». Un tipo normal da UNA sección; un «paraguas» (#238), una por subtipo con
 * equipos. «Ver toda la categoría» lleva a la página general del tipo (la categoría de nueva que
 * lo incluye); sin ella, `href` vacío y el enlace no se pinta (enlazaría a la propia página).
 */
export function seccionesKitDeTipo({
  marca,
  bloques,
  renders,
  hrefCategoria,
}: {
  marca: Pick<MarcasMaquinaria, "slug">;
  bloques: GrupoDeSubtipo[];
  renders: Map<number, { imagen: ImagenLista; recortado: boolean }>;
  hrefCategoria: string | null;
}): SeccionKit[] {
  return bloques
    .map(({ tipo, equipos }) => ({ tipo, tarjetas: tarjetasDeEquipos(marca, tipo.slug, equipos) }))
    .filter((b) => b.tarjetas.length > 0)
    .map(({ tipo, tarjetas }, n) => {
      const titulo = texto(tipo.nombre);
      return {
        clave: `tipo-${tipo.id}`,
        titulo,
        href: hrefCategoria ?? "",
        total: tarjetas.length,
        tarjetas,
        todas: [],
        hayMas: false,
        numero: String(n + 1).padStart(2, "0"),
        render: renders.get(tipo.id) ?? null,
        franjaDesde: franjaDesde(titulo, tarjetas.length),
      };
    });
}

/** La página general del tipo: la primera categoría de nueva que lo incluye. */
export function categoriaDeTipo(
  tipoId: number,
  categorias: { slug: string; tipos: number[] }[],
): string | null {
  const categoria = categorias.find((c) => c.tipos.includes(tipoId));
  return categoria ? `${rutas.categoriaNueva(categoria.slug)}/` : null;
}
