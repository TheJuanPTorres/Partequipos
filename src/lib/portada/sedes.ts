import type { Sede } from "@/payload-types";

import { hrefTelefono } from "../pie";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * SECCIÓN 9 DE LA PORTADA — sedes (fase G, docs/diseno/decisiones-home-ux9.md
 * §23). Lógica pura: lo que se pinta a partir de la colección `sedes`.
 */

export type LineaSede = {
  /** «Maquinaria», o «Maquinaria · Guarne» si la línea está en otro municipio. */
  etiqueta: string;
  direccion: string;
  telefono: { texto: string; href: string } | null;
};

export type SedeLista = {
  id: number;
  /** «Sede Bogotá». */
  titulo: string;
  /** «Bogotá, Cundinamarca». */
  etiqueta: string;
  /** Lo que se escribe junto al pin del globo: la ciudad. */
  ciudad: string;
  lat: number;
  lng: number;
  foto: ImagenLista | null;
  lineas: LineaSede[];
};

/** Las sedes de la portada, en su orden. Sin nombre, ciudad o coordenadas válidas, no salen. */
export function sedesDePortada(sedes: Sede[]): SedeLista[] {
  return sedes.flatMap((s) => {
    const nombre = s.nombre?.trim();
    const ciudad = s.ciudad?.trim();
    const departamento = s.departamento?.trim();
    const lat = s.latitud;
    const lng = s.longitud;
    if (!nombre || !ciudad || !departamento) return [];
    if (typeof lat !== "number" || typeof lng !== "number") return [];
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return [];
    const foto = imagenDeMedia(s.foto, `Sede ${nombre}`);
    const lineas = (s.lineas ?? []).flatMap((l): LineaSede[] => {
      const linea = l.linea?.trim();
      const direccion = l.direccion?.trim();
      if (!linea || !direccion) return [];
      const localidad = l.localidad?.trim();
      const tel = l.telefono?.trim();
      return [
        {
          etiqueta: localidad ? `${linea} · ${localidad}` : linea,
          direccion,
          telefono: tel ? { texto: tel, href: hrefTelefono(tel) } : null,
        },
      ];
    });
    return [
      {
        id: s.id,
        titulo: `Sede ${nombre}`,
        etiqueta: `${ciudad}, ${departamento}`,
        ciudad,
        lat,
        lng,
        foto,
        lineas,
      },
    ];
  });
}

/**
 * ¿Hay globo? Solo con un token público de Mapbox (`pk.`) en el entorno. Sin
 * él, la sección es la lista de sedes, completa y sin huecos.
 */
export function tokenMapbox(valor: string | undefined): string | null {
  const t = valor?.trim();
  return t && /^pk\.[\w-]+\.[\w-]+$/.test(t) ? t : null;
}
