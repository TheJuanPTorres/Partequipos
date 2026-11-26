import { esEnlaceTiendaValido } from "./enlaceTienda";

/**
 * LA HOJA DE ENLACES DE LA TIENDA (2026-11-26): carga masiva de «Enlace en la tienda» por CSV, para
 * cuando la tienda tenga sus páginas. Lógica pura, con pruebas; el script
 * (`scripts/tienda/enlaces-csv.ts`) solo le da la base.
 *
 * Una fila por elemento que admite enlace, con una CLAVE estable (los ids de Payload, no los
 * nombres, que se repiten): `modelo:<id>`, `categoria:<id>`, `grupo:<id>/<fila>` y
 * `producto:<id>/<fila del grupo>/<fila del producto>`. Las columnas `nombre` y `contexto` solo
 * sirven para que quien rellena la hoja sepa qué es cada fila; no se leen al aplicar.
 *
 * Reglas al aplicar:
 * - Solo `https://`. Una fila inválida, o una clave que ya no existe, DETIENE todo (no se escribe
 *   nada): una hoja a medias es peor que ninguna.
 * - Una fila con `enlace` vacío NO se toca (vacío = «no he puesto nada»). Para quitar un enlace,
 *   se escribe `-`.
 * - Lo que no está en la hoja no se toca.
 */

export const COLUMNAS = ["tipo", "clave", "nombre", "contexto", "enlace"] as const;
export type Tipo = "modelo" | "categoria" | "grupo" | "producto";
export type FilaHoja = {
  tipo: Tipo;
  clave: string;
  nombre: string;
  contexto: string;
  enlace: string;
};

/** Lo mínimo de las colecciones que lee la hoja (los tipos de Payload cumplen con esto). */
export type ModeloEnHoja = {
  id: number | string;
  nombre?: string | null;
  enlaceTienda?: string | null;
};
export type CategoriaEnHoja = {
  id: number | string;
  nombre?: string | null;
  enlaceTienda?: string | null;
  grupos?:
    | {
        id?: string | null;
        nombre?: string | null;
        enlaceTienda?: string | null;
        productos?:
          { id?: string | null; texto?: string | null; enlaceTienda?: string | null }[] | null;
      }[]
    | null;
};

export const claveModelo = (id: number | string) => `modelo:${id}`;
export const claveCategoria = (id: number | string) => `categoria:${id}`;
export const claveGrupo = (cat: number | string, fila: string) => `grupo:${cat}/${fila}`;
export const claveProducto = (cat: number | string, grupo: string, fila: string) =>
  `producto:${cat}/${grupo}/${fila}`;

/** Todas las filas de la hoja con su enlace actual (vacío si no tienen). */
export function aplanar(modelos: ModeloEnHoja[], categorias: CategoriaEnHoja[]): FilaHoja[] {
  const filas: FilaHoja[] = [];
  for (const m of modelos) {
    filas.push({
      tipo: "modelo",
      clave: claveModelo(m.id),
      nombre: m.nombre ?? "",
      contexto: "Modelo de repuestos",
      enlace: m.enlaceTienda ?? "",
    });
  }
  for (const c of categorias) {
    const cat = c.nombre ?? "";
    filas.push({
      tipo: "categoria",
      clave: claveCategoria(c.id),
      nombre: cat,
      contexto: "Categoría técnica",
      enlace: c.enlaceTienda ?? "",
    });
    for (const g of c.grupos ?? []) {
      if (!g.id) continue;
      filas.push({
        tipo: "grupo",
        clave: claveGrupo(c.id, g.id),
        nombre: g.nombre ?? "",
        contexto: `Tipo de repuesto de ${cat}`,
        enlace: g.enlaceTienda ?? "",
      });
      for (const p of g.productos ?? []) {
        if (!p.id) continue;
        filas.push({
          tipo: "producto",
          clave: claveProducto(c.id, g.id, p.id),
          nombre: p.texto ?? "",
          contexto: `Producto de ${g.nombre ?? ""} (${cat})`,
          enlace: p.enlaceTienda ?? "",
        });
      }
    }
  }
  return filas;
}

/* ───── CSV ───── */

const comilla = (t: string) => (/[;"\r\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t);

/** El CSV de la hoja: separado por `;` y con BOM, que es como lo abre bien el Excel en español. */
export function serializarCsv(filas: FilaHoja[]): string {
  const lineas = [COLUMNAS.join(";")];
  for (const f of filas) lineas.push(COLUMNAS.map((c) => comilla(f[c])).join(";"));
  return `﻿${lineas.join("\r\n")}\r\n`;
}

/** Parte un CSV en filas de celdas (comillas dobles, saltos de línea dentro de una celda). */
function celdas(texto: string, sep: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let dentro = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!;
    if (dentro) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i++;
        } else dentro = false;
      } else celda += c;
    } else if (c === '"') dentro = true;
    else if (c === sep) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(celda);
      celda = "";
      if (fila.some((x) => x.trim() !== "")) filas.push(fila);
      fila = [];
    } else celda += c;
  }
  fila.push(celda);
  if (fila.some((x) => x.trim() !== "")) filas.push(fila);
  return filas;
}

