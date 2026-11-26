/**
 * ¿ES ESTE ENLACE DE LA BARRA LA SECCIÓN EN LA QUE ESTÁ EL VISITANTE? (2026-11-26)
 *
 * Marca `aria-current="page"` en el enlace del menú (y `data-actual` en el botón de su
 * desplegable). La ruta la da `usePathname()`, que NO siempre llega igual:
 *
 * - recién construida la página, con su barra final (`/maquinaria-pesada/`);
 * - al REGENERARSE (alguien guarda en el panel), SIN la barra final (`/maquinaria-pesada`), y la
 *   portada como `/index`.
 *
 * Comparando tal cual, la página de la propia sección perdía la marca al regenerarse (medido en
 * los previews: Maquinaria, Repuestos y Servicio técnico sin marca; una subpágina sí la tenía),
 * y el navegador no la repone al hidratar. Por eso se comparan las dos YA NORMALIZADAS: sin `?`
 * ni `#` y con la barra final.
 */

/** Una ruta o un enlace del sitio, normalizado: sin `?` ni `#`, sin `/index` y con barra final. */
export function rutaNormalizada(ruta: string | null | undefined): string {
  let limpia = (ruta ?? "").trim().split(/[?#]/)[0] ?? "";
  if (limpia === "/index" || limpia === "/index/") limpia = "/";
  if (limpia === "") return "/";
  return limpia.endsWith("/") ? limpia : `${limpia}/`;
}

/**
 * El enlace `href` es la sección actual si la ruta es la suya o cuelga de ella. La portada («/»)
 * solo es la actual en la portada: toda ruta empieza por «/». Un enlace a otro sitio, nunca.
 */
export function esSeccionActual(ruta: string | null | undefined, href: string): boolean {
  if (!href.trim().startsWith("/")) return false;
  const aqui = rutaNormalizada(ruta);
  const seccion = rutaNormalizada(href);
  return aqui === seccion || (seccion !== "/" && aqui.startsWith(seccion));
}
