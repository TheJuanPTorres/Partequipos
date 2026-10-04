/**
 * Enlace a WhatsApp construido desde el número de la empresa.
 *
 * El número NO se escribe aquí: lo pasa quien llama, desde `getEmpresa()`
 * (global `seo`, editable en el panel, con respaldo en `seoConfig`).
 *
 * wa.me exige el número en formato internacional sin `+`, espacios ni signos.
 */
export type EnlaceWhatsApp = { href: string; etiqueta: string };

export function enlaceWhatsApp(numero: string, mensaje?: string): EnlaceWhatsApp | undefined {
  const digitos = numero.replace(/\D/g, "");
  // Sin teléfono no se inventa un enlace: se omite, como el resto de datos
  // pendientes de confirmar.
  if (digitos.length < 10) return undefined;

  const url = new URL(`https://wa.me/${digitos}`);
  if (mensaje) url.searchParams.set("text", mensaje);

  return { href: url.toString(), etiqueta: numero };
}
