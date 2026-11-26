/**
 * LOS EVENTOS DE LA ANALÍTICA, sin datos personales: ningún evento lleva lo que el visitante
 * escribe en un formulario, ni su teléfono, ni su correo. Todos llevan la página de origen
 * (solo la ruta, sin la query).
 *
 * | Evento                   | Cuándo                                                   | Parámetros             |
 * | ------------------------ | -------------------------------------------------------- | ---------------------- |
 * | `clic_whatsapp`          | Clic en un enlace de WhatsApp de la empresa              | `ubicacion`            |
 * | `clic_llamada`           | Clic en un teléfono (`tel:`)                             | —                      |
 * | `clic_cotizar`           | Clic en un botón «Cotizar…»                              | —                      |
 * | `clic_tienda`            | Clic en un botón «Ver en la tienda» (2026-11-26)         | `elemento`             |
 * | `ficha_tecnica`          | Abrir o descargar una ficha técnica (PDF)                | `accion`, `archivo`    |
 * | `envio_formulario`       | Un formulario enviado con éxito                          | `formulario`           |
 * | `busqueda`               | Una búsqueda (página de resultados o panel de la lupa)   | `termino`, `resultados`|
 */

export type Evento =
  | { nombre: "clic_whatsapp"; parametros: { ubicacion: "flotante" | "boton" } }
  | { nombre: "clic_llamada"; parametros: Record<string, never> }
  | { nombre: "clic_cotizar"; parametros: Record<string, never> }
  | { nombre: "clic_tienda"; parametros: { elemento: string } }
  | { nombre: "ficha_tecnica"; parametros: { accion: "ver" | "descargar"; archivo: string } };

/** Lo que se mira del enlace o botón pulsado. */
export type Pulsado = {
  /** `href` absoluto, si es un enlace. */
  href: string | null;
  /** Texto visible y nombre accesible, juntos. */
  texto: string;
  /** `data-analitica`, si lo lleva. */
  marca: string | null;
  /** Título de la ventana emergente que lo contiene, si está en una. */
  ventana: string;
  /** Abre una ventana emergente (`aria-haspopup="dialog"`). */
  abreVentana: boolean;
};

const HOSTS_WHATSAPP = new Set(["wa.me", "api.whatsapp.com", "web.whatsapp.com"]);

function url(href: string | null): URL | null {
  if (!href) return null;
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

/** El nombre del fichero de una URL, sin la ruta ni la query. */
function fichero(u: URL): string {
  const ultimo = u.pathname.split("/").filter(Boolean).at(-1) ?? "";
  try {
    return decodeURIComponent(ultimo).slice(0, 100);
  } catch {
    return ultimo.slice(0, 100);
  }
}

/** Qué evento es un clic; `null` si no es ninguno de los que se miden. */
export function clasificarClic(p: Pulsado): Evento | null {
  const u = url(p.href);

  if (u && HOSTS_WHATSAPP.has(u.hostname)) {
    // `wa.me/?text=…` (sin número) es «compartir el artículo», no un contacto con la empresa.
    const conNumero = /\d{7,}/.test(u.pathname) || /\d{7,}/.test(u.searchParams.get("phone") ?? "");
    if (!conNumero) return null;
    return {
      nombre: "clic_whatsapp",
      parametros: { ubicacion: p.marca === "whatsapp-flotante" ? "flotante" : "boton" },
    };
  }

  if (u?.protocol === "tel:") return { nombre: "clic_llamada", parametros: {} };

  if (u && /\.pdf$/i.test(u.pathname) && /ficha/i.test(`${p.texto} ${p.ventana}`)) {
    return {
      nombre: "ficha_tecnica",
      parametros: { accion: p.abreVentana ? "ver" : "descargar", archivo: fichero(u) },
    };
  }

  // «Ver en la tienda»: `data-analitica="tienda:<elemento de origen>"` (modelo, categoria,
  // tipo-repuesto o producto). Va antes que «cotizar»: el nombre del botón no lo confunde.
  const tienda = /^tienda:([a-z-]{1,30})$/.exec(p.marca ?? "");
  if (tienda) return { nombre: "clic_tienda", parametros: { elemento: tienda[1]! } };

  if (p.marca === "cotizar" || /^\s*cotiza/i.test(p.texto)) {
    return { nombre: "clic_cotizar", parametros: {} };
  }

  return null;
}

/**
 * El término de una búsqueda, listo para un evento: recortado y en minúsculas. Si parece un dato
 * personal (un correo, o un número largo como un teléfono o un documento), NO se envía: `null`.
 * Los códigos de pieza con letras («zx130-5b», «4tnv98») sí.
 */
export function terminoSeguro(texto: string): string | null {
  const t = texto.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
  if (t.length < 2) return null;
  if (t.includes("@")) return null;
  if (/\d[\d\s().+-]{5,}\d/.test(t) && t.replace(/\D/g, "").length >= 7) return null;
  return t;
}

/** La página de origen de un evento: solo la ruta. */
export const paginaDeOrigen = (ruta: string) => (ruta.split(/[?#]/)[0] ?? "").slice(0, 200) || "/";
