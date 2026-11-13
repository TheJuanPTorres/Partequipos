import { coordenadasEnColombia, validarLatitud, validarLongitud } from "../fields/reglasPortada";

/**
 * «VER EN GOOGLE MAPS» DE LAS SEDES (ronda 18, t6). Antes el botón buscaba la dirección escrita
 * como texto, y Google acertaba a veces: «Calle 6 Nro 26-73, Bogotá» puede caer en otra calle.
 * Ahora cada línea de una sede puede llevar su enlace de «Compartir» de Google Maps o sus
 * coordenadas, y el botón usa, por orden:
 *
 * 1. el enlace de la línea;
 * 2. las coordenadas de la línea;
 * 3. la dirección escrita, como antes.
 *
 * Las coordenadas de la SEDE no se usan (dirección, 2026-11-13): son el punto del mapa de la
 * portada y en varias sedes es el centro de la ciudad, peor que buscar la dirección.
 */

/** `google.com`, `google.com.co`, `google.co`… con o sin `www.`/`maps.`. */
const HOST_GOOGLE = /^(?:www\.|maps\.)?google\.(?:com|co|com\.co)$/;

/** La URL, si es un enlace de Google Maps válido (https); si no, `null`. */
export function enlaceDeGoogleMaps(valor: unknown): URL | null {
  if (typeof valor !== "string") return null;
  let url: URL;
  try {
    url = new URL(valor.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (host === "maps.app.goo.gl") return url.pathname.length > 1 ? url : null;
  if (host === "goo.gl") return url.pathname.startsWith("/maps/") ? url : null;
  if (!HOST_GOOGLE.test(host)) return null;
  // maps.google.com sirve el mapa en cualquier ruta; www.google.* solo bajo /maps.
  if (host.startsWith("maps.")) return url;
  return url.pathname === "/maps" || url.pathname.startsWith("/maps/") ? url : null;
}

/** Validación del campo «Enlace de Google Maps» (opcional). */
export function validarEnlaceMaps(valor: unknown): true | string {
  if (valor === null || valor === undefined || (typeof valor === "string" && !valor.trim())) {
    return true;
  }
  if (enlaceDeGoogleMaps(valor)) return true;
  return "Pega el enlace de «Compartir» de Google Maps (empieza por https://maps.app.goo.gl/ o https://www.google.com/maps/). No sirven enlaces de otros sitios.";
}

/** Coordenadas escritas «lat, lng» (con punto decimal, como las copia Google Maps). */
export function leerCoordenadas(valor: unknown): { lat: number; lng: number } | null {
  if (typeof valor !== "string") return null;
  const m = valor.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return { lat: Number(m[1]), lng: Number(m[2]) };
}

/** Validación del campo «Coordenadas» (opcional), con los mensajes de latitud y longitud del #430. */
export function validarCoordenadas(valor: unknown): true | string {
  if (valor === null || valor === undefined || (typeof valor === "string" && !valor.trim())) {
    return true;
  }
  const c = leerCoordenadas(valor);
  if (!c) {
    return "Escribe latitud y longitud separadas por una coma, con punto decimal. Ej. 4.6467, -74.1287 (es lo que copia Google Maps al hacer clic derecho en el punto).";
  }
  const lat = validarLatitud(c.lat);
  if (lat !== true) return lat;
  const lng = validarLongitud(c.lng);
  if (lng !== true) return lng;
  return true;
}

/** Búsqueda de Google Maps por un punto (sin clave de API). */
export function urlPorCoordenadas(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Búsqueda de Google Maps por dirección (sin clave de API): «dirección, ciudad». La de siempre. */
export function urlPorDireccion(direccion: string, ciudad: string): string {
  const consulta = `${direccion.trim()}, ${ciudad.trim()}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
}

export type OrigenEnlaceMaps = "enlace" | "coordenadas" | "direccion";

/** El enlace del botón de una línea y de dónde sale (el origen, para el inventario y las pruebas). */
export function enlaceDeLinea(entrada: {
  enlace?: string | null;
  coordenadas?: string | null;
  direccion: string;
  ciudad: string;
}): { href: string; origen: OrigenEnlaceMaps } {
  const enlace = enlaceDeGoogleMaps(entrada.enlace);
  if (enlace) return { href: enlace.toString(), origen: "enlace" };
  const c = leerCoordenadas(entrada.coordenadas);
  if (c && coordenadasEnColombia(c.lat, c.lng)) {
    return { href: urlPorCoordenadas(c.lat, c.lng), origen: "coordenadas" };
  }
  return { href: urlPorDireccion(entrada.direccion, entrada.ciudad), origen: "direccion" };
}
