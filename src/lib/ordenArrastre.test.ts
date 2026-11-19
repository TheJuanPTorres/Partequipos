import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

import type { CollectionConfig, Field } from "payload";

import { ORDEN_ARRASTRE, porClave } from "./ordenArrastre";

/*
 * GUARDARRAÍL DEL ORDEN POR ARRASTRE (2026-11-19). Si una consulta pública de una colección
 * ordenable sigue ordenando por «Orden» o por nombre, el editor arrastra en el panel y la web no
 * cambia, sin ningún error. Para repuestos (D): añadir sus colecciones a `ORDEN_ARRASTRE` y
 * quitarlas de `PENDIENTES_DE_D`.
 */

const RAIZ = path.resolve(process.cwd(), "src");

/** Las de repuestos: su orden ya existe (#510) y sus consultas las pasa D. */
const PENDIENTES_DE_D = ["marcas", "categorias-tecnicas", "tipos-equipo", "modelos-repuesto"];

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

/** Lo que Payload ordena por arrastre: colección → su campo de orden. */
async function ordenDeLaConfiguracion(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  const todas = await colecciones();
  for (const c of todas) if (c.orderable) mapa.set(c.slug, "_order");
  for (const c of todas)
    for (const j of joinsOrdenables(c.fields)) {
      assert.ok(!mapa.has(j.collection), `«${j.collection}» se ordena de dos maneras`);
      mapa.set(j.collection, `_${j.collection}_${j.name}_order`);
    }
  return mapa;
}

function ficheros(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ficheros(p);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });
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
          // Una sola fila (por dirección web): no hay orden que respetar.
          /\blimit: 1\b/.test(llamada) ||
          // Con su motivo escrito: «orden-libre: …».
          /orden-libre: \S/.test(llamada);
        if (!bien) fallos.push(`${ruta}:${texto.slice(0, m.index).split("\n").length} (${c})`);
      }
  return fallos;
}

describe("orden por arrastre en la web", () => {
  it("la lista es la de la configuración (sin las de repuestos, que pasa D)", async () => {
    const config = await ordenDeLaConfiguracion();
    for (const slug of PENDIENTES_DE_D) {
      assert.ok(config.has(slug), `«${slug}» ya no es ordenable: quítala de PENDIENTES_DE_D`);
      config.delete(slug);
    }
    assert.deepEqual(Object.fromEntries([...config].sort()), {
      ...Object.fromEntries(Object.entries(ORDEN_ARRASTRE).sort()),
    });
  });

  it("toda consulta pública de una colección ordenable ordena por su arrastre", () => {
    const archivos = ficheros(RAIZ)
      .map((p) => path.relative(process.cwd(), p))
      .filter((r) => !EXCLUIDOS.some((x) => r.startsWith(x)))
      .map((ruta) => ({ ruta, texto: fs.readFileSync(ruta, "utf8") }));
    assert.ok(archivos.length > 50, "no encontró el código del sitio");
    assert.deepEqual(consultasSinOrden(archivos), []);
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
