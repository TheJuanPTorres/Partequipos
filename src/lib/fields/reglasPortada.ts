/**
 * Reglas puras de los campos de la portada (fase B de la home de ux-9), para
 * poder probarlas sin Payload.
 */

/**
 * Enlace de un campo editable: ruta interna (`/contactanos/`) o `https://`.
 * Se rechaza `//otro.com` (URL relativa al protocolo: sale del sitio aunque
 * empiece por barra) y cualquier otro esquema (`javascript:`, `http:`).
 */
export function validarEnlace(valor: unknown): true | string {
  if (valor === undefined || valor === null || valor === "") return true;
  if (typeof valor !== "string") return "El enlace tiene que ser texto.";
  const v = valor.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  if (/^https:\/\/[^\s/]+\.[^\s]+$/i.test(v)) return true;
  return "Usa una ruta del sitio que empiece por «/» (p. ej. /contactanos/) o una dirección https://.";
}

/**
 * Coordenadas de una sede: el rango razonable de Colombia con sus islas
 * (San Andrés, Providencia). Una sede fuera de él es casi siempre un error de
 * escritura (el signo menos de la longitud, o latitud y longitud cambiadas) y
 * rompería el encuadre del mapa de sedes (2026-11-05, Caucasia con la longitud
 * positiva).
 */
export const RANGO_COLOMBIA = { latMin: -5, latMax: 14, lngMin: -83, lngMax: -66 } as const;

export function coordenadasEnColombia(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= RANGO_COLOMBIA.latMin &&
    lat <= RANGO_COLOMBIA.latMax &&
    lng >= RANGO_COLOMBIA.lngMin &&
    lng <= RANGO_COLOMBIA.lngMax
  );
}

export function validarLatitud(valor: unknown): true | string {
  if (typeof valor !== "number" || !Number.isFinite(valor))
    return "La latitud tiene que ser un número.";
  if (valor >= RANGO_COLOMBIA.latMin && valor <= RANGO_COLOMBIA.latMax) return true;
  return "La latitud de Colombia va entre −5 y 14. ¿Pusiste la longitud en este campo? La latitud va primero (Bogotá: 4,65).";
}

export function validarLongitud(valor: unknown): true | string {
  if (typeof valor !== "number" || !Number.isFinite(valor))
    return "La longitud tiene que ser un número.";
  if (valor >= RANGO_COLOMBIA.lngMin && valor <= RANGO_COLOMBIA.lngMax) return true;
  if (valor > 0 && -valor >= RANGO_COLOMBIA.lngMin && -valor <= RANGO_COLOMBIA.lngMax) {
    return `En Colombia la longitud es negativa. ¿Falta el signo menos? Prueba con −${valor}.`;
  }
  return "La longitud de Colombia va entre −83 y −66 (Bogotá: −74,07). Revisa el valor y el signo menos.";
}

/*
 * TESTIMONIOS — un testimonio no se publica sin autorización de uso
 * (docs/diseno/decisiones-home-ux9.md, licencia L4; Ley 1581 de 2012).
 */

/*
 * EXCEPCIÓN (2026-10-16, decisión de dirección): un testimonio en VÍDEO que el
 * cliente ya publicó en su canal de YouTube (`videoDelCliente`) no necesita la
 * autorización de uso ni la frase: la persona ya dio la cara en el canal del
 * cliente. Cualquier otro testimonio sigue exigiendo la autorización.
 */

/** ¿Está libre de pedir autorización? Solo con la casilla Y un enlace de YouTube válido. */
export function exentoDeAutorizacion(videoDelCliente: unknown, youtubeValido: boolean): boolean {
  return videoDelCliente === true && youtubeValido;
}

/** Validación de la casilla «vídeo del cliente»: sin enlace de YouTube no vale. */
export function validarVideoDelCliente(valor: unknown, youtubeValido: boolean): true | string {
  if (valor !== true || youtubeValido) return true;
  return "Para marcar el vídeo del cliente hace falta el enlace de YouTube del vídeo.";
}

/** La frase es obligatoria salvo en un vídeo ya publicado por el cliente. */
export function validarCita(cita: unknown, exento: boolean): true | string {
  if (exento) return true;
  return typeof cita === "string" && cita.trim() ? true : "Escribe el testimonio.";
}

/** Validación del campo `publicado`: no se puede marcar sin autorización (o sin la excepción). */
export function validarPublicacionTestimonio(
  publicado: unknown,
  autorizacionUso: unknown,
  exento = false,
): true | string {
  if (publicado !== true) return true;
  return autorizacionUso === true || exento
    ? true
    : "No se puede publicar sin la autorización de uso marcada: el testimonio es de una persona real.";
}

/**
 * Estado que se GUARDA. Aunque la validación falle o se salte (API local con
 * datos a mano), el servidor nunca deja publicado un testimonio sin
 * autorización (salvo la excepción del vídeo del cliente): si se retira la
 * autorización, se despublica.
 */
export function publicadoEfectivo(
  publicado: unknown,
  autorizacionUso: unknown,
  exento = false,
): boolean {
  return publicado === true && (autorizacionUso === true || exento);
}

/**
 * Lo que puede leer quien NO es personal del panel. Se exporta para que las
 * consultas de la API local —que por defecto se saltan el control de acceso—
 * usen exactamente el mismo filtro.
 */
export const TESTIMONIOS_PUBLICOS = {
  and: [
    { publicado: { equals: true } },
    { or: [{ autorizacionUso: { equals: true } }, { videoDelCliente: { equals: true } }] },
  ],
} as const;
