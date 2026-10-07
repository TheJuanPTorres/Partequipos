/**
 * Lo que usa el sitio cuando los campos de «Buscadores y redes sociales»
 * quedan vacíos. UNA sola fuente para dos sitios: las páginas del catálogo
 * (en su `generateMetadata`) y el panel (`SeoGuiado`, que enseña al editor qué
 * saldrá en Google). Si cambia una plantilla aquí, cambian los dos a la vez.
 *
 * Solo funciones puras: lo importa también un componente de cliente.
 */

/**
 * «nuevas» o «nuevos», «usadas» o «usados», según el nombre de la categoría.
 * Las categorías son plurales («Excavadoras», «Cargadores», «Bulldozers»): el
 * femenino plural acaba en «-as», y todo lo demás va en masculino. Antes el
 * sitio decía «Vibrocompactadores usadas» y «Cargadores nuevas».
 */
export function concuerda(nombre: string, femenino: string, masculino: string): string {
  const ultima = nombre.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
  return ultima.endsWith("as") ? femenino : masculino;
}

/** Título por defecto de cada página del catálogo, a partir de sus nombres. */
export const tituloPorDefecto = {
  tipoRepuesto: (tipo: string, marca: string) => `Repuestos para ${tipo.toLowerCase()} ${marca}`,
  modeloRepuesto: (modelo: string) => `Repuestos ${modelo}`,
  marcaMaquinaria: (marca: string) => `Maquinaria pesada ${marca}`,
  tipoMaquinaria: (tipo: string, marca: string) => `${tipo} ${marca}`,
  categoriaNueva: (categoria: string) => `${categoria} ${concuerda(categoria, "nuevas", "nuevos")}`,
  categoriaUsada: (categoria: string) => `${categoria} ${concuerda(categoria, "usadas", "usados")}`,
  marcaLubricante: (marca: string) => `Lubricantes ${marca}`,
  categoriaLubricante: (categoria: string, marca: string) => `${categoria} | Lubricantes ${marca}`,
} as const;

/** Largo máximo de la meta descripción: lo que pase se corta con «…». */
export const MAX_DESCRIPCION = 160;

/** Recorta una descripción a una longitud sensata para un meta tag. */
export function recortarDescripcion(texto: string, max = MAX_DESCRIPCION): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max - 1).trimEnd()}…`;
}

/** Longitudes que se le recomiendan al editor (lo que Google suele enseñar). */
export const RECOMENDADO = {
  titulo: { max: 60 },
  descripcion: { min: 120, max: MAX_DESCRIPCION },
} as const;

/** La marca al final del `<title>` (auditoría I2, decisión de dirección del 2026-10-07). */
export const SUFIJO_MARCA = " | Partequipos";

/**
 * El `<title>` que sale publicado: el título con « | Partequipos» al final,
 * salvo en la portada, si ya lleva la marca (no «… - Partequipos | Partequipos»)
 * o si con ella pasaría de los 60 caracteres que enseña Google: entonces va
 * sin marca, entero. Lo usan `buildMetadata` y la vista de Google del panel.
 */
export function tituloConMarca(titulo: string, path: string): string {
  const t = titulo.replace(/\s+/g, " ").trim();
  if (path === "/" || /partequipos/i.test(t)) return t;
  const conMarca = `${t}${SUFIJO_MARCA}`;
  return conMarca.length <= RECOMENDADO.titulo.max ? conMarca : t;
}
