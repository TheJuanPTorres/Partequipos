import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import { rutas } from "../routes";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";
import { equiposPorTipo } from "./paginaMarca";

/**
 * ÍNDICE DE MARCAS DE MAQUINARIA NUEVA (2026-10-18, diseño propio, sin plantilla
 * de Andrés). Lógica pura: de las marcas, los tipos y los equipos, la vista de
 * cada marca CON equipos (las vacías no salen): logo, foto, descripción, número
 * de equipos y sus tipos con equipos, con enlace. Nada inventado: todo sale del
 * panel. Ver docs/diseno/decisiones-indice-marcas-nueva.md.
 */

export type TipoDeMarca = { id: number; nombre: string; href: string; equipos: number };

export type MarcaDelIndice = {
  id: number;
  nombre: string;
  href: string;
  descripcion: string;
  logo: ImagenLista | null;
  foto: ImagenLista | null;
  equipos: number;
  tipos: TipoDeMarca[];
};

const idDe = (r: unknown): number | null =>
  typeof r === "number" ? r : r && typeof r === "object" && "id" in r ? idDe(r.id) : null;

/**
 * Las marcas con al menos un equipo, en su orden (`orden` ascendente; sin
 * orden, al final y por nombre). Los tipos de cada una, los que tienen equipos
 * (un «paraguas» suma los de sus subtipos, la regla de las páginas de marca).
 */
export function marcasDelIndice(
  marcas: MarcasMaquinaria[],
  tipos: TiposMaquinaria[],
  equipos: EquiposNuevo[],
  ordenDe: (m: MarcasMaquinaria) => number | null | undefined = (m) => m.ordenPortada,
): MarcaDelIndice[] {
  const porTipo = equiposPorTipo(equipos, tipos);
  const marcaDeTipo = new Map(tipos.map((t) => [t.id, idDe(t.marca)]));
  const equiposPorMarca = new Map<number, number>();
  // Sin «Foto de la tarjeta», la primera foto de su primer equipo (la regla de las páginas de marca).
  const primeraFoto = new Map<number, ImagenLista>();
  for (const e of equipos) {
    const m = idDe(e.marca) ?? marcaDeTipo.get(idDe(e.tipo) ?? -1) ?? null;
    if (m === null) continue;
    equiposPorMarca.set(m, (equiposPorMarca.get(m) ?? 0) + 1);
    if (!primeraFoto.has(m)) {
      for (const img of e.imagenes ?? []) {
        const f = imagenDeMedia(img, "");
        if (f) {
          primeraFoto.set(m, f);
          break;
        }
      }
    }
  }
  const orden = (m: MarcasMaquinaria) => ordenDe(m) ?? Number.POSITIVE_INFINITY;
  return marcas
    .filter((m) => (equiposPorMarca.get(m.id) ?? 0) > 0 && m.slug?.trim())
    .sort((a, b) => orden(a) - orden(b) || a.nombre.localeCompare(b.nombre, "es"))
    .map((m) => ({
      id: m.id,
      nombre: m.nombre.trim(),
      href: `${rutas.marcaMaquinaria(m.slug)}/`,
      descripcion: m.descripcion?.trim() ?? "",
      logo: imagenDeMedia(m.logo, `Logo de ${m.nombre.trim()}`),
      foto: imagenDeMedia(m.imagenTarjeta, "") ?? primeraFoto.get(m.id) ?? null,
      equipos: equiposPorMarca.get(m.id) ?? 0,
      tipos: tipos
        .filter((t) => idDe(t.marca) === m.id && (porTipo.get(t.id) ?? 0) > 0)
        .map((t) => ({
          id: t.id,
          nombre: t.nombre.trim(),
          href: `${rutas.tipoMaquinaria(m.slug, t.slug)}/`,
          equipos: porTipo.get(t.id) ?? 0,
        })),
    }));
}

/** Los totales de la cabecera: marcas, equipos y tipos (sin contar dos veces un equipo). */
export function totalesDelIndice(marcas: MarcaDelIndice[]) {
  return {
    marcas: marcas.length,
    equipos: marcas.reduce((s, m) => s + m.equipos, 0),
    tipos: marcas.reduce((s, m) => s + m.tipos.length, 0),
  };
}
