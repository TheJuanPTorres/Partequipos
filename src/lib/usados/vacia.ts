import type { TarjetaMarca } from "../repuestos/marca";
import { tipoConMarca, tituloPorDefecto } from "../seo/porDefecto";
import { posicionFocal, type ImagenLista } from "../utils/relations";

/**
 * Lógica pura del ESTADO VACÍO de una categoría de usados (petición del
 * cliente, 2026-10-18): la categoría existe y se ve aunque no tenga unidades,
 * y su página invita a seguir mirando. Aquí, las ALTERNATIVAS en maquinaria
 * NUEVA: la misma categoría de nueva si existe (p. ej. «Cargadores nuevos») y,
 * si no, los tipos de nueva con equipos que se llaman igual (p. ej. las
 * Motoniveladoras de Case). Las de usados con unidades salen de
 * `tarjetasDeCategoriasUsada`.
 */

/** La marca discreta de las categorías de usados sin unidades. */
export const SIN_UNIDADES = "Sin unidades por ahora";

/**
 * ¿Se pinta el estado vacío diseñado? Solo si el global lo elige expresamente:
 * sin valor, o con cualquier otro, el aviso provisional (dirección,
 * 2026-10-19: en el sitio publicado solo van diseños de Andrés). EXCEPCIÓN de
 * dirección el mismo día: el diseño propio del estado vacío sí se publica, y es
 * el que dirección elige en el panel; no se cambia sin su orden.
 */
export function usaEstadoVacioPropio(usada: { estadoVacio?: string | null } | null | undefined) {
  return usada?.estadoVacio === "propio";
}

/** El texto del aviso provisional de un listado sin unidades. */
export const AVISO_SIN_UNIDADES = "Por ahora no hay unidades disponibles.";

/**
 * Nombre comparable: minúsculas, sin tildes y en singular aproximado
 * («Motoniveladoras» → «motoniveladora», «Cargadores» → «cargador»,
 * «Bulldozers» → «bulldozer»).
 */
export function nombreComparable(nombre: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  if (/(or|dor)es$/.test(base)) return base.slice(0, -2);
  if (base.endsWith("s")) return base.slice(0, -1);
  return base;
}

type Foto = {
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
} | null;

/** Lo que hace falta de cada equipo nuevo. */
export type EquipoNuevoAlternativa = {
  tipoId: number;
  tipoRef: { slug: string; nombre: string } | null;
  marcaRef: { slug: string; nombre: string } | null;
  foto: Foto;
};

export type CategoriaNuevaAlternativa = { slug: string; nombre: string; tipos: number[] };

const imagenDe = (foto: Foto): ImagenLista | null =>
  foto?.url && foto.width && foto.height
    ? {
        url: foto.url,
        alt: foto.alt ?? "",
        width: foto.width,
        height: foto.height,
        posicion: posicionFocal(foto.focalX, foto.focalY),
      }
    : null;

const primeraFoto = (equipos: EquipoNuevoAlternativa[]) =>
  imagenDe(equipos.find((e) => imagenDe(e.foto))?.foto ?? null);

/**
 * Las alternativas en maquinaria nueva de una categoría de usados: la
 * categoría de nueva con el mismo nombre (si tiene equipos) o, si no hay, cada
 * tipo de nueva con equipos que se llame igual. Hasta `tope` tarjetas.
 *
 * Se empareja por la DIRECCIÓN WEB de la categoría de usados (`slug`, que no
 * cambia al renombrarla: «cargadores» sigue casando con el tipo «Cargadores»
 * aunque la categoría pase a llamarse «Cargadores Frontales») y, si con ella no
 * sale nada, por el nombre visible (2026-10-21, dirección).
 */
export function alternativasEnNueva(
  nombreCategoria: string,
  categorias: CategoriaNuevaAlternativa[],
  equipos: EquipoNuevoAlternativa[],
  rutas: {
    categoriaNueva: (slug: string) => string;
    tipoMaquinaria: (marca: string, tipo: string) => string;
  },
  { tope = 3, slug }: { tope?: number; slug?: string } = {},
): TarjetaMarca[] {
  const candidatos = [
    ...new Set(
      [
        slug ? nombreComparable(slug.replace(/-/g, " ")) : "",
        nombreComparable(nombreCategoria),
      ].filter(Boolean),
    ),
  ];
  for (const buscado of candidatos) {
    const tarjetas = alternativasPorNombre(buscado, categorias, equipos, rutas, tope);
    if (tarjetas.length) return tarjetas;
  }
  return [];
}

function alternativasPorNombre(
  buscado: string,
  categorias: CategoriaNuevaAlternativa[],
  equipos: EquipoNuevoAlternativa[],
  rutas: {
    categoriaNueva: (slug: string) => string;
    tipoMaquinaria: (marca: string, tipo: string) => string;
  },
  tope: number,
): TarjetaMarca[] {
  const categoria = categorias.find((c) => nombreComparable(c.nombre) === buscado);
  if (categoria) {
    const tipos = new Set(categoria.tipos);
    const suyos = equipos.filter((e) => tipos.has(e.tipoId));
    // La foto, mejor de un equipo cuyo tipo se llama como la categoría: en
    // «Cargadores» entran también aditamentos (el ahoyador) y su foto engaña.
    const mismoNombre = suyos.filter(
      (e) => e.tipoRef && nombreComparable(e.tipoRef.nombre) === buscado,
    );
    if (suyos.length) {
      return [
        {
          clave: `nueva-categoria-${categoria.slug}`,
          titulo: tituloPorDefecto.categoriaNueva(categoria.nombre),
          href: `${rutas.categoriaNueva(categoria.slug)}/`,
          imagen: primeraFoto(mismoNombre) ?? primeraFoto(suyos),
          soloEscritorio: false,
        },
      ];
    }
  }

  const porTipo = new Map<number, EquipoNuevoAlternativa[]>();
  for (const e of equipos) {
    if (!e.tipoRef || !e.marcaRef || nombreComparable(e.tipoRef.nombre) !== buscado) continue;
    porTipo.set(e.tipoId, [...(porTipo.get(e.tipoId) ?? []), e]);
  }
  return [...porTipo.values()]
    .map((suyos) => {
      const { tipoRef, marcaRef } = suyos[0]!;
      return {
        clave: `nueva-tipo-${marcaRef!.slug}-${tipoRef!.slug}`,
        titulo: tipoConMarca(tipoRef!.nombre, marcaRef!.nombre),
        href: `${rutas.tipoMaquinaria(marcaRef!.slug, tipoRef!.slug)}/`,
        imagen: primeraFoto(suyos),
        soloEscritorio: false,
      };
    })
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"))
    .slice(0, tope);
}

/**
 * Un nombre de categoría dentro de una frase: TODO en minúscula («Cargadores
 * Frontales usados» → «cargadores frontales usados»; dirección, 2026-10-21).
 * Los títulos, el <h1>, las migas y las tarjetas conservan el nombre tal cual.
 */
export function nombreEnTexto(titulo: string): string {
  return titulo.toLowerCase();
}

/**
 * El titular del estado vacío: «Ahora mismo no tenemos cargadores frontales usados
 * disponibles» (el nombre de la categoría, todo en minúscula).
 */
export function mensajeSinUnidades(
  tipo: "categoria" | "marca",
  titulo: string,
  nombre: string,
): string {
  if (tipo === "marca") return `Ahora mismo no tenemos maquinaria ${nombre} usada disponible`;
  return `Ahora mismo no tenemos ${nombreEnTexto(titulo)} disponibles`;
}
