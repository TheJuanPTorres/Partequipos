import { apartadosVisibles, TIPO_ENLACE, type ApartadoMenu, type Desplegable } from "./apartados";

/**
 * EL ÁRBOL DEL MENÚ PRINCIPAL (tanda 25, tarea 2; Juan Pablo, 2026-11-26).
 *
 * Todo el menú se arma en un solo sitio, «Enlaces del menú» del global `cabecera`:
 *
 *   barra (enlace simple o DESPLEGABLE) → apartados del desplegable → enlaces de un grupo
 *
 * Un APARTADO es una LISTA AUTOMÁTICA (se elige la fuente y se llena sola con el catálogo, en el
 * orden por arrastre de su colección), un ENLACE FIJO o un GRUPO (un título con enlaces fijos).
 * Sustituye a las tres listas de la tanda 24 (`menuMaquinaria`…, `apartados.ts`), que se quedan
 * ocultas y son el menú de siempre al que se vuelve si un desplegable se queda sin apartados.
 *
 * Aquí, lo puro: los tipos, las fuentes, qué sale y las validaciones del panel. Lo que pinta cada
 * fuente, en `src/lib/megamenu.ts`.
 */

export const FILA_ENLACE = "enlace";
export const FILA_DESPLEGABLE = "desplegable";

export const TIPOS_FILA = [
  { value: FILA_ENLACE, label: "Enlace simple" },
  { value: FILA_DESPLEGABLE, label: "Desplegable (con apartados)" },
] as const;

export const APARTADO_LISTA = "lista";
export const APARTADO_ENLACE = "enlace";
export const APARTADO_GRUPO = "grupo";

export const TIPOS_DE_APARTADO = [
  { value: APARTADO_LISTA, label: "Lista automática (se llena sola)" },
  { value: APARTADO_ENLACE, label: "Enlace fijo" },
  { value: APARTADO_GRUPO, label: "Grupo: un título con varios enlaces" },
] as const;

/**
 * Las fuentes de una lista automática. `nombre`: el que lleva el apartado si se deja sin nombre
 * (y el del menú de siempre). Los valores son los del enum de la base: no se renombran sin
 * migración.
 */
export const FUENTES = [
  {
    value: "pagina-maquinaria",
    label: "Enlace a la página de Maquinaria pesada («Ver toda…»)",
    nombre: "Ver toda la maquinaria pesada",
  },
  {
    value: "nueva",
    label: "Maquinaria nueva completa (por marca y por tipo)",
    nombre: "Maquinaria pesada nueva",
  },
  {
    value: "nueva-marcas",
    label: "Marcas de maquinaria nueva, con sus tipos",
    nombre: "Maquinaria nueva por marca",
  },
  {
    value: "nueva-tipos",
    label: "Tipos de máquina (maquinaria nueva)",
    nombre: "Maquinaria nueva por tipo de máquina",
  },
  {
    value: "usada",
    label: "Categorías de maquinaria usada",
    nombre: "Maquinaria pesada usada",
  },
  {
    value: "aditamentos",
    label: "Enlace a la página de Aditamentos",
    nombre: "Aditamentos para maquinaria pesada",
  },
  {
    value: "pagina-repuestos",
    label: "Enlace a la página de Repuestos («Ver todos…»)",
    nombre: "Ver todos los repuestos",
  },
  {
    value: "repuestos-marcas",
    label: "Marcas de repuestos, con sus tipos",
    nombre: "Repuestos por marca",
  },
  {
    value: "categorias-tecnicas",
    label: "Categorías técnicas de repuestos (tarjetas con foto)",
    nombre: "Repuestos por categoría técnica",
  },
  {
    value: "pagina-lubricantes",
    label: "Enlace a la página de Lubricantes («Ver todos…»)",
    nombre: "Ver todos los lubricantes",
  },
  {
    value: "lubricantes-marcas",
    label: "Marcas de lubricantes, con sus líneas",
    nombre: "Marcas de lubricantes",
  },
] as const;

export type Fuente = (typeof FUENTES)[number]["value"];

const FUENTE_POR_VALOR = new Map<string, (typeof FUENTES)[number]>(
  FUENTES.map((f) => [f.value, f]),
);

