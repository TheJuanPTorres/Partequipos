import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

import type { CollectionConfig, Field } from "payload";

import { ORDEN_ARRASTRE, ORDEN_LISTADO, porClave } from "./ordenArrastre";

/*
 * GUARDARRAÍL DEL ORDEN POR ARRASTRE (2026-11-19). Si una consulta pública de una colección
 * ordenable sigue ordenando por «Orden» o por nombre, el editor arrastra en el panel y la web no
 * cambia, sin ningún error.
 */

const RAIZ = path.resolve(process.cwd(), "src");

/** Fuera del sitio público, o con su propio orden. */
const EXCLUIDOS = [
  path.join("src", "collections"),
  path.join("src", "app", "(payload)"),
  path.join("src", "components", "admin"),
  path.join("src", "lib", "panel"),
  path.join("src", "migrations"),
  // El mapa de redirects: el orden no importa.
  path.join("src", "app", "(site)", "api", "redirects-map"),
  // El buscador (de D) ordena por su cuenta: por coincidencia y nombre.
  path.join("src", "lib", "buscador"),
  path.join("src", "lib", "queries", "getBusqueda.ts"),
];

async function colecciones(): Promise<CollectionConfig[]> {
  const dir = path.join(RAIZ, "collections");
  const lista: CollectionConfig[] = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts") && !x.endsWith(".test.ts"))) {
    const modulo: Record<string, unknown> = await import(pathToFileURL(path.join(dir, f)).href);
    for (const e of Object.values(modulo))
      if (e && typeof e === "object" && "slug" in e && "fields" in e)
        lista.push(e as CollectionConfig);
  }
  return lista;
}

function joinsOrdenables(campos: Field[]): { name: string; collection: string }[] {
  return campos.flatMap((c): { name: string; collection: string }[] => {
    if (c.type === "join" && c.orderable && typeof c.collection === "string")
      return [{ name: c.name, collection: c.collection }];
    if (c.type === "tabs") return c.tabs.flatMap((t) => joinsOrdenables(t.fields));
    if ("fields" in c && Array.isArray(c.fields)) return joinsOrdenables(c.fields);
    return [];
  });
}

/**
 * Lo que Payload ordena por arrastre: colección → su campo de orden (el del join si lo tiene) y,
 * aparte, las que ADEMÁS son `orderable` para los listados que mezclan padres (`ORDEN_LISTADO`).
 */
async function ordenDeLaConfiguracion(): Promise<{
  arrastre: Map<string, string>;
  listado: Map<string, string>;
}> {
  const arrastre = new Map<string, string>();
  const listado = new Map<string, string>();
  const todas = await colecciones();
  for (const c of todas) if (c.orderable) arrastre.set(c.slug, "_order");
  const joins = new Set<string>();
  for (const c of todas)
    for (const j of joinsOrdenables(c.fields)) {
      assert.ok(!joins.has(j.collection), `«${j.collection}» tiene dos joins ordenables`);
      joins.add(j.collection);
      if (arrastre.has(j.collection)) listado.set(j.collection, "_order");
      arrastre.set(j.collection, `_${j.collection}_${j.name}_order`);
    }
  return { arrastre, listado };
}

function ficheros(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ficheros(p);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });
}

/** El código del sitio público (sin lo de `EXCLUIDOS`). */
function archivosDelSitio(): { ruta: string; texto: string }[] {
  return ficheros(RAIZ)
    .map((p) => path.relative(process.cwd(), p))
    .filter((r) => !EXCLUIDOS.some((x) => r.startsWith(x)))
    .map((ruta) => ({ ruta, texto: fs.readFileSync(ruta, "utf8") }));
}

/** El texto de la llamada `.find(` que contiene `pos`, o `null` si es un `count`/`findByID`. */
function llamadaFind(texto: string, pos: number): string | null {
  const inicios = [".find(", ".count(", ".findByID("].map((f) => [f, texto.lastIndexOf(f, pos)]);
  const [cual, inicio] = inicios.reduce((a, b) => (Number(b[1]) > Number(a[1]) ? b : a));
  if (cual !== ".find(") return null;
  let nivel = 0;
  for (let i = texto.indexOf("(", Number(inicio)); i < texto.length; i++) {
    if (texto[i] === "(") nivel++;
    else if (texto[i] === ")" && --nivel === 0) return texto.slice(Number(inicio), i + 1);
  }
  return texto.slice(Number(inicio));
}

/** Las consultas de colecciones ordenables que no ordenan por su arrastre ni dicen por qué. */
function consultasSinOrden(archivos: { ruta: string; texto: string }[]): string[] {
  const fallos: string[] = [];
  for (const { ruta, texto } of archivos)
    for (const c of Object.keys(ORDEN_ARRASTRE))
      for (const m of texto.matchAll(new RegExp(`collection: "${c}"`, "g"))) {
        const llamada = llamadaFind(texto, m.index ?? 0);
        if (llamada === null) continue;
        const bien =
          llamada.includes(`ordenDe("${c}")`) ||
          // Un listado que mezcla padres, con el arrastre de la lista de la colección.
          (c in ORDEN_LISTADO && llamada.includes(`ordenDeListado("${c}")`)) ||
          // Una sola fila (por dirección web): no hay orden que respetar.
          /\blimit: 1\b/.test(llamada) ||
          // Con su motivo escrito: «orden-libre: …».
          /orden-libre: \S/.test(llamada);
        if (!bien) fallos.push(`${ruta}:${texto.slice(0, m.index).split("\n").length} (${c})`);
      }
  return fallos;
}