export type LecturaCsv = { filas: Pick<FilaHoja, "clave" | "enlace">[]; errores: string[] };

/**
 * Lee la hoja que devuelve el cliente. Solo hacen falta las columnas `clave` y `enlace` (en
 * cualquier orden); el separador (`;` o `,`) se detecta en la cabecera. Una clave repetida es un
 * error: no se sabría cuál vale.
 */
export function leerCsv(textoCrudo: string): LecturaCsv {
  const texto = textoCrudo.replace(/^﻿/, "");
  const primera = texto.split(/\r?\n/, 1)[0] ?? "";
  const sep = primera.split(";").length >= primera.split(",").length ? ";" : ",";
  const todas = celdas(texto, sep);
  const cab = (todas[0] ?? []).map((c) => c.trim().toLowerCase());
  const iClave = cab.indexOf("clave");
  const iEnlace = cab.indexOf("enlace");
  if (iClave < 0 || iEnlace < 0) {
    return { filas: [], errores: ["La hoja no tiene las columnas «clave» y «enlace»."] };
  }
  const errores: string[] = [];
  const vistas = new Set<string>();
  const filas: LecturaCsv["filas"] = [];
  todas.slice(1).forEach((c, i) => {
    const clave = (c[iClave] ?? "").trim();
    if (!clave) {
      errores.push(`Línea ${i + 2}: falta la clave.`);
      return;
    }
    if (vistas.has(clave)) {
      errores.push(`Línea ${i + 2}: la clave «${clave}» está repetida.`);
      return;
    }
    vistas.add(clave);
    filas.push({ clave, enlace: (c[iEnlace] ?? "").trim() });
  });
  return { filas, errores };
}

/* ───── El plan ───── */

export type Cambio = { clave: string; antes: string; despues: string };
export type Plan = {
  cambios: Cambio[];
  sinCambio: number;
  /** Filas vacías de la hoja: no se tocan. */
  vacias: number;
  invalidas: { clave: string; enlace: string; motivo: string }[];
  noEncontradas: string[];
  /** Hay algo que impide aplicar (inválidas, claves que no existen o errores de lectura). */
  bloqueado: boolean;
};

/** Marca de la hoja para QUITAR el enlace de una fila. */
export const QUITAR = "-";

/**
 * Compara la hoja con lo guardado (`actual`: clave → enlace vigente, vacío si no tiene). No escribe
 * nada: devuelve qué cambiaría y si algo lo impide.
 */
export function planear(
  hoja: LecturaCsv["filas"],
  actual: ReadonlyMap<string, string>,
  erroresDeLectura: string[] = [],
): Plan {
  const plan: Plan = {
    cambios: [],
    sinCambio: 0,
    vacias: 0,
    invalidas: [],
    noEncontradas: [],
    bloqueado: erroresDeLectura.length > 0,
  };
  for (const f of hoja) {
    if (!actual.has(f.clave)) {
      plan.noEncontradas.push(f.clave);
      continue;
    }
    if (f.enlace === "") {
      plan.vacias++;
      continue;
    }
    const antes = actual.get(f.clave) ?? "";
    if (f.enlace === QUITAR) {
      if (antes === "") plan.sinCambio++;
      else plan.cambios.push({ clave: f.clave, antes, despues: "" });
      continue;
    }
    if (!esEnlaceTiendaValido(f.enlace)) {
      plan.invalidas.push({
        clave: f.clave,
        enlace: f.enlace,
        motivo: "no es una dirección https:// completa",
      });
      continue;
    }
    if (f.enlace === antes) plan.sinCambio++;
    else plan.cambios.push({ clave: f.clave, antes, despues: f.enlace });
  }
  plan.bloqueado ||= plan.invalidas.length > 0 || plan.noEncontradas.length > 0;
  return plan;
}

/** El mapa clave → enlace vigente, para `planear`. */
export function mapaActual(filas: FilaHoja[]): Map<string, string> {
  return new Map(filas.map((f) => [f.clave, f.enlace]));
}

/** Parte una clave en sus piezas; `null` si no es una clave válida. */
export function partirClave(clave: string): { tipo: Tipo; ids: string[] } | null {
  const m = /^(modelo|categoria|grupo|producto):(.+)$/.exec(clave);
  if (!m) return null;
  const ids = m[2]!.split("/");
  const esperadas = { modelo: 1, categoria: 1, grupo: 2, producto: 3 }[m[1] as Tipo];
  return ids.length === esperadas && ids.every(Boolean) ? { tipo: m[1] as Tipo, ids } : null;
}