/** Un enlace de un grupo, tal como llega de Payload. */
export type EnlaceDeGrupo = {
  mostrar?: boolean | null;
  etiqueta?: string | null;
  enlace?: string | null;
};

/** Un apartado de un desplegable, tal como llega de Payload. */
export type ApartadoArbol = {
  mostrar?: boolean | null;
  nombre?: string | null;
  tipo?: string | null;
  fuente?: string | null;
  enlace?: string | null;
  enlaces?: ReadonlyArray<EnlaceDeGrupo> | null;
};

/** Una fila de «Enlaces del menú», tal como llega de Payload. */
export type FilaBarra = {
  mostrar?: boolean | null;
  etiqueta?: string | null;
  enlace?: string | null;
  tipo?: string | null;
  apartados?: ReadonlyArray<ApartadoArbol> | null;
};

/** Un apartado que SALE en el menú, ya limpio. */
export type ApartadoQueSale =
  | { tipo: typeof APARTADO_LISTA; fuente: Fuente; nombre: string }
  | { tipo: typeof APARTADO_ENLACE; nombre: string; enlace: string }
  | {
      tipo: typeof APARTADO_GRUPO;
      nombre: string;
      enlaces: { etiqueta: string; enlace: string }[];
    };

/**
 * Los apartados que salen de un desplegable, en el orden del panel. No salen: los de «Mostrar»
 * desmarcada, una lista sin fuente (o con una que ya no existe), la SEGUNDA vez de una misma
 * fuente, un enlace fijo sin nombre o sin destino, ni un grupo sin nombre o sin ningún enlace
 * que salga. Una lista sin nombre lleva el de su fuente.
 */
export function apartadosQueSalen(
  filas: ReadonlyArray<ApartadoArbol> | null | undefined,
): ApartadoQueSale[] {
  const vistas = new Set<string>();
  const salen: ApartadoQueSale[] = [];
  for (const fila of filas ?? []) {
    if (!fila || fila.mostrar === false) continue;
    const nombre = fila.nombre?.trim() ?? "";
    if (fila.tipo === APARTADO_LISTA) {
      const fuente = FUENTE_POR_VALOR.get(fila.fuente ?? "");
      if (!fuente || vistas.has(fuente.value)) continue;
      vistas.add(fuente.value);
      salen.push({ tipo: APARTADO_LISTA, fuente: fuente.value, nombre: nombre || fuente.nombre });
    } else if (fila.tipo === APARTADO_ENLACE) {
      const enlace = fila.enlace?.trim() ?? "";
      if (nombre && enlace) salen.push({ tipo: APARTADO_ENLACE, nombre, enlace });
    } else if (fila.tipo === APARTADO_GRUPO) {
      const enlaces = (fila.enlaces ?? []).flatMap((e) => {
        const etiqueta = e?.etiqueta?.trim() ?? "";
        const enlace = e?.enlace?.trim() ?? "";
        return e?.mostrar === false || !etiqueta || !enlace ? [] : [{ etiqueta, enlace }];
      });
      if (nombre && enlaces.length > 0) salen.push({ tipo: APARTADO_GRUPO, nombre, enlaces });
    }
  }
  return salen;
}

/** La fuente del árbol que corresponde a cada tipo automático de las listas de la tanda 24. */
export const FUENTE_DE_TIPO_608: Record<Desplegable, Record<string, Fuente>> = {
  maquinaria: {
    "ver-todo": "pagina-maquinaria",
    nueva: "nueva",
    usada: "usada",
    aditamentos: "aditamentos",
  },
  repuestos: {
    "ver-todo": "pagina-repuestos",
    marcas: "repuestos-marcas",
    categorias: "categorias-tecnicas",
  },
  lubricantes: { "ver-todo": "pagina-lubricantes", marcas: "lubricantes-marcas" },
};

/**
 * Una lista de la tanda 24 (`menuMaquinaria`…) como apartados del árbol: los que salen, en su
 * orden (`apartadosVisibles`: vacía, el menú de siempre). Es el respaldo de un desplegable sin
 * apartados y lo mismo que copia la migración `…_menu_arbol`.
 */
