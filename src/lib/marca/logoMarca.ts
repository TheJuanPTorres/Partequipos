/**
 * EL LOGO DE UNA MARCA, UNO SOLO EN TODO EL SITIO (dirección, 2026-10-20).
 *
 * La referencia es el que pinta el megamenú para las marcas de REPUESTOS: el
 * logo subido en el panel («Logo» de la marca), con sus colores, o en una sola
 * tinta oscura si la casilla «Pintar el logo en oscuro en el menú» está marcada
 * (los logos blancos del cliente). Ese mismo logo, con esa misma regla, sale
 * donde salga la marca: megamenú, índice de marcas, cabecera de marca, tipo y
 * modelo de repuestos, marcas y fichas de maquinaria nueva, marcas de usados y
 * la portada. Se pinta siempre con `LogoMarca` (src/components/marca/).
 *
 * Una marca de maquinaria nueva o de usados que ES una marca de repuestos (por
 * su nombre: Hitachi, Case Construction, Yanmar…) usa el logo de la de
 * repuestos; si no hay ninguna con su nombre, el suyo propio con su casilla.
 */

/** Lo que `next/image` necesita y si va en tinta oscura. */
export type LogoMarca = { url: string; width: number; height: number; oscuro: boolean };

type MediaLogo = { url?: string | null; width?: number | null; height?: number | null };

/** Cualquier registro de marca (repuestos, nueva o usados) tal como llega de Payload. */
export type FuenteLogo = {
  nombre?: string | null;
  logo?: number | MediaLogo | null;
  logoOscuroEnMenu?: boolean | null;
};

/** El logo con su texto alternativo («Logo de Hitachi»), para donde el nombre no está escrito al lado. */
export type LogoConAlt = LogoMarca & { alt: string };

/** El logo con su texto alternativo, o `null` si no hay logo. */
export function conAlt(logo: LogoMarca | null, alt: string): LogoConAlt | null {
  return logo ? { ...logo, alt } : null;
}

/** Los logos de las marcas de repuestos por su nombre normalizado. */
export type IndiceLogos = ReadonlyMap<string, LogoMarca>;

/**
 * El nombre de la marca reducido a letras y cifras, sin tildes y en minúscula:
 * «Link Belt» y «Link-Belt», o «Liugong» y «LiuGong», son la misma marca.
 */
export function claveDeMarca(nombre: string | null | undefined): string {
  return (nombre ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** El logo del propio registro, o `null` si no tiene (o le falta la url o las medidas). */
export function logoPropio(fuente: FuenteLogo | null | undefined): LogoMarca | null {
  const logo = fuente?.logo;
  if (!logo || typeof logo !== "object") return null;
  const { url, width, height } = logo;
  if (!url || !width || !height) return null;
  return { url, width, height, oscuro: fuente.logoOscuroEnMenu === true };
}

/** El índice de los logos de las marcas de repuestos (las que tienen logo). */
export function indiceDeLogos(marcasRepuestos: readonly FuenteLogo[]): Map<string, LogoMarca> {
  const indice = new Map<string, LogoMarca>();
  for (const m of marcasRepuestos) {
    const clave = claveDeMarca(m.nombre);
    const logo = logoPropio(m);
    if (clave && logo && !indice.has(clave)) indice.set(clave, logo);
  }
  return indice;
}

/**
 * El logo de una marca cualquiera: el de la marca de repuestos con su nombre y,
 * si no hay ninguna, el suyo propio. Sin ninguno, `null` (se pinta su nombre).
 */
export function logoDeMarca(fuente: FuenteLogo, indice: IndiceLogos): LogoMarca | null {
  return indice.get(claveDeMarca(fuente.nombre)) ?? logoPropio(fuente);
}
