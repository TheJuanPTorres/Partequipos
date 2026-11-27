/**
 * LA «DIRECCIÓN WEB» DE UNA PÁGINA (tanda 26, tarea 6, 2026-11-27, Juan Pablo).
 *
 * Una página vive en `partequipos.com/<dirección>/` y comparte ese espacio con las rutas propias
 * de la web (maquinaria, repuestos, el blog, la API…). Una página con el primer tramo de una ruta
 * propia nunca se vería (la ruta propia gana) o taparía una sección entera; una con una dirección
 * que ya es ORIGEN de una redirección tampoco se vería (el proxy redirige antes). Aquí, la decisión
 * pura, con pruebas; el gancho `direccionDePaginaValida` la aplica al guardar (panel y API local).
 */

/** Cada tramo: minúsculas a-z y 0-9, separados por un guion (sin guion al principio ni al final). */
const TRAMO = "[a-z0-9]+(?:-[a-z0-9]+)*";
const FORMATO = new RegExp(`^${TRAMO}(?:/${TRAMO})*$`);

/**
 * LOS PRIMEROS TRAMOS QUE YA USA LA WEB, y no puede usar una página. Salen de `src/app`: las
 * carpetas de `src/app/(site)` y `src/app/(payload)`, los ficheros de metadatos de la raíz
 * (`sitemap.ts` → `sitemap.xml`, `robots.ts` → `robots.txt`, los iconos) y lo de Next (`_next`).
 * `direccion.test.ts` lee esas carpetas y falla si una ruta nueva no está aquí (o si sobra una).
 */
export const TRAMOS_RESERVADOS: readonly string[] = [
  // src/app/(site)
  ".well-known",
  "api",
  "buscar",
  "category",
  "laboratorio",
  "lubricantes",
  "maquinaria-pesada",
  "noticias",
  "repuestos-maquinaria-pesada-colombia",
  "vista-previa",
  // src/app/(payload)
  "admin",
  // Metadatos de la raíz (src/app y src/app/(site))
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "apple-icon.png",
  "icon0.png",
  "icon1.png",
  // Next
  "_next",
];

/**
 * Carpetas de `src/app/(site)` cuyas rutas SON páginas de esta colección: `nosotros` es la página
 * «Nosotros» y `nosotros/trabaja-con-nosotros` tiene su ruta propia, pero las dos están aquí
 * (`SLUGS_CON_RUTA_PROPIA`). Cualquier otra `nosotros/…` la sirve la ruta comodín.
 */
export const CARPETAS_DE_PAGINAS: readonly string[] = ["nosotros"];

/** La dirección propuesta desde un título: «Política de Garantía (2026)» → «politica-de-garantia-2026». */
export function direccionDesdeTitulo(titulo: string): string {
  return (titulo ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** El error de formato en español, o `null` si el formato es bueno. */
export function errorDeFormato(direccion: string, titulo?: string): string | null {
  if (FORMATO.test(direccion)) return null;
  const propuesta = direccionDesdeTitulo(titulo || direccion.replace(/\//g, " "));
  return (
    `La dirección web «${direccion}» no es válida: solo minúsculas sin tildes ni ñ, números y ` +
    "guiones, con «/» entre tramos, sin espacios y sin barras al principio ni al final." +
    (propuesta ? ` Prueba con «${propuesta}».` : "")
  );
}

/** El error si el primer tramo es una ruta propia de la web, o `null`. */
export function errorDeReservada(direccion: string): string | null {
  const primero = direccion.split("/")[0] ?? "";
  if (!TRAMOS_RESERVADOS.includes(primero)) return null;
  return (
    `La dirección web no puede empezar por «${primero}»: esa parte de la web ya la usa ` +
    "una sección propia (maquinaria, repuestos, el blog, la API…) y la página no se vería. Elige otra."
  );
}

/** El error si la dirección ya es el ORIGEN de una redirección (la página no se vería), o `null`. */
export function errorDeRedireccion(direccion: string, esOrigen: boolean): string | null {
  return esOrigen
    ? `La dirección web «${direccion}» ya es el origen de una redirección: quien la visita va ` +
        "a otra página, así que esta no se vería. Elige otra o quita antes la redirección."
    : null;
}
