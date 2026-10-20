import type { CategoriasUsada, EquiposUsado, MarcasMaquinaria } from "@/payload-types";

import { SLUG_CATEGORIA_USADA_ADITAMENTOS } from "../aditamentos/wordpress";
import { conAlt, logoDeMarca, type IndiceLogos, type LogoConAlt } from "../marca/logoMarca";
import { SEGMENTO_OTROS_USADA } from "../routes";
import { imagenDeMedia, poblado, type ImagenLista } from "../utils/relations";

/**
 * SECCIONES 2 Y 3 DE LA PORTADA (fase D, docs/diseno/decisiones-home-ux9.md §11).
 * Lógica pura: convierte lo que devuelve Payload en lo que se pinta. El acceso a
 * datos está en `src/lib/queries/getMaquinaria.ts`.
 */

export const RUTA_MARCAS_NUEVA = "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/";
export const RUTA_USADA = "/maquinaria-pesada/maquinaria-pesada-usada/";

/** La categoría que lleva pestaña propia y el botón «Ver todas las excavadoras». */
export const SLUG_EXCAVADORAS = "excavadoras";

/** La Home V2 enseña tres tarjetas por pestaña, en fila en escritorio y tablet. */
export const TARJETAS_POR_PESTANA = 6;

// --- Sección 2: tarjetas de marca -------------------------------------------

export type TarjetaMarca = {
  id: number;
  nombre: string;
  href: string;
  texto: string | null;
  /** Decorativa: `alt` vacío. El nombre lo da el logo. */
  fondo: ImagenLista;
  /** `alt` = nombre de la marca: es lo único que la nombra en la tarjeta. El de todo el sitio. */
  logo: LogoConAlt | null;
};

/**
 * Solo las marcas con POSICIÓN EN LA PORTADA y FOTO DE TARJETA (sin foto, el
 * texto blanco caería sobre la página), en el orden de esa posición. En ux-9:
 * Hitachi, CASE y Yanmar.
 */
export function tarjetasDeMarcas(
  marcas: MarcasMaquinaria[],
  logos: IndiceLogos = new Map(),
): TarjetaMarca[] {
  const conPosicion = marcas
    .filter((m) => typeof m.ordenPortada === "number")
    .sort((a, b) => (a.ordenPortada ?? 0) - (b.ordenPortada ?? 0));
  return conPosicion.flatMap((m) => {
    const fondo = imagenDeMedia(m.imagenTarjeta, "");
    const nombre = m.nombre?.trim();
    if (!fondo || !nombre || !m.slug) return [];
    // El logo de la marca, el de todo el sitio: el de repuestos si es la misma marca.
    const logo = conAlt(logoDeMarca(m, logos), nombre);
    return [
      {
        id: m.id,
        nombre,
        href: `${RUTA_MARCAS_NUEVA}${m.slug}/`,
        texto: m.descripcion?.trim() || null,
        fondo: { ...fondo, alt: "" },
        logo,
      },
    ];
  });
}

// --- Sección 3: carrusel de excavadoras usadas -------------------------------

export type DatoFicha = { clave: "peso" | "anio" | "horometro"; etiqueta: string; valor: string };

export type TarjetaEquipo = {
  id: number;
  /** El nombre entero («Excavadora Hitachi ZX350H-5B 2016»), en una línea como la Home V2. */
  nombre: string;
  imagen: ImagenLista | null;
  ficha: DatoFicha[];
  /**
   * La PÁGINA de la unidad: «Ver producto» lleva a ella y, sin JavaScript,
   * «Cotizar» baja a su formulario. Una unidad aún sin dirección web no pinta
   * «Ver producto», y su «Cotizar» va a /contactanos/.
   */
  href: string | null;
};

/** Enlace de la cabecera del carrusel a una categoría de usados (dirección, 2026-10-20). */
export type EnlaceUsada = { clave: string; etiqueta: string; href: string };

const numero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
/** Horas con separador de miles SIEMPRE («4.500 h»), también con cuatro cifras. */
const horas = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0, useGrouping: "always" });

