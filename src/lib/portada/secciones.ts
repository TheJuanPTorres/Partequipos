import type { CategoriasUsada, EquiposUsado, MarcasMaquinaria } from "@/payload-types";

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

/** ux-9 enseña dos tarjetas por pestaña (seis en tres pestañas). */
export const TARJETAS_POR_PESTANA = 2;

// --- Sección 2: tarjetas de marca -------------------------------------------

export type TarjetaMarca = {
  id: number;
  nombre: string;
  href: string;
  texto: string | null;
  /** Decorativa: `alt` vacío. El nombre lo da el logo. */
  fondo: ImagenLista;
  /** `alt` = nombre de la marca: es lo único que la nombra en la tarjeta. */
  logo: ImagenLista | null;
};

/**
 * Solo las marcas con POSICIÓN EN LA PORTADA y FOTO DE TARJETA (sin foto, el
 * texto blanco caería sobre la página), en el orden de esa posición. En ux-9:
 * Hitachi, CASE y Yanmar.
 */
export function tarjetasDeMarcas(marcas: MarcasMaquinaria[]): TarjetaMarca[] {
  const conPosicion = marcas
    .filter((m) => typeof m.ordenPortada === "number")
    .sort((a, b) => (a.ordenPortada ?? 0) - (b.ordenPortada ?? 0));
  return conPosicion.flatMap((m) => {
    const fondo = imagenDeMedia(m.imagenTarjeta, "");
    const nombre = m.nombre?.trim();
    if (!fondo || !nombre || !m.slug) return [];
    const logo = imagenDeMedia(m.logo, nombre);
    return [
      {
        id: m.id,
        nombre,
        href: `${RUTA_MARCAS_NUEVA}${m.slug}/`,
        texto: m.descripcion?.trim() || null,
        fondo: { ...fondo, alt: "" },
        logo: logo ? { ...logo, alt: nombre } : null,
      },
    ];
  });
}

// --- Sección 3: pestañas de equipo usado --------------------------------------

export type DatoFicha = { clave: "peso" | "potencia" | "motor"; etiqueta: string; valor: string };

export type TarjetaEquipo = {
  id: number;
  /** «Excavadora Hitachi»: la primera línea, en mayúsculas por diseño. */
  principal: string;
  /** «ZX75US-7»: la segunda línea. */
  modelo: string | null;
  imagen: ImagenLista | null;
  ficha: DatoFicha[];
  /** El equipo usado no tiene URL propia (ADR 0007): se enlaza su categoría. */
  href: string;
};

export type Pestana = { clave: string; etiqueta: string; equipos: TarjetaEquipo[] };

/**
 * El nombre se parte en dos líneas como en ux-9 («EXCAVADORA HITACHI» /
 * «ZX75US-7»). Si el nombre ACABA en el modelo, se le quita; si no, el nombre
 * va entero y el modelo debajo. Nada se inventa: sin modelo, una sola línea.
 */
export function lineasDeNombre(
  nombre: string,
  modelo: string | null | undefined,
): { principal: string; modelo: string | null } {
  const n = nombre.trim();
  const m = modelo?.trim() || null;
  if (!m) return { principal: n, modelo: null };
  const sinModelo = n.toLowerCase().endsWith(m.toLowerCase()) ? n.slice(0, -m.length).trim() : n;
  return { principal: sinModelo || n, modelo: m };
}

const numero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

/**
 * Ficha de la tarjeta: peso, potencia y motor, EN ESE ORDEN y omitiendo lo que
 * falte. El decimal va con coma (es-CO), no con el punto de ux-9 («8.4 t»).
 */
export function fichaDeEquipo(
  e: Pick<EquiposUsado, "pesoOperativo" | "potencia" | "motor">,
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
  if (valido(e.potencia)) {
    ficha.push({
      clave: "potencia",
      etiqueta: "Potencia",
      valor: `${numero.format(e.potencia)} hp`,
    });
  }
  const motor = e.motor?.trim();
  if (motor) ficha.push({ clave: "motor", etiqueta: "Motor", valor: motor });
  return ficha;
}

export function hrefDeCategoriaUsada(slug: string): string {
  return `${RUTA_USADA}${slug}/`;
}

/** Etiquetas de las pestañas, desde el panel (página «inicio»). */
export type EtiquetasPestanas = {
  excavadoras?: string | null;
  otros?: string | null;
  aditamentos?: string | null;
};

/**
 * PESTAÑAS de la sección 3, las tres de ux-9: «Excavadoras» (la categoría
 * `excavadoras`), «Otros» (el resto de categorías) y «Aditamentos» (los
 * equipos marcados con «Pestaña en la portada: Aditamentos», porque en la
 * línea usada no hay categoría de aditamentos). Las etiquetas salen del panel.
 *
 * Solo equipos DISPONIBLES y con categoría poblada (sin ella no hay adónde
 * enlazar). Una pestaña sin equipos no se pinta.
 */
export function pestanasDeUsada(
  equipos: EquiposUsado[],
  etiquetas: EtiquetasPestanas = {},
  por: number = TARJETAS_POR_PESTANA,
): Pestana[] {
  const excavadoras: TarjetaEquipo[] = [];
  const otros: TarjetaEquipo[] = [];
  const aditamentos: TarjetaEquipo[] = [];
  let etiquetaExcavadoras = etiquetas.excavadoras?.trim() || "";

  for (const e of equipos) {
    if (!e.disponible) continue;
    const categoria = poblado<CategoriasUsada>(e.categoria);
    const nombre = e.nombre?.trim();
    if (!categoria?.slug || !nombre) continue;
    const { principal, modelo } = lineasDeNombre(nombre, e.modelo);
    const tarjeta: TarjetaEquipo = {
      id: e.id,
      principal,
      modelo,
      imagen: imagenDeMedia(Array.isArray(e.imagenes) ? e.imagenes[0] : null, nombre),
      ficha: fichaDeEquipo(e),
      href: hrefDeCategoriaUsada(categoria.slug),
    };
    if (e.pestanaPortada === "aditamentos") {
      aditamentos.push(tarjeta);
    } else if (categoria.slug === SLUG_EXCAVADORAS) {
      etiquetaExcavadoras ||= categoria.nombre?.trim() || "Excavadoras";
      excavadoras.push(tarjeta);
    } else {
      otros.push(tarjeta);
    }
  }

  const pestanas: Pestana[] = [
    {
      clave: SLUG_EXCAVADORAS,
      etiqueta: etiquetaExcavadoras || "Excavadoras",
      equipos: excavadoras.slice(0, por),
    },
    { clave: "otros", etiqueta: etiquetas.otros?.trim() || "Otros", equipos: otros.slice(0, por) },
    {
      clave: "aditamentos",
      etiqueta: etiquetas.aditamentos?.trim() || "Aditamentos",
      equipos: aditamentos.slice(0, por),
    },
  ];
  return pestanas.filter((p) => p.equipos.length > 0);
}
