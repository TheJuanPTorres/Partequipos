import { seoConfig } from "@/lib/seo/config";

/**
 * Enlace a WhatsApp construido desde el teléfono de `seoConfig`.
 *
 * El número NO se escribe aquí: sale de la única fuente de datos de negocio
 * (CLAUDE.md §5). Si el cliente confirma otro teléfono —está pendiente, §10.3—
 * cambia en un sitio y se arrastra a todos los enlaces.
 *
 * wa.me exige el número en formato internacional sin `+`, espacios ni signos.
 */
export type EnlaceWhatsApp = { href: string; etiqueta: string };

export function enlaceWhatsApp(mensaje?: string): EnlaceWhatsApp | undefined {
  const digitos = seoConfig.contact.phone.replace(/\D/g, "");
  // Sin teléfono no se inventa un enlace: se omite, como el resto de datos
  // pendientes de confirmar.
  if (digitos.length < 10) return undefined;

  const url = new URL(`https://wa.me/${digitos}`);
  if (mensaje) url.searchParams.set("text", mensaje);

  return { href: url.toString(), etiqueta: seoConfig.contact.phone };
}