/*
 * AMPLIADO EN LA TANDA 21 (PR-5, 2026-11-23): «todo lo de la web pública se ordena desde el panel».
 * Además de lo de arriba, ningún listado público ordena POR NOMBRE sin decir por qué:
 * - una consulta de CUALQUIER colección con `sort` por `nombre` o `titulo`;
 * - un `.sort(` en JavaScript que compara con `localeCompare`.
 * El motivo se escribe en un comentario `orden-libre: …` dentro de la consulta o en las 3 líneas de
 * antes del `.sort(` (p. ej. las opciones de un filtro, el buscador o una foto que se elige).
 */

/** Las consultas (de cualquier colección) que ordenan por nombre o título sin motivo. */
function consultasPorNombre(archivos: { ruta: string; texto: string }[]): string[] {
  const fallos: string[] = [];
  for (const { ruta, texto } of archivos)
    for (const m of texto.matchAll(/collection: "([a-z-]+)"/g)) {
      const llamada = llamadaFind(texto, m.index ?? 0);
      if (llamada === null || /orden-libre: \S/.test(llamada)) continue;
      if (/\bsort: (?:"-?(?:nombre|titulo)"|\[[^\]]*"-?(?:nombre|titulo)")/.test(llamada))
        fallos.push(`${ruta}:${texto.slice(0, m.index).split("\n").length} (${m[1]})`);
    }
  return fallos;
}

/** Los `.sort(` con `localeCompare` (en esa línea o las 4 siguientes) sin `orden-libre:` encima. */
function ordenacionesPorNombre(archivos: { ruta: string; texto: string }[]): string[] {
  const fallos: string[] = [];
  for (const { ruta, texto } of archivos) {
    const lineas = texto.split("\n");
    lineas.forEach((l, i) => {
      if (!/\.sort\(/.test(l)) return;
      if (!/localeCompare/.test(lineas.slice(i, i + 5).join("\n"))) return;
      if (/orden-libre: \S/.test(lineas.slice(Math.max(0, i - 3), i + 1).join("\n"))) return;
      fallos.push(`${ruta}:${i + 1}`);
    });
  }
  return fallos;
}

describe("orden por arrastre en la web", () => {
  it("la lista es la de la configuración", async () => {
    const { arrastre, listado } = await ordenDeLaConfiguracion();
    assert.deepEqual(Object.fromEntries([...arrastre].sort()), {
      ...Object.fromEntries(Object.entries(ORDEN_ARRASTRE).sort()),
    });
    assert.deepEqual(Object.fromEntries([...listado].sort()), {
      ...Object.fromEntries(Object.entries(ORDEN_LISTADO).sort()),
    });
  });

  it("toda consulta pública de una colección ordenable ordena por su arrastre", () => {
    const archivos = archivosDelSitio();
    assert.ok(archivos.length > 50, "no encontró el código del sitio");
    assert.deepEqual(consultasSinOrden(archivos), []);
  });

  it("ninguna consulta pública ordena por nombre o título sin su motivo (tanda 21)", () => {
    assert.deepEqual(consultasPorNombre(archivosDelSitio()), []);
  });

  it("ningún `.sort(` público ordena por nombre (localeCompare) sin su motivo (tanda 21)", () => {
    assert.deepEqual(ordenacionesPorNombre(archivosDelSitio()), []);
  });

  it("y los dos fallan cuando deben (comprobación del guardián)", () => {
    const q = (extra: string) => ({
      ruta: "q.ts",
      texto: `await payload.find({\n  collection: "articulos",\n  sort: "titulo",${extra}\n});`,
    });
    assert.deepEqual(consultasPorNombre([q("")]), ["q.ts:2 (articulos)"]);
    assert.deepEqual(consultasPorNombre([q("\n  // orden-libre: solo para las rutas")]), []);
    const s = (antes: string) => ({
      ruta: "s.ts",
      texto: `${antes}const l = [...x]\n  .sort((a, b) =>\n    a.nombre.localeCompare(b.nombre, "es"));`,
    });
    assert.deepEqual(ordenacionesPorNombre([s("")]), ["s.ts:2"]);
    assert.deepEqual(ordenacionesPorNombre([s("// orden-libre: opciones de un filtro\n")]), []);
    const numeros = { ruta: "n.ts", texto: "[3, 1].sort((a, b) => a - b);" };
    assert.deepEqual(ordenacionesPorNombre([numeros]), []);
  });

  it("y falla cuando una ordena por «Orden» o por nombre (comprobación del guardián)", () => {
    const malo = (sort: string) => ({
      ruta: "x.ts",
      texto: `await payload.find({\n  collection: "sedes",\n  depth: 1,\n  sort: ${sort},\n});`,
    });
    assert.deepEqual(consultasSinOrden([malo(`"orden"`)]), ["x.ts:2 (sedes)"]);
    assert.deepEqual(consultasSinOrden([malo(`["orden", "nombre"]`)]), ["x.ts:2 (sedes)"]);
    assert.deepEqual(consultasSinOrden([malo(`ordenDe("sedes")`)]), []);
    // Un `count` no ordena nada.
    const contar = `await payload.count({ collection: "sedes", where: {} });`;
    assert.deepEqual(consultasSinOrden([{ ruta: "x.ts", texto: contar }]), []);
  });
});

describe("porClave", () => {
  it("ordena como Postgres en una base C.UTF-8 (por bytes), y sin clave al final", () => {
    const claves = ["a1", "Zz", "a0V", null, "a0", "b00"];
    assert.deepEqual([...claves].sort(porClave), ["Zz", "a0", "a0V", "a1", "b00", null]);
  });
});
