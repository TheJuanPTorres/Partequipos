import type { EnlaceCabecera } from "../cabecera/enlaces";

/**
 * «VER EN LA TIENDA» (2026-11-26, el cliente monta su tienda de repuestos): cada elemento de
 * repuestos (modelo, categoría técnica, tipo de repuesto y producto) puede llevar su propio
 * «Enlace en la tienda»; vacío, el botón lleva a la TIENDA GENERAL, que es el enlace del botón
 * «Tienda» de la cabecera (se toma del panel: global «Cabecera», nunca escrito en el código).
 * Lógica pura, con pruebas.
 */

/** Una dirección https:// completa y bien formada (la única forma de enlazar la tienda). */
export function esEnlaceTiendaValido(valor: unknown): valor is string {
  if (typeof valor !== "string") return false;
  const v = valor.trim();
  if (!/^https:\/\/[^\s/]+/i.test(v)) return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname.includes(".") && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** Validación del campo del panel: vacío vale; si no, una dirección https:// completa. */
export function validarEnlaceTienda(valor: unknown): true | string {
  if (valor === undefined || valor === null) return true;
  if (typeof valor !== "string" || valor.trim() === "") return true;
  return esEnlaceTiendaValido(valor)
    ? true
    : "Escribe la dirección completa, empezando por https:// (por ejemplo https://tienda.partequipos.com/…).";
}

/**
 * El enlace de la tienda general: el del botón «Tienda» de la cabecera. Primero un enlace a otro
 * sitio (`externo`) cuyo texto sea «Tienda» y, si no, cualquiera que se llame así con https://.
 * `null` si el panel no tiene ninguno (entonces solo hay botón donde el elemento tiene el suyo).
 */
export function enlaceTiendaGeneral(
  enlaces: readonly Pick<EnlaceCabecera, "etiqueta" | "href" | "externo">[] | null | undefined,
): string | null {
  const tienda = (enlaces ?? []).filter(
    (e) => /\btienda\b/i.test(e.etiqueta) && esEnlaceTiendaValido(e.href),
  );
  return (tienda.find((e) => e.externo) ?? tienda[0])?.href.trim() ?? null;
}

/** El destino del botón de un elemento: el suyo si es válido y, si no, el general (o `null`). */
export function destinoTienda(
  propio: string | null | undefined,
  general: string | null | undefined,
): string | null {
  if (esEnlaceTiendaValido(propio)) return propio.trim();
  return esEnlaceTiendaValido(general) ? general.trim() : null;
}

/**
 * LA BÚSQUEDA DE LA TIENDA (2026-11-27, diseño nuevo): el botón abre la búsqueda de la tienda con el
 * nombre corto del elemento. La dirección de la búsqueda se escribe en el panel («Búsqueda de la
 * tienda», global «Menú principal (cabecera)»), nunca en el código, y TERMINA en el parámetro de la
 * consulta, sin valor (`https://…/catalogsearch/result/?q=`): se le añade el nombre codificado.
 */
export function esBusquedaTiendaValida(valor: unknown): valor is string {
  return esEnlaceTiendaValido(valor) && valor.trim().endsWith("=");
}

/** Validación del campo del panel: vacío vale; si no, https:// y terminada en `=` (p. ej. `?q=`). */
export function validarBusquedaTienda(valor: unknown): true | string {
  if (valor === undefined || valor === null) return true;
  if (typeof valor !== "string" || valor.trim() === "") return true;
  return esBusquedaTiendaValida(valor)
    ? true
    : "Escribe la dirección completa de la búsqueda, empezando por https:// y terminada en el parámetro de la consulta, por ejemplo https://tienda.partequipos.com/catalogsearch/result/?q=";
}

/** «CADENA PARA EXCAVADORA MAQUINARIA PESADA» → «CADENA PARA EXCAVADORA»; «… PARA MAQUINARIA PESADA» → sin él. */
export function nombreCorto(nombre: string | null | undefined): string {
  return (nombre ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+(para\s+)?maquinaria\s+pesada$/i, "")
    .trim();
}

/** La búsqueda de la tienda con el nombre corto (tildes y «&» codificados); `null` si no se puede. */
export function urlBusqueda(
  base: string | null | undefined,
  nombre: string | null | undefined,
): string | null {
  const corto = nombreCorto(nombre);
  if (!corto || !esBusquedaTiendaValida(base)) return null;
  return `${base.trim()}${encodeURIComponent(corto)}`;
}

/** Lo que el panel tiene de la tienda: el enlace general y la búsqueda (cualquiera puede faltar). */
export type ConfigTienda = { general: string | null; busqueda: string | null };

/**
 * El destino del botón de un elemento. Orden: su enlace propio válido → la búsqueda de la tienda
 * con su nombre corto → el enlace de su grupo → la tienda general. `null` si no hay ninguno (sin
 * botón). Con la búsqueda vacía en el panel, es lo de siempre: propio → grupo → general.
 */
export function destinoPorNombre(
  propio: string | null | undefined,
  nombre: string | null | undefined,
  config: ConfigTienda,
  delGrupo?: string | null,
): string | null {
  if (esEnlaceTiendaValido(propio)) return propio.trim();
  const busqueda = urlBusqueda(config.busqueda, nombre);
  if (busqueda) return busqueda;
  if (esEnlaceTiendaValido(delGrupo)) return delGrupo.trim();
  return esEnlaceTiendaValido(config.general) ? config.general.trim() : null;
}

/** Orígenes del evento GA4 `clic_tienda`: de qué botón sale el clic. */
export type OrigenTienda = "modelo" | "categoria" | "tipo-repuesto" | "producto";

/** El texto de ayuda de «Enlace en la tienda», igual en los cuatro sitios del panel. */
export const AYUDA_ENLACE_TIENDA = (que: string) =>
  `Opcional. La dirección (https://…) de la página de ${que} en la tienda. Si lo dejas vacío, lleva a la tienda general (la del botón «Tienda» de la cabecera).`;
