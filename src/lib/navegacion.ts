/**
 * Utilidades de navegación. Los menús ya no están aquí: la cabecera sale del
 * global `cabecera` y los enlaces legales del global `pie` (panel).
 */

/** Construye el enlace de WhatsApp a partir del teléfono publicado. */
export function enlaceWhatsApp(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, "");
  return `https://wa.me/${soloDigitos}`;
}
