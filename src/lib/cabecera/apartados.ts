/**
 * APARTADOS DE LOS DESPLEGABLES DEL MENÚ PRINCIPAL (tanda 24, tarea 1; Juan Pablo, 2026-11-25).
 *
 * Cada desplegable del megamenú (y del menú móvil, que pinta lo mismo) es una lista ORDENADA de
 * apartados que se edita en el global `cabecera` («Menú principal»): se arrastran, se renombran y
 * se muestran u ocultan. Un apartado es una LISTA AUTOMÁTICA (las marcas, las categorías…: su
 * contenido sale del catálogo, en el orden por arrastre de su colección) o un ENLACE FIJO.
 *
 * Aquí, lo puro: los tipos de cada desplegable, el menú de siempre (`APARTADOS_POR_DEFECTO`, lo
 * mismo que siembra la migración) y qué apartados salen. Lo que pinta cada tipo, en
 * `src/lib/megamenu.ts`.
 */

export type Desplegable = "maquinaria" | "repuestos" | "lubricantes";

/** Una fila del panel, tal como llega de Payload. */
export type ApartadoMenu = {
  tipo?: string | null;
  nombre?: string | null;
  enlace?: string | null;
  mostrar?: boolean | null;
};

/** El enlace escrito a mano; los demás tipos son automáticos y van una sola vez por desplegable. */
export const TIPO_ENLACE = "enlace";

export const TIPOS_APARTADO = {
  maquinaria: [
    { value: "ver-todo", label: "Enlace a la página de Maquinaria pesada" },
    { value: "nueva", label: "Lista automática: maquinaria nueva (por marca y por tipo)" },
    { value: "usada", label: "Lista automática: categorías de maquinaria usada" },
    { value: "aditamentos", label: "Enlace a la página de Aditamentos" },
    { value: TIPO_ENLACE, label: "Enlace fijo" },
  ],
  repuestos: [
    { value: "ver-todo", label: "Enlace a la página de Repuestos" },
    { value: "marcas", label: "Lista automática: marcas de repuestos" },
    { value: "categorias", label: "Lista automática: categorías técnicas" },
    { value: TIPO_ENLACE, label: "Enlace fijo" },
  ],
  lubricantes: [
    { value: "ver-todo", label: "Enlace a la página de Lubricantes" },
    { value: "marcas", label: "Lista automática: marcas de lubricantes" },
    { value: TIPO_ENLACE, label: "Enlace fijo" },
  ],
} as const satisfies Record<Desplegable, ReadonlyArray<{ value: string; label: string }>>;

/**
 * El menú de siempre. Es lo que siembra la migración `…_menu_apartados` (allí, escrito en SQL:
 * una migración no importa nada de `src/`, CLAUDE.md §3.5) y lo que sale si la lista del panel
 * está vacía.
 */
export const APARTADOS_POR_DEFECTO: Record<Desplegable, ReadonlyArray<Required<ApartadoMenu>>> = {
  maquinaria: [
    { tipo: "ver-todo", nombre: "Ver toda la maquinaria pesada", enlace: null, mostrar: true },
    { tipo: "nueva", nombre: "Maquinaria pesada nueva", enlace: null, mostrar: true },
    { tipo: "usada", nombre: "Maquinaria pesada usada", enlace: null, mostrar: true },
    {
      tipo: "aditamentos",
      nombre: "Aditamentos para maquinaria pesada",
      enlace: null,
      mostrar: true,
    },
  ],
  repuestos: [
    { tipo: "ver-todo", nombre: "Ver todos los repuestos", enlace: null, mostrar: true },
    { tipo: "marcas", nombre: "Repuestos por marca", enlace: null, mostrar: true },
    { tipo: "categorias", nombre: "Repuestos por categoría técnica", enlace: null, mostrar: true },
    {
      tipo: TIPO_ENLACE,
      nombre: "Política de garantías y repuestos",
      enlace: "/politica-de-garantia-de-repuestos/",
      mostrar: true,
    },
  ],
  lubricantes: [
    { tipo: "ver-todo", nombre: "Ver todos los lubricantes", enlace: null, mostrar: true },
    { tipo: "marcas", nombre: "Marcas de lubricantes", enlace: null, mostrar: true },
  ],
};

/** Un apartado que SALE: con su tipo válido, su nombre y, si es un enlace fijo, su destino. */
export type ApartadoVisible = { tipo: string; nombre: string; enlace: string };

/**
 * Los apartados que salen en un desplegable, en el orden del panel. Lista vacía (o sin sembrar):
 * el menú de siempre. No salen: los de «Mostrar» desmarcada, un tipo que no es de ese
 * desplegable, un enlace fijo sin nombre o sin destino, ni la SEGUNDA vez de una lista automática
 * (el panel ya lo impide al guardar). Un automático sin nombre lleva el de siempre.
 */
export function apartadosVisibles(
  filas: ReadonlyArray<ApartadoMenu> | null | undefined,
  desplegable: Desplegable,
): ApartadoVisible[] {
  const porDefecto = APARTADOS_POR_DEFECTO[desplegable];
  const origen = filas && filas.length > 0 ? filas : porDefecto;
  const validos = new Set<string>(TIPOS_APARTADO[desplegable].map((t) => t.value));
  const vistos = new Set<string>();
  const salen: ApartadoVisible[] = [];
  for (const fila of origen) {
    const tipo = fila.tipo ?? "";
    if (fila.mostrar === false || !validos.has(tipo)) continue;
    const nombre = fila.nombre?.trim() ?? "";
    const enlace = fila.enlace?.trim() ?? "";
    if (tipo === TIPO_ENLACE) {
      if (nombre && enlace) salen.push({ tipo, nombre, enlace });
      continue;
    }
    if (vistos.has(tipo)) continue;
    vistos.add(tipo);
    const deSiempre = porDefecto.find((p) => p.tipo === tipo)?.nombre ?? "";
    salen.push({ tipo, nombre: nombre || deSiempre, enlace: "" });
  }
  return salen;
}

/** Validación de la lista en el panel: ni una lista automática dos veces ni dos nombres iguales. */
export function validarApartados(filas: unknown, desplegable: Desplegable): true | string {
  if (!Array.isArray(filas)) return true;
  const etiquetas = new Map<string, string>(
    TIPOS_APARTADO[desplegable].map((t) => [t.value, t.label]),
  );
  const vistos = new Set<string>();
  // Dos apartados con el mismo nombre se confundirían al desplegarlos (y para quien lee el menú).
  const nombres = new Set<string>();
  for (const fila of filas as ApartadoMenu[]) {
    const nombre = fila?.nombre?.trim().toLocaleLowerCase("es") ?? "";
    if (nombre && nombres.has(nombre)) {
      return `Hay dos apartados que se llaman «${fila.nombre?.trim()}»: cambia el nombre de uno.`;
    }
    if (nombre) nombres.add(nombre);
  }
  for (const fila of filas as ApartadoMenu[]) {
    const tipo = fila?.tipo ?? "";
    if (!tipo || tipo === TIPO_ENLACE) continue;
    if (vistos.has(tipo)) {
      return `«${etiquetas.get(tipo) ?? tipo}» está dos veces: cada apartado automático va una sola vez. Quita uno (los enlaces fijos sí pueden repetirse).`;
    }
    vistos.add(tipo);
  }
  return true;
}
