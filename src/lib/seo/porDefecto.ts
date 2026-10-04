/**
 * Lo que usa el sitio cuando los campos de «Buscadores y redes sociales»
 * quedan vacíos. UNA sola fuente para dos sitios: las páginas del catálogo
 * (en su `generateMetadata`) y el panel (`SeoGuiado`, que enseña al editor qué
 * saldrá en Google). Si cambia una plantilla aquí, cambian los dos a la vez.
 *
 * Solo funciones puras: lo importa también un componente de cliente.
 */

/** Título por defecto de cada página del catálogo, a partir de sus nombres. */
export const tituloPorDefecto = {
  tipoRepuesto: (tipo: string, marca: string) => `Repuestos para ${tipo.toLowerCase()} ${marca}`,
  modeloRepuesto: (modelo: string) => `Repuestos ${modelo}`,
  marcaMaquinaria: (marca: string) => `Maquinaria pesada ${marca}`,
  tipoMaquinaria: (tipo: string, marca: string) => `${tipo} ${marca}`,
  categoriaNueva: (categoria: string) => `${categoria} nuevas`,
  categoriaUsada: (categoria: string) => `${categoria} usadas`,
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
