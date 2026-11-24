/**
 * `/.well-known/security.txt` (RFC 9116; tanda 22, punto 35): a quién escribir
 * si alguien encuentra un fallo de seguridad en el sitio. Texto puro, con su
 * prueba; la ruta lo sirve y lo regenera sola.
 */

/** Buzón del cliente para avisos de seguridad (decisión de dirección, 2026-11-23). */
export const CONTACTO_SEGURIDAD = "mailto:info@partequipos.com";

const UN_ANIO_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * El fichero. `Expires` es obligatorio en el RFC y va a un año de `ahora`: la
 * ruta se regenera cada 30 días, así que nunca se sirve uno caducado.
 */
export function securityTxt(ahora: Date): string {
  const caduca = new Date(ahora.getTime() + UN_ANIO_MS).toISOString().replace(/\.\d{3}Z$/, "Z");
  return [
    `Contact: ${CONTACTO_SEGURIDAD}`,
    `Expires: ${caduca}`,
    "Preferred-Languages: es",
    "",
  ].join("\n");
}
