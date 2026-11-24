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
 * si hay referencia (el equipo, el modelo) o, si no, el tema de un título «Contacto sobre …»
 * («Contacto sobre repuestos Hitachi»). Con otro título («Escríbenos» en Contáctanos, editable en
 * el panel), un saludo neutro: el título no siempre dice de qué se trata.
 */
export function mensajeWhatsApp(
  referencia: string | undefined,
  titulo: string,
  mensajeInicial?: string,
): string {
  // El texto con el que empieza «¿Qué necesitas?» (el grupo o la pieza que se cotiza) manda: es
  // lo que el visitante ve en el formulario, y WhatsApp tiene que decir lo mismo (punto 17).
  const inicial = mensajeInicial?.trim();
  if (inicial) return `Hola, ${inicial.charAt(0).toLowerCase()}${inicial.slice(1)}`;
  const tema = referencia?.trim() || /^contacto sobre\s+(.+)$/i.exec(titulo.trim())?.[1]?.trim();
  return tema ? `Hola, quiero información sobre ${tema}.` : "Hola, quiero información.";
}

/**
 * El enlace del botón flotante con lo que el visitante está mirando (punto 28): «… Estoy viendo:
 * Excavadora Hitachi ZX130-5B 2024.». Sin contexto, el enlace tal cual.
 */
export function hrefConContexto(href: string, contexto: string | null | undefined): string {
  const c = contexto?.trim();
  if (!c) return href;
  const url = new URL(href);
  const base = url.searchParams.get("text")?.trim();
  url.searchParams.set("text", `${base ? `${base} ` : "Hola, "}Estoy viendo: ${c}.`);
  return url.toString();
}

/** El mismo enlace con un mensaje ya escrito (`?text=`), p. ej. el producto que se cotiza. */
export function conMensaje(enlace: EnlaceWhatsApp, mensaje: string): EnlaceWhatsApp {
  const url = new URL(enlace.href);
  url.searchParams.set("text", mensaje);
  return { ...enlace, href: url.toString() };
}