/**
 * Ficha de la tarjeta: peso operativo, año y horómetro, EN ESE ORDEN y
 * omitiendo lo que falte (cliente, 2026-10-16: los datos que de verdad tienen
 * las unidades importadas; la Home V2 pinta peso, potencia y motor, que casi
 * ninguna trae). El decimal va con coma (es-CO), no con el punto de ux-9.
 */
export function fichaDeEquipo(
  e: Pick<EquiposUsado, "pesoOperativo" | "anio" | "horometro">,
): DatoFicha[] {
  const ficha: DatoFicha[] = [];
  const valido = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;
  if (valido(e.pesoOperativo)) {
    ficha.push({
      clave: "peso",
      etiqueta: "Peso operativo",
      valor: `${numero.format(e.pesoOperativo)} t`,
    });
  }
  if (valido(e.anio) && Number.isInteger(e.anio)) {
    ficha.push({ clave: "anio", etiqueta: "Año", valor: String(e.anio) });
  }
  if (valido(e.horometro)) {
    ficha.push({
      clave: "horometro",
      etiqueta: "Horómetro",
      valor: `${horas.format(e.horometro)} h`,
    });
  }
  return ficha;
}

export function hrefDeCategoriaUsada(slug: string): string {
  return `${RUTA_USADA}${slug}/`;
}

/** Textos de los enlaces de la cabecera, desde el panel (página «inicio»; antes, las pestañas). */
export type EtiquetasEnlaces = {
  excavadoras?: string | null;
  otros?: string | null;
  aditamentos?: string | null;
};

/**
 * ENLACES de la cabecera del carrusel (dirección, 2026-10-20): ya no son
 * pestañas, llevan a su categoría de usados (`excavadoras`, la página
 * «Otros» y `aditamentos`). Los textos salen de los campos que tenían las
 * pestañas; vacíos, los de siempre. Se pintan siempre: las tres páginas existen
 * aunque no tengan unidades.
 */
export function enlacesDeUsada(etiquetas: EtiquetasEnlaces = {}): EnlaceUsada[] {
  return [
    { clave: SLUG_EXCAVADORAS, texto: etiquetas.excavadoras, defecto: "Excavadoras" },
    { clave: SEGMENTO_OTROS_USADA, texto: etiquetas.otros, defecto: "Otros" },
    {
      clave: SLUG_CATEGORIA_USADA_ADITAMENTOS,
      texto: etiquetas.aditamentos,
      defecto: "Aditamentos",
    },
  ].map(({ clave, texto, defecto }) => ({
    clave,
    etiqueta: texto?.trim() || defecto,
    href: hrefDeCategoriaUsada(clave),
  }));
}

/**
 * TARJETAS del carrusel: solo las EXCAVADORAS (dirección, 2026-10-20; antes
 * había un carrusel por pestaña). Las más recientes primero, en el orden que
 * trae la consulta, y hasta `por`. Solo equipos DISPONIBLES de la categoría
 * `excavadoras` y que no estén marcados como aditamento.
 */
export function tarjetasDeExcavadoras(
  equipos: EquiposUsado[],
  por: number = TARJETAS_POR_PESTANA,
): TarjetaEquipo[] {
  const tarjetas: TarjetaEquipo[] = [];
  for (const e of equipos) {
    if (!e.disponible || e.pestanaPortada === "aditamentos") continue;
    const categoria = poblado<CategoriasUsada>(e.categoria);
    const nombre = e.nombre?.trim();
    if (categoria?.slug !== SLUG_EXCAVADORAS || !nombre) continue;
    tarjetas.push({
      id: e.id,
      nombre,
      imagen: imagenDeMedia(Array.isArray(e.imagenes) ? e.imagenes[0] : null, nombre),
      ficha: fichaDeEquipo(e),
      href: e.slug ? `${hrefDeCategoriaUsada(categoria.slug)}${e.slug}/` : null,
    });
  }
  return tarjetas.slice(0, por);
}
