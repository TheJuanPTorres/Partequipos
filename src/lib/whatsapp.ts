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

/**
 * Mensaje de WhatsApp de un formulario con el contexto de su página (2026-10-27): lo que se consulta
 * si hay referencia (el equipo, el modelo) y, si no, el título del formulario («Contacto sobre
 * repuestos Hitachi», «Contáctanos»…).
 */
export function mensajeWhatsApp(referencia: string | undefined, titulo: string): string {
  const ref = referencia?.trim();
  if (ref) return `Hola, quiero información sobre ${ref}.`;
  const t = titulo.trim();
  return t
    ? `Hola, les escribo desde la página «${t}» de Partequipos.`
    : "Hola, quiero información.";
}

/** El mismo enlace con un mensaje ya escrito (`?text=`), p. ej. el producto que se cotiza. */
export function conMensaje(enlace: EnlaceWhatsApp, mensaje: string): EnlaceWhatsApp {
  const url = new URL(enlace.href);
  url.searchParams.set("text", mensaje);
  return { ...enlace, href: url.toString() };
}
