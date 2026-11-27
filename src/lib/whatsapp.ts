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

/*
 * LA URL DE LA PÁGINA EN EL MENSAJE (tanda 26, punto 28; Juan Pablo, 2026-11-27): todo WhatsApp
 * con mensaje escrito acaba, en su propia línea, con la dirección completa de la página desde la
 * que se pulsó. WhatsApp no admite texto enlazado: va la URL a la vista y él la convierte en
 * enlace. Así quien atiende sabe qué máquina o qué listado miraba el visitante.
 */

/** Parámetros de campañas y de anuncios: no dicen nada de la página y no viajan en el mensaje. */
const DE_SEGUIMIENTO = /^(utm_.*|gclid|fbclid)$/i;

/**
 * La dirección completa de una página para el mensaje: la BASE CANÓNICA del sitio (la del SEO,
 * `seoConfig.siteUrl`, no el dominio en el que se esté: al lanzar será partequipos.com sin tocar
 * nada), la ruta con su barra final y la consulta SIN parámetros de seguimiento (los filtros de
 * un listado se quedan). Sin `#`.
 */
export function urlDePagina(base: string, ruta: string, consulta = ""): string {
  const origen = base.trim().replace(/\/+$/, "");
  let camino = (ruta.trim().split(/[?#]/)[0] ?? "") || "/";
  if (!camino.startsWith("/")) camino = `/${camino}`;
  if (!camino.endsWith("/")) camino = `${camino}/`;
  const entrada = new URLSearchParams(consulta.split("#")[0]);
  const salida = new URLSearchParams();
  for (const [clave, valor] of entrada) {
    if (!DE_SEGUIMIENTO.test(clave)) salida.append(clave, valor);
  }
  const filtros = salida.toString();
  return `${origen}${camino}${filtros ? `?${filtros}` : ""}`;
}

/** El mensaje con la URL al final, en su propia línea. Si ya la trae, tal cual (sin duplicar). */
export function mensajeConUrl(mensaje: string, url: string): string {
  const texto = mensaje.trimEnd();
  const u = url.trim();
  if (!u) return texto;
  // Ya la lleva (con o sin la barra final, o con otros parámetros detrás): no se repite.
  if (texto.includes(u) || texto.includes(u.replace(/\/$/, ""))) return texto;
  return texto ? `${texto}\n${u}` : u;
}

/**
 * El mensaje de «Habla con un experto» de una ficha: lo que se mira, con su artículo («la
 * Excavadora…», «el Compactador…») y, en su propia línea, la dirección de la ficha (Juan Pablo,
 * 2026-11-27; antes iba detrás de dos puntos, en la misma línea).
 */
export function mensajeExperto(articulo: string, nombre: string, url: string): string {
  return mensajeConUrl(
    `Hola, quiero hablar con un experto sobre ${articulo} ${nombre.trim()}.`,
    url,
  );
}

/**
 * Un enlace de WhatsApp A LA EMPRESA con mensaje escrito (`wa.me/<número>?text=…`), con la URL de
 * la página al final del mensaje. Cualquier otro enlace vuelve tal cual: uno sin mensaje (no se
 * le inventa), «compartir por WhatsApp» (`wa.me/?text=…`, sin número: ya lleva su URL) u otro
 * sitio.
 */
export function hrefConUrl(href: string, url: string): string {
  let destino: URL;
  try {
    destino = new URL(href);
  } catch {
    return href;
  }
  if (destino.hostname !== "wa.me" || !/^\/\d{10,}\/?$/.test(destino.pathname)) return href;
  const mensaje = destino.searchParams.get("text");
  if (!mensaje?.trim()) return href;
  const conUrl = mensajeConUrl(mensaje, url);
  if (conUrl === mensaje) return href;
  destino.searchParams.set("text", conUrl);
  return destino.toString();
}
