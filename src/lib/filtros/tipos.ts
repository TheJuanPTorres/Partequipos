/**
 * FILTROS DE LOS LISTADOS DEL CATÁLOGO — el módulo común (2026-10-13).
 *
 * Una sola implementación para los listados con filtros de maquinaria usada
 * (el «marketplace» del mapa de alcance, sección 01) y de maquinaria nueva
 * (la plantilla «Categoría secundaria» de ux-9). Cada línea aporta solo su
 * ADAPTADOR: qué facetas tiene y cómo se lee cada una en un registro
 * (`src/lib/usados/filtros.ts` es el ejemplo).
 *
 * Todo lo de esta carpeta es puro (sin React, Payload ni Next) y tiene
 * pruebas. Los componentes que lo pintan están en
 * `src/components/catalogo/filtros/`.
 *
 * Reglas de la URL (propuesta del 2026-10-13, aprobada por dirección):
 * - Los filtros van en la query (`?marca=hitachi&marca=liugong&anio=2019`):
 *   una clave repetida por valor, que es lo que envía un formulario GET sin
 *   JavaScript. La forma canónica ordena claves y valores (`consultaCanonica`)
 *   y cualquier otra forma se redirige a ella.
 * - Con cualquier filtro u orden distinto del primero, la página no se indexa
 *   y su canónica es la del listado sin filtros (`seo.ts`).
 */

/** Una opción de una faceta de lista: el valor de la URL y lo que se lee. */
export type Opcion = { valor: string; etiqueta: string };

/** Lista de valores que salen de los datos (marcas, años, categorías…). */
export type FacetaLista<T> = {
  tipo: "lista";
  /** Nombre del parámetro de la URL. */
  clave: string;
  etiqueta: string;
  /** El valor de un registro, o null si no tiene ese dato. */
  de: (item: T) => Opcion | null;
  /** Orden de las opciones en el panel: por etiqueta (por defecto) o por valor descendente (años). */
  ordenOpciones?: "etiqueta" | "valor-desc";
};

/** Un tramo de un número: `desde` incluido, `hasta` excluido; sin límite si falta. */
export type Tramo = { valor: string; etiqueta: string; desde?: number; hasta?: number };

/** Tramos fijos de un número (horas, toneladas). */
export type FacetaTramos<T> = {
  tipo: "tramos";
  clave: string;
  etiqueta: string;
  tramos: readonly Tramo[];
  de: (item: T) => number | null;
};

export type Faceta<T> = FacetaLista<T> | FacetaTramos<T>;

/** Un orden del listado. El PRIMERO del catálogo es el orden por defecto. */
export type OrdenDef<T> = {
  valor: string;
  etiqueta: string;
  /** Tiene que desempatar siempre (por id), o la paginación repetiría unidades. */
  comparar: (a: T, b: T) => number;
};

/** Lo que aporta cada línea del catálogo: sus facetas y sus órdenes. */
export type Catalogo<T> = {
  facetas: readonly Faceta<T>[];
  ordenes: readonly [OrdenDef<T>, ...OrdenDef<T>[]];
};

/** Lo elegido: valores por faceta (clave → valores) y el orden. */
export type Seleccion = {
  valores: Readonly<Record<string, readonly string[]>>;
  orden: string;
};

/** Parámetros de la URL tal como los da Next (`searchParams`). */
export type ParametrosURL = Readonly<Record<string, string | string[] | undefined>>;

/** Una opción del panel con su recuento. */
export type OpcionConCuenta = Opcion & { cuenta: number; activa: boolean };

/** Una faceta lista para pintar. */
export type FacetaPintada = {
  clave: string;
  etiqueta: string;
  opciones: OpcionConCuenta[];
};
