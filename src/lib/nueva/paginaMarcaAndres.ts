import { MAX_DESTACADAS, destacadas, type DatoDestacado } from "@/lib/maquinaria/fichaTecnica";
import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import { rutas } from "../routes";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * Lógica pura de la PÁGINA DE MARCA de maquinaria nueva con la plantilla de Andrés
 * («Maquinaria Nueva Marca», elementor 4023, 2026-10-20): cabecera con el logo,
 * «Nuestra línea de equipos <marca> incluye:» con una franja en movimiento de sus
 * tipos, una sección por tipo con las tarjetas de sus equipos, el contacto y los
 * testimonios. Aditamentos sigue con la suya (`paginaAditamentos.ts`).
 */

/** Textos de la plantilla (los de Andrés); `{marca}` se sustituye por el nombre. */
export const TEXTOS_MARCA_NUEVA = {
  intro: "Nuestra línea de equipos {marca} incluye:",
  cierre:
    "Tecnología de punta, bajo consumo, máxima productividad y respaldo oficial.\nCobertura nacional, servicio técnico, repuestos originales y financiación flexible.",
} as const;

/** Un tipo muestra como mucho 6 equipos; con más, «Ver todos» lleva a su página. */
export const MAX_EQUIPOS_POR_TIPO = 6;

export type TextosMarcaNueva = { intro: string; cierre: string };

/** Los textos desde el panel; uno vacío, el de siempre. */
export function textosMarcaNueva(
  marca: Pick<MarcasMaquinaria, "nombre" | "plantillaLinea">,
): TextosMarcaNueva {
  const p = marca.plantillaLinea ?? {};
  const o = (v: string | null | undefined, por: string) => v?.trim() || por;
  return {
    intro: o(p.intro, TEXTOS_MARCA_NUEVA.intro).replaceAll("{marca}", marca.nombre.trim()),
    cierre: o(p.cierre, TEXTOS_MARCA_NUEVA.cierre),
  };
}

/**
 * Los datos de la tarjeta: los marcados «Destacar» en la ficha técnica (hasta 4); si el
 * equipo no tiene ninguno marcado, peso, potencia y motor, como las tarjetas de los listados.
 */
export function datosDeTarjeta(filas: EquiposNuevo["fichaTecnica"]): DatoDestacado[] {
  const marcados = destacadas(filas, MAX_DESTACADAS);
  if (marcados.length > 0) return marcados;
  const patrones: [RegExp, DatoDestacado["icono"]][] = [
    [/^peso\s+(operativo|operacional|de\s+operaci[oó]n|en\s+funcionamiento)/i, "peso"],
    [/potencia/i, "potencia"],
    [/^motor\b/i, "motor"],
  ];
  return patrones.flatMap(([patron, icono]) => {
    const fila = (filas ?? []).find((f) => f.etiqueta && patron.test(f.etiqueta));
    const valor = fila?.valor?.trim();
    return fila && valor ? [{ etiqueta: fila.etiqueta!.trim(), valor, icono }] : [];
  });
}

export type TarjetaEquipo = {
  id: number;
  nombre: string;
  href: string;
  foto: ImagenLista | null;
  /** 3 o 4 datos «Destacar» de su ficha técnica. */
  datos: DatoDestacado[];
};

export type SeccionDeTipo = {
  clave: string;
  titulo: string;
  /** Página del tipo, para «Ver todos». */
  href: string;
  total: number;
  tarjetas: TarjetaEquipo[];
  hayMas: boolean;
};

export type EnlaceDeTipo = { clave: string; nombre: string; href: string };

const idDe = (v: number | { id: number } | null | undefined) => (typeof v === "number" ? v : v?.id);

/**
 * La franja en movimiento: los tipos de la marca con equipos (un «paraguas» cuenta
 * por los de sus subtipos, como en el índice de tipos), enlazados a su página.
 */
export function enlacesDeTipos(
  marca: Pick<MarcasMaquinaria, "slug">,
  tipos: TiposMaquinaria[],
  conEquipos: Map<number, number>,
): EnlaceDeTipo[] {
  return tipos
    .filter((t) => (conEquipos.get(t.id) ?? 0) > 0 && t.nombre?.trim() && t.slug?.trim())
    .map((t) => ({
      clave: `tipo-${t.id}`,
      nombre: t.nombre.trim(),
      href: `${rutas.tipoMaquinaria(marca.slug, t.slug)}/`,
    }));
}

/**
 * Una sección por tipo CON equipos directos (un tipo vacío, o que solo agrupa otros,
 * no sale; sus subtipos sí, cada uno la suya), en el orden de los tipos. `equipos`
 * llega ordenado por nombre.
 */
export function seccionesDeTipos(
  marca: Pick<MarcasMaquinaria, "slug">,
  tipos: TiposMaquinaria[],
  equipos: EquiposNuevo[],
): SeccionDeTipo[] {
  return tipos.flatMap((tipo) => {
    const suyos = equipos.filter((e) => idDe(e.tipo) === tipo.id);
    if (suyos.length === 0) return [];
    const tarjetas = suyos.slice(0, MAX_EQUIPOS_POR_TIPO).map((e) => ({
      id: e.id,
      nombre: e.nombre.trim(),
      href: `${rutas.equipoNuevo(marca.slug, tipo.slug, e.slug)}/`,
      foto: (e.imagenes ?? []).map((i) => imagenDeMedia(i, "")).find(Boolean) ?? null,
      datos: datosDeTarjeta(e.fichaTecnica),
    }));
    return [
      {
        clave: `tipo-${tipo.id}`,
        titulo: tipo.nombre.trim(),
        href: `${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`,
        total: suyos.length,
        tarjetas,
        hayMas: suyos.length > MAX_EQUIPOS_POR_TIPO,
      },
    ];
  });
}