export function arbolDe608(
  filas: ReadonlyArray<ApartadoMenu> | null | undefined,
  desplegable: Desplegable,
): ApartadoArbol[] {
  return apartadosVisibles(filas, desplegable).map((a) =>
    a.tipo === TIPO_ENLACE
      ? { mostrar: true, nombre: a.nombre, tipo: APARTADO_ENLACE, enlace: a.enlace }
      : {
          mostrar: true,
          nombre: a.nombre,
          tipo: APARTADO_LISTA,
          fuente: FUENTE_DE_TIPO_608[desplegable][a.tipo],
        },
  );
}

/** La dirección de una fila, normalizada: sin `?` ni `#` y con la barra final. */
export function claveDeDireccion(href: string | null | undefined): string {
  const limpio = (href ?? "").trim().split(/[?#]/)[0] ?? "";
  return limpio === "" || limpio.endsWith("/") ? limpio : `${limpio}/`;
}

/** ¿Es la fila un desplegable que puede abrir un panel? Visible, con texto y con ruta del sitio. */
export function esDesplegable(fila: FilaBarra | null | undefined): fila is FilaBarra {
  if (!fila || fila.mostrar === false || fila.tipo !== FILA_DESPLEGABLE) return false;
  const href = fila.enlace?.trim() ?? "";
  return !!fila.etiqueta?.trim() && href.startsWith("/") && !href.startsWith("//");
}

const igual = (a: string) => a.trim().toLocaleLowerCase("es");

/** Validación de los apartados de UN desplegable: ni una fuente dos veces ni dos nombres iguales. */
export function validarApartadosDelArbol(filas: unknown): true | string {
  if (!Array.isArray(filas)) return true;
  const nombres = new Set<string>();
  const fuentes = new Set<string>();
  for (const fila of filas as ApartadoArbol[]) {
    const nombre = igual(fila?.nombre ?? "");
    if (nombre && nombres.has(nombre)) {
      return `Hay dos apartados que se llaman «${fila.nombre?.trim()}»: cambia el nombre de uno.`;
    }
    if (nombre) nombres.add(nombre);
    if (fila?.tipo !== APARTADO_LISTA || !fila.fuente) continue;
    if (fuentes.has(fila.fuente)) {
      const etiqueta = FUENTE_POR_VALOR.get(fila.fuente)?.label ?? fila.fuente;
      return `La lista automática «${etiqueta}» está dos veces: cada una va una sola vez por desplegable. Quita una.`;
    }
    fuentes.add(fila.fuente);
  }
  return true;
}

/**
 * Validación de toda la barra: un desplegable que se muestra lleva a una ruta de ESTE sitio (su
 * título abre el panel; en el móvil es el enlace de su fila), y dos filas visibles no comparten
 * dirección si una es un desplegable (el panel se abre por la dirección de su fila).
 */
export function validarBarra(filas: unknown): true | string {
  if (!Array.isArray(filas)) return true;
  const visibles = (filas as FilaBarra[]).filter((f) => f && f.mostrar !== false);
  for (const fila of visibles) {
    if (fila.tipo !== FILA_DESPLEGABLE) continue;
    const href = fila.enlace?.trim() ?? "";
    const nombre = fila.etiqueta?.trim() || "sin texto";
    if (!href.startsWith("/") || href.startsWith("//")) {
      return `El desplegable «${nombre}» necesita en «Enlace» una ruta de este sitio (que empiece por «/»): es la página de su sección.`;
    }
    const clave = claveDeDireccion(href);
    const otra = visibles.find((f) => f !== fila && claveDeDireccion(f.enlace) === clave);
    if (otra) {
      return `«${nombre}» y «${otra.etiqueta?.trim() || "otra fila"}» llevan a la misma dirección (${clave}): un desplegable no puede compartirla con otra fila. Cambia una u oculta una.`;
    }
  }
  return true;
}

/** La etiqueta de la fuente de una lista, para el panel. */
export const etiquetaDeFuente = (fuente: string | null | undefined): string =>
  FUENTE_POR_VALOR.get(fuente ?? "")?.label ?? "sin fuente";

/*
 * EL PANEL: la etiqueta de cada fila (se lee aunque esté plegada) y el esquema del menú.
 */

const TIPO_DE_APARTADO: Record<string, string> = {
  [APARTADO_LISTA]: "lista automática",
  [APARTADO_ENLACE]: "enlace fijo",
  [APARTADO_GRUPO]: "grupo",
};

const cuantos = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** La etiqueta de una fila de la barra: su texto, qué es y si está oculta. */
export function etiquetaDeFilaBarra(
  fila: FilaBarra | undefined,
  numero: number,
): { titulo: string; detalle: string; oculto: boolean } {
  const titulo = fila?.etiqueta?.trim() || `Enlace ${String(numero).padStart(2, "0")} (sin texto)`;
  const detalle =
    fila?.tipo === FILA_DESPLEGABLE
      ? `desplegable · ${cuantos(fila.apartados?.length ?? 0, "apartado", "apartados")}`
      : `enlace · ${fila?.enlace?.trim() || "sin destino"}`;
  return { titulo, detalle, oculto: fila?.mostrar === false };
}

/** La etiqueta de un apartado: su nombre, su tipo (con la fuente o el destino) y si está oculto. */
export function etiquetaDeApartado(
  fila: ApartadoArbol | undefined,
  numero: number,
): { titulo: string; detalle: string; oculto: boolean } {
  const titulo = fila?.nombre?.trim() || `Apartado ${String(numero).padStart(2, "0")} (sin nombre)`;
  const tipo = TIPO_DE_APARTADO[fila?.tipo ?? ""] ?? "sin tipo";
  const detalle =
    fila?.tipo === APARTADO_LISTA
      ? `${tipo} · ${etiquetaDeFuente(fila.fuente)}`
      : fila?.tipo === APARTADO_GRUPO
        ? `${tipo} · ${cuantos(fila.enlaces?.length ?? 0, "enlace", "enlaces")}`
        : `${tipo} · ${fila?.enlace?.trim() || "sin destino"}`;
  return { titulo, detalle, oculto: fila?.mostrar === false };
}

/** La etiqueta de un enlace de un grupo. */
export function etiquetaDeEnlaceDeGrupo(
  fila: EnlaceDeGrupo | undefined,
  numero: number,
): { titulo: string; detalle: string; oculto: boolean } {
  return {
    titulo: fila?.etiqueta?.trim() || `Enlace ${String(numero).padStart(2, "0")} (sin texto)`,
    detalle: fila?.enlace?.trim() || "sin destino",
    oculto: fila?.mostrar === false,
  };
}

/** Una línea del esquema del menú: su nivel, lo que dice y si sale en el sitio. */
export type LineaEsquema = {
  nivel: 1 | 2 | 3;
  texto: string;
  detalle: string;
  sale: boolean;
  /** Por qué no sale, si no sale y no es evidente. */
  motivo?: string;
};

/**
 * EL ESQUEMA DEL MENÚ, para la vista previa del panel: una línea por fila de la barra, por
 * apartado y por enlace de grupo, con lo que saldrá y lo que no (y por qué). Usa las mismas
 * reglas que el sitio (`apartadosQueSalen`, `esDesplegable`).
 */
export function esquemaDelMenu(filas: ReadonlyArray<FilaBarra> | null | undefined): LineaEsquema[] {
  const lineas: LineaEsquema[] = [];
  for (const fila of filas ?? []) {
    const texto = fila?.etiqueta?.trim() ?? "";
    const destino = fila?.enlace?.trim() ?? "";
    const oculta = fila?.mostrar === false;
    const sale = !oculta && !!texto && !!destino;
    const desplegable = fila?.tipo === FILA_DESPLEGABLE;
    const salen = desplegable ? apartadosQueSalen(fila.apartados) : [];
    lineas.push({
      nivel: 1,
      texto: texto || "(sin texto)",
      detalle: desplegable
        ? salen.length > 0 || (fila.apartados?.length ?? 0) === 0
          ? `desplegable → ${destino || "sin destino"}`
          : `desplegable sin apartados que salgan: queda como enlace → ${destino || "sin destino"}`
        : destino || "sin destino",
      sale,
      ...(sale ? {} : { motivo: oculta ? "oculto" : !texto ? "sin texto" : "sin destino" }),
    });
    if (!desplegable) continue;
    if ((fila.apartados?.length ?? 0) === 0) {
      lineas.push({
        nivel: 2,
        texto: "(sin apartados)",
        detalle:
          "en Maquinaria pesada, Repuestos y Lubricantes sale el menú de siempre; en otro, queda como enlace",
        sale,
      });
      continue;
    }
    const fuentes = new Set<string>();
    for (const a of fila.apartados ?? []) {
      const nombre = a?.nombre?.trim() ?? "";
      const uno = apartadosQueSalen([a]);
      const repetida =
        a?.tipo === APARTADO_LISTA && !!a.fuente && a.mostrar !== false && fuentes.has(a.fuente);
      if (a?.tipo === APARTADO_LISTA && a.fuente && a.mostrar !== false) fuentes.add(a.fuente);
      const saleA = sale && uno.length > 0 && !repetida;
      const motivo =
        a?.mostrar === false
          ? "oculto"
          : repetida
            ? "fuente repetida"
            : uno.length === 0
              ? a?.tipo === APARTADO_LISTA
                ? "sin fuente"
                : a?.tipo === APARTADO_GRUPO
                  ? "sin enlaces que salgan"
                  : "sin nombre o sin destino"
              : !sale
                ? "su fila no sale"
                : undefined;
      lineas.push({
        nivel: 2,
        texto: nombre || "(sin nombre)",
        detalle: etiquetaDeApartado(a, 0).detalle,
        sale: saleA,
        ...(saleA || !motivo ? {} : { motivo }),
      });
      if (a?.tipo !== APARTADO_GRUPO) continue;
      for (const e of a.enlaces ?? []) {
        const etiqueta = e?.etiqueta?.trim() ?? "";
        const enlace = e?.enlace?.trim() ?? "";
        const saleE = saleA && e?.mostrar !== false && !!etiqueta && !!enlace;
        lineas.push({
          nivel: 3,
          texto: etiqueta || "(sin texto)",
          detalle: enlace || "sin destino",
          sale: saleE,
          ...(saleE
            ? {}
            : {
                motivo: e?.mostrar === false ? "oculto" : !etiqueta || !enlace ? "incompleto" : "",
              }),
        });
      }
    }
  }
  return lineas;
}

/**
 * Las filas de «Enlaces del menú» a partir del estado del formulario del panel, que llega PLANO
 * (`enlaces.0.etiqueta`, `enlaces.0.apartados.1.fuente`, `enlaces.0.apartados.1.enlaces.0.enlace`…).
 */
export function filasDesdeCampos(valores: Readonly<Record<string, unknown>>): FilaBarra[] {
  const filas: FilaBarra[] = [];
  const sitio = <T>(lista: T[], i: number, vacio: () => T): T => (lista[i] ??= vacio());
  for (const [ruta, valor] of Object.entries(valores)) {
    const p = ruta.split(".");
    if (p[0] !== "enlaces" || p.length < 3) continue;
    const fila = sitio(filas, Number(p[1]), () => ({}) as FilaBarra) as Record<string, unknown>;
    if (p.length === 3) {
      if (p[2] !== "apartados") fila[p[2] as string] = valor;
      continue;
    }
    if (p[2] !== "apartados" || p.length < 5) continue;
    const apartados = (fila.apartados ??= []) as ApartadoArbol[];
    const apartado = sitio(apartados, Number(p[3]), () => ({}) as ApartadoArbol) as Record<
      string,
      unknown
    >;
    if (p.length === 5) {
      if (p[4] !== "enlaces") apartado[p[4] as string] = valor;
      continue;
    }
    if (p[4] !== "enlaces" || p.length !== 7) continue;
    const enlaces = (apartado.enlaces ??= []) as EnlaceDeGrupo[];
    const enlace = sitio(enlaces, Number(p[5]), () => ({}) as EnlaceDeGrupo) as Record<
      string,
      unknown
    >;
    enlace[p[6] as string] = valor;
  }
  // Sin huecos (una fila borrada a medias) y cada lista en su orden.
  const limpio = <T>(lista: T[] | undefined | null): T[] => (lista ?? []).filter(Boolean);
  return limpio(filas).map((f) => ({
    ...f,
    apartados: limpio(f.apartados as ApartadoArbol[] | undefined).map((a) => ({
      ...a,
      enlaces: limpio(a.enlaces as EnlaceDeGrupo[] | undefined),
    })),
  }));
}
