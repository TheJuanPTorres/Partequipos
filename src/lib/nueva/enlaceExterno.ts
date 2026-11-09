import type { Where } from "payload";

/**
 * MARCA DE MAQUINARIA NUEVA SIN PÁGINA PROPIA (2026-11-03, dirección: LiuGong → su distribuidor
 * oficial, maquitecno.co). El campo «Enlace externo» de `marcas-maquinaria`: si está relleno, la
 * marca NO tiene página en este sitio y sus enlaces (megamenú e índice de marcas) van a esa
 * dirección, en pestaña nueva. En la banda de logos de la portada su logo NO es enlace, como los
 * demás (dirección, 2026-11-03). Su URL de aquí da 404 y no sale en el sitemap. En «Maquinaria pesada
 * nueva» de la portada SÍ lleva tarjeta desde el diseño v2 (2026-11-08), que va a esa dirección.
 *
 * Solo https y a OTRO sitio: una dirección de este sitio se pone como redirección, no aquí.
 */
export type ConEnlaceExterno = { enlaceExterno?: string | null };

/** Los hosts propios: un «enlace externo» a ellos no tiene sentido. */
const HOSTS_PROPIOS = /(^|\.)partequipos\.com$|^partequipos(-[a-z0-9-]+)?\.vercel\.app$/i;

/** La dirección normalizada si es válida (https, con host y de otro sitio); si no, `null`. */
export function normalizarEnlaceExterno(valor: string | null | undefined): string | null {
  const texto = valor?.trim();
  if (!texto) return null;
  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) {
    return null;
  }
  if (HOSTS_PROPIOS.test(url.hostname)) return null;
  return url.toString();
}

/** La validación del campo en el panel: vacío vale; si no, una dirección https de otro sitio. */
export function validarEnlaceExterno(valor: unknown): true | string {
  if (valor === null || valor === undefined || (typeof valor === "string" && !valor.trim())) {
    return true;
  }
  return typeof valor === "string" && normalizarEnlaceExterno(valor)
    ? true
    : "Escribe una dirección completa de otro sitio que empiece por https:// (por ejemplo, https://maquitecno.co/).";
}

/** El enlace externo de una marca, o `null` si tiene página propia. */
export function enlaceExternoDe(marca: ConEnlaceExterno | null | undefined): string | null {
  return normalizarEnlaceExterno(marca?.enlaceExterno);
}

/** ¿Tiene la marca página propia en este sitio? */
export const tienePaginaPropia = (marca: ConEnlaceExterno | null | undefined) =>
  enlaceExternoDe(marca) === null;

/**
 * Para las consultas: solo las marcas CON página (sin enlace externo). El gancho del campo guarda
 * `null` cuando se vacía, así que basta con «no existe»; la cadena vacía, por si acaso.
 */
export const MARCA_CON_PAGINA: Where = {
  or: [{ enlaceExterno: { exists: false } }, { enlaceExterno: { equals: "" } }],
};

/** El texto que se añade al nombre accesible de un enlace que abre otra pestaña. */
export const AVISO_OTRA_PESTANA = "se abre en otra pestaña";
