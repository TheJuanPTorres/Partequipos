import type { Sede } from "@/payload-types";

import { hrefTelefono } from "../pie";
import { coordenadasEnColombia } from "../fields/reglasPortada";
import { enlaceDeLinea, urlPorDireccion, type OrigenEnlaceMaps } from "../sedes/enlaceMaps";
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
  /** «Ver en Google Maps»: el enlace de la línea, sus coordenadas, las de la sede o la dirección. */
  mapa: { href: string; origen: OrigenEnlaceMaps };
};

/** Búsqueda de Google Maps por dirección: el último recurso de `enlaceDeLinea` (ronda 18, t6). */
export const urlGoogleMaps = urlPorDireccion;

export type TipoDeSede = "principal" | "secundaria";

/** «Sede principal» / «Sede secundaria»: lo que dice la lista y el nombre accesible del pin. */
export const ETIQUETA_TIPO: Record<TipoDeSede, string> = {
  principal: "Sede principal",
  secundaria: "Sede secundaria",
};

/** Sin valor (una sede anterior al campo) o con uno desconocido: secundaria, el valor por defecto. */
export function tipoDeSede(valor: string | null | undefined): TipoDeSede {
  return valor === "principal" ? "principal" : "secundaria";
}

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
  tipo: TipoDeSede;
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
    if (!coordenadasEnColombia(lat, lng)) {
      // Una sede mal puesta rompería el encuadre del mapa: se omite y se avisa.
      console.error(
        `[sedes] la sede «${nombre}» tiene coordenadas fuera de Colombia (${lat}, ${lng}) y no sale en el mapa. Corrige la latitud y la longitud en el panel (la longitud es negativa).`,
      );
      return [];
    }
    const foto = imagenDeMedia(s.foto, `Sede ${nombre}`);
    const conDatos = (s.lineas ?? []).filter((l) => l.linea?.trim() && l.direccion?.trim());
    const lineas = conDatos.flatMap((l): LineaSede[] => {
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
          mapa: enlaceDeLinea({
            enlace: l.enlaceMaps,
            coordenadas: l.coordenadas,
            direccion,
            ciudad,
          }),
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
        tipo: tipoDeSede(s.tipo),
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
