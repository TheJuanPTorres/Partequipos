import { colorDeMarca, tintaSobre } from "@/lib/marca/colorMarca";
import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import { imagenDeMedia, type ImagenLista } from "../utils/relations";
import { primeraFotoPorTipo } from "./paginaMarca";
import type { SeccionDeTipo } from "./paginaMarcaAndres";

/**
 * Lógica pura de la PÁGINA DE MARCA con el diseño «KIT DE MARCA» (2026-10-25, prototipo del
 * cliente portado): cabecera partida, píldora de navegación, cinta de tipos, una sección por tipo
 * y el emblema de fondo. Todo sale del panel: la marca (color, logo, foto de la cabecera,
 * emblema), sus tipos (render recortado) y sus equipos visibles. Los componentes están en
 * `src/components/nueva/kit/`.
 */

/** Color de la marca y la tinta legible sobre él. Sin color en el panel, el naranja de la barra de marcas. */
export function acentoDeMarca(
  marca: Pick<MarcasMaquinaria, "colorMarca">,
  respaldo: string,
): { acento: string; tinta: string } {
  const acento = colorDeMarca(marca.colorMarca) ?? respaldo;
  return { acento, tinta: tintaSobre(acento) };
}

/** La foto de fondo de la cabecera y el emblema (solo con la casilla marcada y la imagen subida). */
export function mediosDeKit(marca: Pick<MarcasMaquinaria, "kit">): {
  fondo: ImagenLista | null;
  emblema: ImagenLista | null;
} {
  const kit = marca.kit;
  return {
    fondo: imagenDeMedia(kit?.fotoCabecera, "") ?? null,
    emblema: kit?.mostrarEmblema ? (imagenDeMedia(kit?.emblema, "") ?? null) : null,
  };
}

/**
 * El render de cada tipo para la cinta y la franja de su sección: el «Render recortado» del
 * panel; sin él, la imagen de la tarjeta del tipo; sin ella, la primera foto de sus equipos.
 * `recortado` dice si es el render de verdad (la cinta lo apoya en el suelo, sin recortes) o una
 * foto de respaldo (se encuadra para llenar).
 */
export function rendersDeTipos(
  tipos: TiposMaquinaria[],
  equipos: EquiposNuevo[],
): Map<number, { imagen: ImagenLista; recortado: boolean }> {
  const fotos = primeraFotoPorTipo(equipos, tipos);
  const salida = new Map<number, { imagen: ImagenLista; recortado: boolean }>();
  for (const t of tipos) {
    const render = imagenDeMedia(t.render, "");
    if (render) {
      salida.set(t.id, { imagen: render, recortado: true });
      continue;
    }
    const respaldo = imagenDeMedia(t.imagen, "") ?? fotos.get(t.id) ?? null;
    if (respaldo) salida.set(t.id, { imagen: respaldo, recortado: false });
  }
  return salida;
}

/** Las secciones tal como las pinta el kit: con su número («01») y la clave de su ancla. */
export type SeccionKit = SeccionDeTipo & {
  numero: string;
  render: { imagen: ImagenLista; recortado: boolean } | null;
  /** Desde qué ancho de pantalla caben la franja y la máquina al lado del título (0 = nunca). */
  franjaDesde: number;
};

/** Cuántos tipos hacen falta como mínimo para que la cinta llene el ancho (la lista se repite). */
export const MIN_TARJETAS_CINTA = 7;

/** Ancho de una tarjeta de la cinta, con su separación (17 rem; `.cintaItem` del CSS). */
export const REM_TARJETA_CINTA = 17;

/** Con menos tipos que estos no hay bucle que valga: la cinta se desplaza a mano. */
export const MIN_TIPOS_BUCLE = 3;

export type ModoCinta = "quieta" | "manual" | "bucle";

/**
 * Cómo va la cinta de tipos según el ancho (Juan Pablo, 2026-10-26; regla automática, no por
 * marca): si los tipos NO llenan el ancho disponible, QUIETA y centrada (sin copias ni
 * animación); si lo llenan con pocos tipos (menos de {@link MIN_TIPOS_BUCLE}), un bucle repetiría
 * las mismas tarjetas, así que se desliza A MANO; si lo llenan con varios, BUCLE como siempre.
 */
export function modoDeCinta({
  tipos,
  anchoDisponible,
  anchoTarjeta,
}: {
  tipos: number;
  anchoDisponible: number;
  anchoTarjeta: number;
}): ModoCinta {
  if (tipos * anchoTarjeta <= anchoDisponible) return "quieta";
  return tipos < MIN_TIPOS_BUCLE ? "manual" : "bucle";
}

/** Cuántas veces se repite la lista de tipos en una vuelta de la cinta para llenar el ancho. */
export function repeticionesDeCinta(tipos: number): number {
  return tipos <= 0 ? 0 : Math.ceil(MIN_TARJETAS_CINTA / tipos);
}

/**
 * Cuántos modelos van en la primera fila de una sección: con 4 son 2 + 2, el resto de a 3 como
 * mucho. Decide si la franja diagonal cae sobre una tarjeta (solo con una fila de 3).
 */
export function enFilaDe(cantidad: number): number {
  return cantidad === 4 ? 2 : Math.min(cantidad, 3);
}

/**
 * Anchos de pantalla desde los que caben la franja y la máquina al lado del título centrado
 * (300 px pegados al borde derecho): el título mide unos 33 px por letra más ~160 px de número
 * y barra, y la sección es el 90 % de la pantalla.
 */
const ANCHOS_FRANJA = [1280, 1440, 1600, 1920] as const;

export function franjaDesde(nombre: string, cantidad: number): number {
  // La franja tiene que caer sobre una tarjeta: con la fila centrada (1 o 2), debajo del borde
  // derecho no hay ninguna, y ahí va solo el enlace.
  if (enFilaDe(cantidad) !== 3) return 0;
  const minimo = (33 * nombre.length + 160 + 620) / 0.9;
  return ANCHOS_FRANJA.find((px) => minimo <= px) ?? 0;
}

/**
 * Qué columna ocupa cada tarjeta en la rejilla de 6 columnas (tablet: 4) para centrar la última
 * fila (regla del kit, la misma del #281): con 4 en escritorio van de a 2 (columnas 2–3 y 4–5); si
 * sobra una va al centro (3–4) y si sobran dos arrancan en la 2. En tablet (de a 2) la última
 * impar se centra.
 */
export function columnaDeTarjeta(
  i: number,
  n: number,
): { escritorio: number | null; tablet: number | null } {
  let escritorio: number | null = null;
  if (n === 4) escritorio = i % 2 === 0 ? 2 : 4;
  else if (n % 3 === 1 && i === n - 1) escritorio = 3;
  else if (n % 3 === 2 && i === n - 2) escritorio = 2;
  const tablet = n % 2 === 1 && i === n - 1 ? 2 : null;
  return { escritorio, tablet };
}

/** Une las secciones de la marca con su número, su render y desde qué ancho cabe la franja. */
export function seccionesKit(
  secciones: SeccionDeTipo[],
  tipos: TiposMaquinaria[],
  renders: Map<number, { imagen: ImagenLista; recortado: boolean }>,
): SeccionKit[] {
  const idDeClave = (clave: string) => Number(clave.replace(/^tipo-/, ""));
  return secciones.map((s, n) => {
    const tipo = tipos.find((t) => t.id === idDeClave(s.clave));
    return {
      ...s,
      numero: String(n + 1).padStart(2, "0"),
      render: tipo ? (renders.get(tipo.id) ?? null) : null,
      franjaDesde: franjaDesde(s.titulo, s.tarjetas.length),
    };
  });
}
