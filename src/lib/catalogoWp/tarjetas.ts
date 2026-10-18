/**
 * TARJETAS SUELTAS DEL CATÁLOGO DE WORDPRESS (2026-10-18, decisión del cliente:
 * «se migra TODO aunque esté mal», tras la auditoría de estructura). Son
 * modelos que en WordPress solo aparecen como tarjeta dentro de una página, sin
 * ficha propia. Lógica pura del importador `scripts/catalogo-wp/importar.ts`;
 * detalle en `docs/catalogo-wp-tal-cual.md`.
 */
import { pesoOperativoKg, type Par } from "../maquinaria/wordpress";
import { nombreCompuesto } from "../usados/wordpress";
import { formatSlug } from "../utils/formatSlug";

/** Marca de maquinaria nueva de cada rótulo de WordPress («CASE», «AMMANN»). */
export const MARCAS_NUEVA: Readonly<Record<string, { slug: string; nombre: string }>> = {
  case: { slug: "case-construction", nombre: "Case Construction" },
  // No existía como marca de nueva: solo como estas tarjetas (la crea el importador).
  ammann: { slug: "ammann", nombre: "Ammann" },
};

/**
 * El tipo (dentro de su marca) de las tarjetas de cada página de categoría de
 * nueva, con el nombre del modelo en singular. Los dos tipos son nuevos: en
 * WordPress no tenían página.
 */
export const TIPOS_DE_CATEGORIA: Readonly<
  Record<string, { slug: string; nombre: string; singular: string }>
> = {
  cargadores: { slug: "cargadores", nombre: "Cargadores", singular: "Cargador" },
  compactadores: {
    slug: "vibrocompactadores",
    nombre: "Vibrocompactadores",
    singular: "Vibrocompactador",
  },
};

/** «CASE» / «W20F» en la página de cargadores → «Cargador Case Construction W20F». */
export function nombreDeNuevo(categoria: string, rotulo: string, modelo: string): string {
  const tipo = TIPOS_DE_CATEGORIA[categoria];
  const marca = MARCAS_NUEVA[rotulo.trim().toLowerCase()];
  if (!tipo || !marca)
    throw new Error(`tarjeta sin tipo o sin marca conocida: ${categoria} / ${rotulo}`);
  return `${tipo.singular} ${marca.nombre} ${modelo.replace(/\s+/g, " ").trim()}`;
}

/** La lista de la tarjeta («Peso operativo: 10 TON») como filas de la ficha técnica, tal cual. */
export function fichaDeTarjeta(lineas: string[]): Par[] {
  return lineas.flatMap((cruda) => {
    const linea = cruda.replace(/\s+/g, " ").trim();
    const m = linea.match(/^([^:]+):\s*(.+)$/);
    return m ? [{ etiqueta: m[1]!.trim(), valor: m[2]!.trim() }] : [];
  });
}

/** El peso operativo en kg de la ficha, si se entiende (el mismo criterio que las fichas). */
export const pesoDeTarjeta = (ficha: Par[]) => pesoOperativoKg(ficha);

/** «CATERPILLAR» → «Caterpillar»; «KOMATSU» → «Komatsu». */
export function marcaDeRotulo(rotulo: string): string {
  const t = rotulo.replace(/\s+/g, " ").trim().toLowerCase();
  return t.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
}

/** Nombre de la unidad usada, como las importadas: «Bulldozer Caterpillar D3C 1996». */
export function nombreDeUsado(
  tipo: string,
  rotulo: string,
  modelo: string,
  anio: number | null,
): string {
  return nombreCompuesto(tipo, marcaDeRotulo(rotulo), modelo.trim(), anio);
}

/**
 * CATÁLOGO DE ADITAMENTOS DE 2022 frente al de 2025 (ya importado): cada
 * tarjeta de 2022 con su equivalente de 2025, o `null` si no lo tiene. Solo
 * se importan las que no lo tienen. Criterio: el mismo aditamento con otro
 * nombre («Tablero porta horquilla» es el porta pallet; «Cadena de metal», las
 * cadenas de llanta) cuenta como el mismo.
 */
export const ADITAMENTOS_2022_EN_2025: Readonly<Record<string, string | null>> = {
  "brazo largo": "brazo-largo-para-excavadoras",
  "martillo hidraulico": "martillo-para-excavadoras",
  pontones: "pontones-para-excavadoras",
  ahoyador: null,
  "barredor cucharon": "barredora-para-minicargadores",
  "brazo excavador": "brazo-para-minicargadores",
  "martillo okada": "martillo-para-minicargadores",
  rodillo: "rodillo-compactador-para-minicargadores",
  "tablero porta horquilla": "porta-pallet-para-minicargadores",
  "cadena de metal": "cadenas-de-llanta-para-minicargadores",
};

/** Clave de una tarjeta de 2022: sin mayúsculas, tildes ni espacios de más. */
export const claveAditamento = (titulo: string) => formatSlug(titulo).replace(/-/g, " ");

/**
 * ¿Hay que importar esta tarjeta de 2022? Solo si no tiene equivalente en el
 * catálogo de 2025. Una tarjeta que no está en la tabla es un error (algo
 * cambió en WordPress): mejor parar que adivinar.
 */
export function importarAditamento2022(titulo: string): boolean {
  const clave = claveAditamento(titulo);
  if (!(clave in ADITAMENTOS_2022_EN_2025)) {
    throw new Error(
      `aditamento de 2022 sin decidir: «${titulo}» (añádelo a ADITAMENTOS_2022_EN_2025)`,
    );
  }
  return ADITAMENTOS_2022_EN_2025[clave] === null;
}
